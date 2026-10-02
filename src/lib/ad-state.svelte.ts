/**
 * 广告运行期协调层：Cookie 同意 + 拦截器检测 + AdSense 投放队列。
 *
 * 为什么集中管理（而不是散在 Ad 组件里）：
 * 1. CookieConsent 征求同意，Ad 组件按同意结果决定投放方式，两者必须共享
 *    同一个 localStorage key 与同一份内存状态，否则会出现「已拒绝仍投个性化
 *    广告」或「SPA 跳转后同意状态丢失」。
 * 2. 同意与拒绝都要有广告收益：同意走常规个性化投放；拒绝走 Google 官方的
 *    Non-Personalized Ads（googlefc + npa:1）通道，仍可展示非个性化广告。
 * 3. adsbygoogle.js 是 async 脚本，Ad 组件挂载时常常还没到，需要一个可订阅的
 *    就绪信号，脚本到位后再统一 push，避免漏投。
 * 4. 拦截器会让脚本静默加载失败。若不检测，所有广告位会一直保留预留高度，
 *    形成大片空白；检测到后立即塌缩。
 */

const CONSENT_KEY = 'gf-cookie-consent';

/** true=已同意个性化广告，false=已拒绝（走非个性化），null=尚未表态 */
let consentGranted = $state<boolean | null>(null);
let consentLoaded = $state(false);

/** 是否检测到广告拦截器；null=尚未判定 */
let blocked = $state<boolean | null>(null);

/** AdSense 主脚本是否已就绪 */
let sdkReady = $state(false);

let sdkWaiters: Array<() => void> = [];

export function getConsentGranted(): boolean | null {
	return consentGranted;
}

export function isConsentLoaded(): boolean {
	return consentLoaded;
}

export function isAdBlocked(): boolean | null {
	return blocked;
}

export function isSdkReady(): boolean {
	return sdkReady;
}

function readStoredConsent(): boolean | null {
	try {
		const raw = localStorage.getItem(CONSENT_KEY);
		if (raw === '1') return true;
		if (raw === '0') return false;
	} catch {
		/* 隐私模式下 localStorage 可能抛错，按未表态处理 */
	}
	return null;
}

/**
 * 客户端启动时调用一次。
 * @param consentImplied 该地区是否视同已同意（例如中国大陆，无强制同意要求）
 */
export function initAdState(consentImplied: boolean): void {
	if (typeof window === 'undefined' || consentLoaded) return;
	consentLoaded = true;
	consentGranted = consentImplied ? true : readStoredConsent();
	scheduleBlockerProbe();
}

/** CookieConsent 收到用户选择时调用 */
export function setConsent(granted: boolean): void {
	consentGranted = granted;
	try {
		localStorage.setItem(CONSENT_KEY, granted ? '1' : '0');
	} catch {
		/* 写入失败只影响下次会话，内存状态仍然生效 */
	}
}

/**
 * 拦截器探测：拦截器会阻断 googlesyndication 域名。
 * 若若干秒后脚本仍未就绪且队列里只剩我们 push 的空对象，则判定为被拦截。
 */
function scheduleBlockerProbe(): void {
	if (blocked !== null) return;
	window.setTimeout(() => {
		if (sdkReady) return;
		const queue = adQueue();
		if (Array.isArray(queue) && queue.length > 0 && queue.every(isEmptyPush)) {
			blocked = true;
		}
	}, 3500);
}

function isEmptyPush(value: unknown): boolean {
	return typeof value === 'object' && value !== null && Object.keys(value as object).length === 0;
}

function adQueue(): unknown[] | undefined {
	return window.adsbygoogle;
}

/** 注册「脚本就绪」回调；已就绪则同步执行。脚本到位后统一冲刷等待队列。 */
export function whenSdkReady(cb: () => void): void {
	if (sdkReady || blocked === true) {
		cb();
		return;
	}
	sdkWaiters.push(cb);
}

/** 布局层在 adsbygoogle.js onload 时调用，冲刷所有等待中的广告位 */
export function markSdkReady(): void {
	if (sdkReady) return;
	sdkReady = true;
	flushWaiters();
}

/**
 * 脚本加载失败时调用：多数情况是拦截器，直接判定为 blocked，
 * 广告位立即塌缩，不必再等超时探测。
 */
export function markSdkBlocked(): void {
	if (sdkReady) return;
	blocked = true;
	flushWaiters();
}

function flushWaiters(): void {
	const waiters = sdkWaiters;
	sdkWaiters = [];
	for (const cb of waiters) {
		try {
			cb();
		} catch {
			/* 单个广告位异常不影响其它广告位 */
		}
	}
}

/** 广告是否已确定可以投放（拦截器命中则永不投放） */
export function canRenderAds(): boolean {
	return consentGranted !== null && blocked !== true;
}

/**
 * 必须在主 adsbygoogle.js 之后紧跟输出的初始化片段。
 * Google 官方的 Non-Personalized Ads 用法：没有这行，
 * window.googlefc.callbackQueue 不会被创建，拒绝同意的广告位将永远拿不到广告。
 */
export const GOOGLEFC_INIT = '(adsbygoogle=window.adsbygoogle||[]).push({googlefc:true});';

/**
 * 请求 Google FC（非个性化广告）通道。
 * 脚本标签里已经 push 过 {googlefc:true}，这里只需要压入回调。
 * googlefc 不可用时直接放弃投放：此时无法表达 npa，
 * 强行走普通队列等同于投放个性化广告，违反用户选择。
 */
function pushViaGoogleFc(ins: Element): void {
	const queue = window.googlefc?.callbackQueue;
	if (!queue || typeof queue.push !== 'function') return;
	const request = { location: [ins], npa: 1 };
	if (typeof queue.init !== 'function') {
		queue.push(request);
		return;
	}
	queue.init(() => queue.push?.(request));
}

/**
 * 统一的投放入口，供每个广告位在「脚本就绪后」调用一次。
 * 内部保证同一 ins 只会被 push 一次（SPA 重挂载安全）。
 */
export function requestAd(ins: Element): void {
	if (ins.getAttribute('data-gf-requested') === '1') return;
	ins.setAttribute('data-gf-requested', '1');

	const queue = adQueue();
	if (!Array.isArray(queue)) return;

	if (consentGranted === true) {
		queue.push({});
		return;
	}
	// 拒绝同意：仅尝试非个性化通道
	pushViaGoogleFc(ins);
}
