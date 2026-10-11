/**
 * 广告运行期协调层：Cookie 同意 + 拦截器状态。
 *
 * 为什么集中管理（而不是散在 Ad 组件里）：
 * 1. CookieConsent 征求同意，Ad 组件按同意结果决定投放方式，两者必须共享
 *    同一份内存状态，否则会出现「已拒绝仍投个性化广告」或「SPA 跳转后同意
 *    状态丢失」。
 * 2. 同意与拒绝都要有广告收益：同意走常规队列投放；拒绝走 Google 官方的
 *    Non-Personalized Ads（googlefc + npa:1）通道，仍可展示非个性化广告。
 * 3. adsbygoogle.js 是 async 脚本。`window.adsbygoogle` 本身就是「先入队、
 *    脚本到位后消费」的队列（数组），因此不需要额外的就绪等待——直接 push
 *    即可，脚本加载前后都有效；脚本加载后它会被替换成带 push 方法的对象。
 */

const CONSENT_KEY = 'gf-cookie-consent';

/** true=已同意个性化广告，false=已拒绝（走非个性化），null=尚未表态 */
let consentGranted = $state<boolean | null>(null);
let consentLoaded = $state(false);

/** 是否检测到广告拦截器；null=尚未判定 */
let blocked = $state<boolean | null>(null);

export function getConsentGranted(): boolean | null {
	return consentGranted;
}

export function isConsentLoaded(): boolean {
	return consentLoaded;
}

export function isAdBlocked(): boolean | null {
	return blocked;
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
 * 主脚本加载失败时调用：多数情况是广告拦截器，直接判定为 blocked，
 * 广告位立即塌缩。
 */
export function markSdkBlocked(): void {
	blocked = true;
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
 * 统一的投放入口，供每个广告位调用一次。
 * 直接 push 到 adsbygoogle 队列即可——脚本加载前它是普通数组，
 * 加载后它是带 push 方法的对象，两种形态都接受 push。
 * 内部保证同一 ins 只会被 push 一次（SPA 重挂载安全）。
 */
export function requestAd(ins: Element): void {
	if (ins.getAttribute('data-gf-requested') === '1') return;
	ins.setAttribute('data-gf-requested', '1');

	// 未表态时不投放（无法判断个性化/非个性化）。
	if (consentGranted === true) {
		const queue = (window.adsbygoogle = window.adsbygoogle || []);
		queue.push({});
		return;
	}
	// 拒绝同意：仅尝试非个性化通道
	if (consentGranted === false) pushViaGoogleFc(ins);
}
