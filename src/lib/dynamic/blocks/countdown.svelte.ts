/**
 * 区块 countdown · 类型 countdown
 *
 * `/s`、`/l` 跳转页的延时文案。它没有请求：默认文案就是构建期写进 HTML 的
 * 「{countdown} 秒后到达」，水合后每秒覆盖同一个文本节点，到 1 秒时跳转。
 *
 * 行为与旧实现一致：
 * - hash 变化时重算目标 URL（站内查询串 / 路径会跟着走）；
 * - 倒计时到 1 秒时立刻显示加载文案并开始跳转；
 * - `metaRefresh` 打开时额外维护 meta refresh 兜底（根路由 /s、/l 用它）。
 */

import { dynamicConfig } from '$config';
import { t, type Lang } from '$i18n';

export interface CountdownOptions {
	lang: Lang;
	delaySec: number;
	/** 每次需要目标地址时调用，读当前 hash */
	buildUrl: () => string;
	/** 是否维护 meta refresh 兜底 */
	metaRefresh?: boolean;
}

export class Countdown {
	readonly lang: Lang;
	readonly delaySec: number;

	remaining = $state(0);
	loading = $state(false);
	text = $state('');
	/** 0–1：用于中转页的进度条，比纯文字更能说明"还要等多久" */
	progress = $state(0);

	#buildUrl: () => string;
	#metaRefresh: boolean;
	#timer: ReturnType<typeof setInterval> | undefined;
	#metaEl: HTMLMetaElement | null = null;
	#started = false;

	constructor(o: CountdownOptions) {
		this.lang = o.lang;
		this.delaySec = o.delaySec;
		this.remaining = o.delaySec;
		this.#buildUrl = o.buildUrl;
		this.#metaRefresh = o.metaRefresh === true;
		this.text = t(o.lang, 'redirect.waiting', { countdown: String(o.delaySec) });
	}

	/** 水合后启动；prerender / SSR 不执行 effect */
	start(): void {
		if (this.#started || typeof window === 'undefined') return;
		this.#started = true;

		// 等待时间为 0：不做倒计时，立即跳转
		if (this.delaySec <= 0) {
			window.location.assign(this.#buildUrl());
			return;
		}

		if (this.#metaRefresh) this.#ensureMeta();
		this.#sync();
		window.addEventListener('hashchange', this.#onHash);
		this.#timer = setInterval(() => this.#tick(), dynamicConfig.countdown.tickMs);
	}

	stop(): void {
		clearInterval(this.#timer);
		this.#timer = undefined;
		if (typeof window !== 'undefined') window.removeEventListener('hashchange', this.#onHash);
		this.#metaEl?.remove();
		this.#metaEl = null;
	}

	#tick(): void {
		this.remaining -= 1;
		// 显示到 1 秒时立即开始跳转（与旧实现一致）
		if (this.remaining <= 1) {
			// 只停计时器，保留 meta refresh 兜底：显式跳转失败时还有一层保险
			clearInterval(this.#timer);
			this.#timer = undefined;
			this.loading = true;
			this.text = t(this.lang, 'redirect.loading');
			window.location.assign(this.#buildUrl());
			return;
		}
		this.#sync();
	}

	#sync(): void {
		this.text = t(this.lang, 'redirect.waiting', { countdown: String(this.remaining) });
		this.progress = this.delaySec > 0 ? 1 - this.remaining / this.delaySec : 1;
		if (this.#metaEl) this.#metaEl.content = `${this.remaining + 2};url=${this.#buildUrl()}`;
	}

	#ensureMeta(): void {
		if (this.#metaEl) return;
		const meta = document.createElement('meta');
		meta.httpEquiv = 'refresh';
		meta.id = 'redirect-meta';
		document.head.appendChild(meta);
		this.#metaEl = meta;
	}

	#onHash = (): void => {
		this.#sync();
	};
}

export function createCountdown(o: CountdownOptions): Countdown {
	return new Countdown(o);
}
