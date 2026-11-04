/**
 * 区块 download-probe · 类型 probe + list
 *
 * 下载加速的「测速 → 选最快节点 → 跳转」流程。
 *
 * 冷加载：构建期写出完整的流程骨架 —— 标题、状态文案、进度条、固定数量的
 * 节点行（节点域名来自 `config.json` 的 downloadNodes，是确定值）、提示语。
 * 水合后逐个探测节点，只覆盖行内延迟、状态图标与进度条宽度。
 *
 * 网络部分只有出口 IP 走 `core/request`；节点测速是在隐藏 iframe 里加载
 * 节点上的 `gfork.js` 并等 postMessage，不是 fetch（无法用 fetch 表达 CORS 探测）。
 */

import { dynamicConfig, getDownloadDomains, siteConfig } from '$config';
import { t, type Lang } from '$i18n';
import { request } from '../core/request';

export const DOWNLOAD_BLOCK_ID = 'download-probe';

export type DownloadStage = 'ip' | 'testing' | 'success' | 'fallback' | 'no-path';

export interface DownloadNodeRow {
	domain: string;
	/** null = 还没测得结果 */
	latency: number | null;
}

const DLC = siteConfig.download;

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDomain(domain: string): string {
	return domain.replace('https://', '');
}

/** 构建期占位行：配置里前 N 个节点，顺序固定（运行时会换成打乱后的子集） */
export function fallbackNodes(): DownloadNodeRow[] {
	return siteConfig.downloadNodes
		.slice(0, DLC.testCount)
		.map((domain) => ({ domain, latency: null }));
}

export class DownloadProbe {
	readonly lang: Lang;

	stage = $state<DownloadStage>('ip');
	/** 主标题（随阶段覆盖） */
	title = $state('');
	/** 状态文案（随阶段覆盖） */
	status = $state('');
	progress = $state(0);
	scriptPath = $state('');
	ip = $state('');
	cacheHit = $state(false);
	bestDomain = $state('');
	bestLatency = $state(0);
	finalUrl = $state('');
	nodes = $state<DownloadNodeRow[]>(fallbackNodes());

	#started = false;

	constructor(lang: Lang) {
		this.lang = lang;
		this.title = t(lang, 'download.title');
		this.status = t(lang, 'download.stage_ip');
	}

	/** 节点行显示用的域名（去掉协议头） */
	nodeLabel(row: DownloadNodeRow): string {
		return formatDomain(row.domain);
	}

	/** 水合后启动；prerender / SSR 不执行 effect，因此不会探测 */
	start(): void {
		if (this.#started || typeof window === 'undefined') return;
		this.#started = true;
		void this.#run();
	}

	async #run(): Promise<void> {
		const path = this.#readPath();
		if (!path) {
			this.stage = 'no-path';
			this.title = t(this.lang, 'download.no_path_title');
			this.status = t(this.lang, 'download.no_path_desc');
			return;
		}
		this.scriptPath = path;

		// 1. 出口 IP（缓存键需要它）
		this.progress = 5;
		const ipRes = await request<string>({
			key: `${DOWNLOAD_BLOCK_ID}:ip`,
			url: dynamicConfig.endpoints.ipTrace,
			timeoutMs: dynamicConfig.timeout.ip,
			attempts: 1,
			read: (res) => res.text()
		});
		this.ip = ipRes.ok ? parseTraceIp(ipRes.data) : '';
		this.progress = 15;

		// 2. 缓存命中：直接用上次的最快节点
		const cached = this.#readCache();
		if (cached) {
			this.cacheHit = true;
			this.bestDomain = cached;
			this.finalUrl = `${cached}/scripts/${path}`;
			this.#finish('success', t(this.lang, 'download.cache_hit'));
			return;
		}

		await wait(DLC.initTimeout);
		this.stage = 'testing';
		this.title = t(this.lang, 'download.testing');
		this.status = t(this.lang, 'download.stage_probe');
		this.progress = 20;

		// 3. 逐个探测节点
		const domains = getDownloadDomains().slice(0, DLC.testCount);
		this.nodes = domains.map((domain) => ({ domain, latency: null }));

		const hits: { domain: string; latency: number }[] = [];
		for (let i = 0; i < domains.length; i++) {
			const domain = domains[i]!;
			this.progress = 20 + Math.floor((60 / domains.length) * i);
			this.status = `${t(this.lang, 'download.stage_probe')} ${i + 1}/${domains.length}`;

			const result = await this.#testDomain(domain);
			if (result.ok) {
				hits.push({ domain, latency: result.latency });
				this.nodes = this.nodes.map((row) =>
					row.domain === domain ? { ...row, latency: result.latency } : row
				);
			}
			if (i < domains.length - 1) await wait(dynamicConfig.download.gapMs);
		}

		this.status = t(this.lang, 'download.stage_analyze');
		this.progress = 80;

		// 4. 选最优；全失败则随机备用
		if (hits.length > 0) {
			hits.sort((a, b) => a.latency - b.latency);
			const best = hits[0]!;
			this.bestDomain = best.domain;
			this.bestLatency = best.latency;
			this.finalUrl = `${best.domain}/scripts/${path}`;
			this.#writeCache(best.domain);
			await wait(dynamicConfig.download.settleMs);
			this.#finish('success', t(this.lang, 'download.best_hit'));
			return;
		}

		const all = getDownloadDomains();
		const fallback = all[Math.floor(Math.random() * all.length)]!;
		this.bestDomain = fallback;
		this.finalUrl = `${fallback}/scripts/${path}`;
		this.#finish('fallback', t(this.lang, 'download.fallback_pick'));
	}

	#finish(stage: DownloadStage, status: string): void {
		this.stage = stage;
		this.title = t(this.lang, 'download.success');
		this.status = status;
		this.progress = 100;
		redirectWithMeta(this.finalUrl, 0);
	}

	/** hash（或 ?path=）里的脚本路径 */
	#readPath(): string | null {
		if (typeof window === 'undefined') return null;
		if (DLC.useQueryString) {
			// 一次性读取查询串，用完即丢弃
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const p = new URLSearchParams(window.location.search).get('path');
			return p ? p.replace(/^\/+/, '') : null;
		}
		const hash = window.location.hash;
		if (!hash || hash === '#') return null;
		const raw = hash.startsWith('#/') ? hash.substring(2) : hash.substring(1);
		const decoded = decodeURIComponent(raw).replace(/^\/+/, '');
		return decoded || null;
	}

	#readCache(): string | null {
		if (!this.ip) return null;
		try {
			const raw = localStorage.getItem(DLC.cacheKey);
			if (!raw) return null;
			const c = JSON.parse(raw) as { ip?: string; domain?: string; time?: number };
			const fresh = typeof c.time === 'number' && Date.now() - c.time <= DLC.cacheDays * 86400000;
			if (c.ip === this.ip && fresh && c.domain && siteConfig.downloadNodes.includes(c.domain)) {
				return c.domain;
			}
			localStorage.removeItem(DLC.cacheKey);
		} catch {
			// localStorage 可能被禁用（隐私模式 / 配额），读不到就当没缓存
		}
		return null;
	}

	#writeCache(domain: string): void {
		if (!this.ip) return;
		try {
			localStorage.setItem(DLC.cacheKey, JSON.stringify({ ip: this.ip, domain, time: Date.now() }));
		} catch {
			// 同上，写不进去也不影响下载流程
		}
	}

	/**
	 * 单节点探测：隐藏 iframe 里加载 `{domain}/gfork.js`，
	 * 该脚本执行时通过 postMessage 回报激活成功。
	 * 这是纯 DOM 探测，不是 fetch。
	 */
	#testDomain(domain: string): Promise<{ ok: boolean; latency: number }> {
		return new Promise((resolve) => {
			const started = performance.now();
			const iframe = document.createElement('iframe');
			iframe.style.display = 'none';
			iframe.setAttribute('aria-hidden', 'true');
			iframe.setAttribute('tabindex', '-1');

			const done = (ok: boolean) => {
				clearTimeout(timer);
				window.removeEventListener('message', handler);
				iframe.remove();
				resolve({ ok, latency: performance.now() - started });
			};

			const timer = setTimeout(() => done(false), DLC.testTimeout);
			const handler = (e: MessageEvent) => {
				if (e.data === 'gfork_activated') done(true);
				else if (e.data === 'gfork_error') done(false);
			};
			window.addEventListener('message', handler);

			// srcdoc 里内联引导脚本，避免再发一次脚本请求
			iframe.srcdoc = `<!DOCTYPE html><html><head><script>window.onGforkActivated=function(){window.GFORK_OK=true;parent.postMessage('gfork_activated','*');};var s=document.createElement('script');s.src='${domain}/gfork.js';s.onerror=function(){parent.postMessage('gfork_error','*');};setTimeout(function(){if(window.GFORK_OK){parent.postMessage('gfork_activated','*');}},150);document.head.appendChild(s);</${''}script></head></html>`;
			document.body.appendChild(iframe);
		});
	}
}

function parseTraceIp(text: string): string {
	for (const line of text.split('\n')) {
		if (line.startsWith('ip=')) return line.split('=')[1]?.trim() ?? '';
	}
	return '';
}

/** meta refresh 兜底跳转（与旧实现一致） */
function redirectWithMeta(url: string, delaySec: number): void {
	if (typeof document === 'undefined' || !url) return;
	const meta = document.createElement('meta');
	meta.httpEquiv = 'refresh';
	meta.content = `${delaySec};url=${url}`;
	document.head.appendChild(meta);
}

export function createDownloadProbe(lang: Lang): DownloadProbe {
	return new DownloadProbe(lang);
}
