<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$i18n';
	import { siteConfig, getDownloadDomains } from '$lib/config';
	import Ad from '$components/Ad.svelte';

	let { data } = $props<{ data: { lang: string; showAds: boolean } }>();
	let lang = $derived(data.lang);

	const DLC = siteConfig.download;

	let stage = $state<string>('init');
	let progress = $state(0);
	let progressText = $state('');
	let errorMsg = $state('');
	let scriptPath = $state('');
	let userIP = $state('');
	let bestDomain = $state('');
	let bestLatency = $state(0);
	let finalUrl = $state('');
	let testResults = $state<{ domain: string; latency: number }[]>([]);
	let selectedDomains = $state<string[]>([]);
	let cacheHit = $state(false);

	/** Sets progress bar & text together (matches yuan's updateProgress). */
	function updateProgress(pct: number, text: string) {
		progress = pct;
		progressText = text;
	}

	/** Extract script path from hash or query string (matches yuan's getScriptPath). */
	function getScriptPath(): string | null {
		if (DLC.useQueryString) {
			const p = new URLSearchParams(window.location.search).get('path');
			return p ? p.replace(/^\/+/, '') : null;
		}
		const hash = window.location.hash;
		return hash && hash.startsWith('#/') ? decodeURIComponent(hash.substring(2)) : null;
	}

	/** Fetch user IP via Cloudflare trace (matches yuan's fetchUserIP). */
	async function fetchUserIP(): Promise<void> {
		try {
			updateProgress(5, '获取IP中...');
			const ctrl = new AbortController();
			const timeout = setTimeout(() => ctrl.abort(), DLC.ipTimeout);
			const r = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { signal: ctrl.signal });
			clearTimeout(timeout);
			const text = await r.text();
			for (const line of text.split('\n')) {
				if (line.startsWith('ip=')) {
					userIP = line.split('=')[1]!.trim();
					break;
				}
			}
			updateProgress(10, 'IP获取完成');
		} catch {
			updateProgress(10, 'IP获取失败');
		}
	}

	/** Cache helpers (matches yuan's getCachedFastestDomain / cacheFastestDomain). */
	function getCached(): string | null {
		if (!userIP) return null;
		try {
			const raw = localStorage.getItem(DLC.cacheKey);
			if (!raw) return null;
			const c = JSON.parse(raw);
			if (
				c.ip === userIP &&
				Date.now() - c.time <= DLC.cacheDays * 86400000 &&
				siteConfig.downloadNodes.includes(c.domain)
			) {
				return c.domain;
			}
			localStorage.removeItem(DLC.cacheKey);
		} catch {}
		return null;
	}

	function setCached(domain: string) {
		if (!userIP) return;
		try {
			localStorage.setItem(DLC.cacheKey, JSON.stringify({ ip: userIP, domain, time: Date.now() }));
		} catch {}
	}

	/** Test single domain via gfork.js injection in hidden iframe.
	 *  gfork.js is a tiny IIFE: (function(){window.onGforkActivated&&window.onGforkActivated();window.GFORK_OK=!0})()
	 *  No sandbox needed — avoids opaque-origin CORS issues on CDN domains. */
	function testDomain(domain: string): Promise<{ latency: number; ok: boolean }> {
		return new Promise((resolve) => {
			const start = performance.now();
			const iframe = document.createElement('iframe');
			iframe.style.display = 'none';

			const timer = setTimeout(() => {
				if (iframe.parentNode) iframe.remove();
				resolve({ latency: Infinity, ok: false });
			}, DLC.testTimeout);

			const handler = (e: MessageEvent) => {
				if (e.data === 'gfork_activated') {
					clearTimeout(timer);
					window.removeEventListener('message', handler);
					if (iframe.parentNode) iframe.remove();
					resolve({ latency: performance.now() - start, ok: true });
				} else if (e.data === 'gfork_error') {
					clearTimeout(timer);
					window.removeEventListener('message', handler);
					if (iframe.parentNode) iframe.remove();
					resolve({ latency: Infinity, ok: false });
				}
			};
			window.addEventListener('message', handler);

			// Inline gfork.js content directly in srcdoc — no CORS script fetch needed.
			// The CDN connectivity is tested by the actual download redirect, not here.
			iframe.srcdoc = `<!DOCTYPE html><html><head><script>window.onGforkActivated=function(){window.GFORK_OK=true;parent.postMessage('gfork_activated','*');};var s=document.createElement('script');s.src='${domain}/gfork.js';s.onerror=function(){parent.postMessage('gfork_error','*');};setTimeout(function(){if(window.GFORK_OK){parent.postMessage('gfork_activated','*');}},150);document.head.appendChild(s);</${''}script></head></html>`;
			document.body.appendChild(iframe);
		});
	}

	/** Format domain for display (matches yuan's formatDomain). */
	function formatDomain(d: string): string { return d.replace('https://', ''); }

	/** Meta-refresh redirect (matches yuan's redirectWithMeta). */
	function redirectWithMeta(url: string, delaySec: number) {
		const meta = document.createElement('meta');
		meta.httpEquiv = 'refresh';
		meta.content = `${delaySec};url=${url}`;
		document.head.appendChild(meta);
	}

	// ─── Main flow ───
	async function run() {
		const path = getScriptPath();
		if (!path) {
			stage = 'no-path';
			errorMsg = '请在URL中添加脚本路径';
			updateProgress(0, '等待路径');
			return;
		}
		scriptPath = path;

		// IP
		stage = 'fetching-ip';
		await fetchUserIP();
		updateProgress(15, '检查缓存');

		// Cache
		const cached = getCached();
		if (cached) {
			stage = 'checking-cache';
			updateProgress(50, '校验缓存');
			await new Promise((r) => setTimeout(r, DLC.cacheTimeout));
			bestDomain = cached;
			finalUrl = `${cached}/scripts/${scriptPath}`;
			cacheHit = true;
			stage = 'success';
			updateProgress(100, '完成');
			redirectWithMeta(finalUrl, 1);
			return;
		}

		// Initial loading state
		await new Promise((r) => setTimeout(r, DLC.initTimeout));
		updateProgress(20, '初始化');

		// Select domains for testing
		selectedDomains = getDownloadDomains().slice(0, DLC.testCount);
		stage = 'testing';
		updateProgress(20, '开始测速');

		for (let i = 0; i < selectedDomains.length; i++) {
			const domain = selectedDomains[i]!;
			const pct = 20 + Math.floor((60 / selectedDomains.length) * i);
			updateProgress(pct, `测试节点 ${i + 1}/${selectedDomains.length}`);

			const result = await testDomain(domain);
			if (result.ok) {
				testResults = [...testResults, { domain, latency: result.latency }];
			}
			if (i < selectedDomains.length - 1) {
				await new Promise((r) => setTimeout(r, 300));
			}
		}

		updateProgress(80, '分析结果中');

		if (testResults.length > 0) {
			testResults.sort((a, b) => a.latency - b.latency);
			const best = testResults[0]!;
			bestDomain = best.domain;
			bestLatency = best.latency;
			setCached(best.domain);
			finalUrl = `${best.domain}/scripts/${scriptPath}`;
			await new Promise((r) => setTimeout(r, 500));
			stage = 'success';
			updateProgress(100, '完成');
			redirectWithMeta(finalUrl, 1);
		} else {
			const domains = getDownloadDomains();
			const fb = domains[Math.floor(Math.random() * domains.length)]!;
			bestDomain = fb;
			finalUrl = `${fb}/scripts/${scriptPath}`;
			stage = 'fallback';
			updateProgress(100, '使用备用方案');
			redirectWithMeta(finalUrl, 1);
		}
	}

	onMount(() => {
		run();
	});
</script>

<svelte:head>
<title>{t(lang, 'download.title')} - ZGF</title>
	<meta name="description" content={t(lang, 'download.description')} />
	<meta name="keywords" content="script download, userscript install, script acceleration download, greasyfork download, user script download" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
</svelte:head>

<section class="download-page">
	{#if siteConfig.adsense.allowOnDownloadPage}
	<div class="content-wrapper" style="margin-bottom:16px">
		<Ad type="auto" />
	</div>
	<div class="content-wrapper" style="margin-bottom:16px">
		<Ad type="fluid" />
	</div>
	{/if}

	<div class="content-wrapper">
		<div class="md3-card" id="download-app" style="min-height:400px">

			<!-- no-path -->
			{#if stage === 'no-path'}
				<div class="dl-icon"><span class="material-icons">link</span></div>
				<h1>{t(lang, 'download.title')}</h1>
				<p class="dl-desc">{errorMsg}</p>
				<div class="dl-tip">
					{DLC.useQueryString
						? '使用方式: 在URL后加上 ?path=your-script-path.user.js'
						: '使用方式: 在URL后加上 #/your-script-path.user.js'}
				</div>
			{/if}

			<!-- fetching-ip -->
			{#if stage === 'fetching-ip'}
				<div class="dl-icon"><span class="material-icons">sync</span></div>
				<h1>{t(lang, 'download.title')}</h1>
				<p class="dl-desc">{progressText}</p>
				<div class="dl-progress-bar"><div class="dl-progress-fill" style="width:{progress}%"></div></div>
			{/if}

	<!-- checking-cache / init -->
			{#if stage === 'checking-cache' || stage === 'init'}
				<div class="dl-icon"><span class="material-icons">{stage === 'checking-cache' ? 'verified' : 'sync'}</span></div>
				<h1>{stage === 'checking-cache' ? '校验中' : t(lang, 'download.title')}</h1>
				<p class="dl-desc">{stage === 'checking-cache' ? '正在校验缓存节点...' : progressText}</p>
				{#if scriptPath}
					<div class="dl-url">{scriptPath}</div>
				{/if}
				{#if stage === 'checking-cache'}
					<div class="dl-st">
						<div class="dl-st-t">缓存节点</div>
						<div class="dl-st-i ok"><span class="material-icons">cloud_done</span>{formatDomain(bestDomain)}</div>
					</div>
					<div class="dl-tip">提示: 缓存有效期 {DLC.cacheDays} 天{#if userIP} (IP: {userIP}){/if}</div>
				{/if}
			<div class="dl-progress-bar"><div class="dl-progress-fill" style="width:{progress}%"></div></div>
		{/if}

		<!-- testing -->
			{#if stage === 'testing'}
				<div class="dl-icon"><span class="material-icons">speed</span></div>
				<h1>{t(lang, 'download.testing')}</h1>
				<p class="dl-desc">正在测试节点连接速度, 请稍候...</p>
				{#if scriptPath}
					<div class="dl-url">{scriptPath}</div>
				{/if}
				<div class="dl-st">
					<div class="dl-st-t">测试节点 ({selectedDomains.length}个)</div>
					{#each selectedDomains as d}
						{@const r = testResults.find(t => t.domain === d)}
						{@const pending = !r}
						<div class="dl-st-i" class:ok={r !== undefined}>
							<span class="material-icons">{pending ? 'pending' : 'check_circle'}</span>
							{formatDomain(d)}
							<span class="lat">{pending ? '等待中' : `${r.latency.toFixed(0)}ms`}</span>
						</div>
					{/each}
				</div>
		<div class="dl-tip">提示: 正在随机测试 {selectedDomains.length} 个节点</div>
		<div class="dl-progress-bar"><div class="dl-progress-fill" style="width:{progress}%"></div></div>
	{/if}

			<!-- success -->
			{#if stage === 'success'}
				<div class="dl-icon"><span class="material-icons ok">check_circle</span></div>
				<h1>{t(lang, 'download.success')}</h1>
				<p class="dl-desc">{cacheHit ? '缓存校验通过, 即将自动跳转' : '已选择最快节点, 即将自动跳转'}</p>
				{#if !cacheHit}
					<div class="dl-badge"><span class="material-icons">speed</span>最低延迟 {bestLatency.toFixed(0)}ms</div>
				{/if}
		<div class="dl-url">{finalUrl}</div>
		<a href={finalUrl} class="dl-btn" target="_blank" rel="noopener noreferrer"><span class="material-icons">open_in_new</span>{t(lang, 'download.manual')}</a>
		<div class="dl-tip">若无法访问, 请重新整理再试</div>
			{/if}
		</div>
	</div>

	{#if siteConfig.adsense.allowOnDownloadPage}
	<div class="content-wrapper" style="margin-top:16px">
		<Ad type="auto" />
	</div>
	<div class="content-wrapper" style="margin-top:16px">
		<Ad type="autorelaxed" />
	</div>
	<div class="content-wrapper" style="margin-top:16px">
		<Ad type="fluid" />
	</div>
	<div class="content-wrapper" style="margin-top:16px">
		<Ad type="auto" />
	</div>
	{/if}
</section>

<style>
	.download-page { padding: 32px 0; }
	.content-wrapper { max-width: 720px; margin: 0 auto; padding: 0 16px; }
	#download-app { padding: 48px 32px; text-align: center; }
	.dl-icon { margin-bottom: 24px; }
	.dl-icon .material-icons { font-size: 64px; color: var(--md-sys-color-on-surface-variant); }
	.dl-icon .material-icons.ok { color: var(--md-sys-color-primary); }
	#download-app h1 { font-family: var(--md-sys-typescale-headline-medium-font, inherit); font-size: 24px; font-weight: 600; margin: 0 0 12px; color: var(--md-sys-color-on-surface); }
	.dl-desc { font-size: 15px; color: var(--md-sys-color-on-surface-variant); margin: 0 0 20px; }
	.dl-url { font-size: 13px; color: var(--md-sys-color-outline); background: var(--md-sys-color-surface-container); padding: 8px 16px; border-radius: var(--md-sys-shape-corner-small); word-break: break-all; display: inline-block; max-width: 100%; margin-bottom: 16px; }
	.dl-tip { font-size: 13px; color: var(--md-sys-color-outline); background: var(--md-sys-color-surface-container); padding: 12px 16px; border-radius: var(--md-sys-shape-corner-small); margin-top: 12px; word-break: break-all; }
	.dl-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--md-sys-color-primary); background: var(--md-sys-color-primary-container); padding: 6px 16px; border-radius: var(--md-sys-shape-corner-full); margin-bottom: 16px; }
	.dl-badge .material-icons { font-size: 18px; }
	.dl-st { text-align: left; max-width: 500px; margin: 16px auto; }
	.dl-st-t { font-size: 13px; font-weight: 600; color: var(--md-sys-color-on-surface); margin-bottom: 8px; padding: 0 4px; }
	.dl-st-i { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--md-sys-shape-corner-small); font-size: 13px; color: var(--md-sys-color-on-surface-variant); background: var(--md-sys-color-surface-container); margin-bottom: 4px; }
	.dl-st-i .material-icons { font-size: 18px; color: var(--md-sys-color-outline); }
	.dl-st-i.ok .material-icons { color: var(--md-sys-color-primary); }
	.dl-st-i .lat { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--md-sys-color-outline); font-size: 12px; }
	.dl-st-i.ok .lat { color: var(--md-sys-color-primary); }
	.dl-btn { display: inline-flex; align-items: center; gap: 6px; margin-top: 24px; padding: 10px 24px; background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border-radius: var(--md-sys-shape-corner-full); text-decoration: none; font-size: 14px; font-weight: 500; }
	.dl-btn:hover { filter: brightness(1.1); }
	.dl-btn .material-icons { font-size: 18px; }
	.dl-progress-bar { width: 100%; max-width: 400px; height: 4px; background: var(--md-sys-color-surface-container-highest); border-radius: 2px; margin: 16px auto 0; overflow: hidden; }
	.dl-progress-fill { height: 100%; background: var(--md-sys-color-primary); border-radius: 2px; transition: width 0.3s ease; }
	@media (max-width: 600px) { #download-app { padding: 32px 16px; } }
</style>
