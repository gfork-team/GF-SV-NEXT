<script lang="ts">
	import { onMount } from 'svelte';
	import { siteConfig } from '$lib/config';
	import { i18nConfig } from '$i18n';
	import { initAdState, markSdkReady, markSdkBlocked, GOOGLEFC_INIT } from '$lib/ad-state.svelte';
	import { scriptTag } from '$utils';
	import { parseSearchParams, stringifySearchParams, type SearchParams } from '$lib/search-params';
	import Ad from '$components/Ad.svelte';
	import Icon from '$components/Icon.svelte';

	let delaySec = siteConfig.redirects.searchDelaySec;
	// 本路由不在 [lang] 布局内，需自带 AdSense 脚本
	let adsenseScript: string =
		siteConfig.adsense.script ||
		siteConfig.cdn.adsenseScript ||
		'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
	let showAds = $derived(siteConfig.adsense.enabled);

	onMount(() => {
		initAdState(true);
	});

	onMount(() => {
		// 合并「查询串 + hash 查询」，hash 优先。
		// entry_locales[] 是重复键的多值参数，必须走 $lib/search-params：
		// 用 URLSearchParams + set 逐项覆盖会把数组压成最后一个值。
		//
		// 注意：本路由是 prerender 的静态页，静态 301 无法携带 location.search，
		// 所以这里必须由 JS 转发，并交给 /{lang}/s 完成最终跳转。
		function buildTargetUrl(): string {
			const hash = window.location.hash;
			const hashQuery = hash.indexOf('#?') === 0 ? hash.substring(2) : '';
			const merged: SearchParams = {
				...parseSearchParams(window.location.search),
				...parseSearchParams(hashQuery)
			};
			const qs = stringifySearchParams(merged);
			const lang = i18nConfig.defaultLang;
			return qs ? `/${lang}/s?${qs}` : `/${lang}/s`;
		}

		let targetUrl = buildTargetUrl();

		// 等待时间为 0：不做倒计时，立即跳转
		if (delaySec <= 0) {
			window.location.assign(targetUrl);
			return;
		}

		let countdown = delaySec;
		const meta = document.createElement('meta');
		meta.httpEquiv = 'refresh';
		meta.id = 'redirect-meta';
		document.head.appendChild(meta);
		const textEl = document.getElementById('redirect-countdown-text')!;
		const skipEl = document.getElementById('redirect-skip')!;

		function buildUrl() {
			targetUrl = buildTargetUrl();
		}

		function update() {
			buildUrl();
			meta.content = countdown + 2 + ';url=' + targetUrl;
			skipEl.innerHTML =
				'<button onclick="location.reload()" style="display:inline-block;padding:12px 32px;background:var(--md-sys-color-primary,#7f3300);color:var(--md-sys-color-on-primary,#fff);border:none;border-radius:999px;font-size:14px;font-weight:500;cursor:pointer">Click here if not redirected</button>';
		}

		function tick() {
			countdown--;
			if (countdown <= 0) {
				clearInterval(interval);
				textEl.textContent = '正在加载中…';
				// meta refresh 在部分环境下不触发，这里显式跳转兜底（与 RedirectInterstitial 一致）
				window.location.assign(targetUrl);
				return;
			}
			update();
			textEl.textContent = 'Redirecting in ' + countdown + 's...';
		}

		buildUrl();
		update();
		window.addEventListener('hashchange', update);
		textEl.textContent = 'Redirecting in ' + countdown + 's...';
		const interval = setInterval(tick, 1000);

		return () => {
			clearInterval(interval);
			window.removeEventListener('hashchange', update);
		};
	});
</script>

<svelte:head>
	{#if showAds}
		<script
			async
			src="{adsenseScript}?client={siteConfig.adsense.publisherId}"
			crossorigin="anonymous"
			onload={() => markSdkReady()}
			onerror={() => markSdkBlocked()}
		></script>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- 本仓库自身生成的 AdSense 初始化常量 -->
		{@html scriptTag(GOOGLEFC_INIT)}
	{/if}
	<title>Redirecting - ZGF</title>
</svelte:head>

<div class="page">
	<div class="keywords-bg">
		<div class="kw-col">
			<span>CDN加速</span><span>云网络</span><span>边缘节点</span><span>代理服务器</span><span
				>住宅IP</span
			><span>静态代理</span><span>动态代理</span><span>VPN隧道</span><span>协议优化</span><span
				>负载均衡</span
			><span>反向代理</span>
		</div>
		<div class="kw-col">
			<span>智能路由</span><span>数据加速</span><span>跨境网络</span><span>安全传输</span><span
				>低延迟</span
			><span>高可用</span><span>分布式节点</span><span>全球加速</span><span>专线代理</span><span
				>SOCKS5</span
			><span>HTTP代理</span>
		</div>
		<div class="kw-col">
			<span>Shadowsocks</span><span>V2Ray</span><span>Trojan</span><span>WireGuard</span><span
				>Cloudflare Tunnel</span
			><span>网络优化</span><span>带宽聚合</span><span>链路聚合</span><span>多线BGP</span><span
				>边缘计算</span
			><span>隧道协议</span>
		</div>
		<div class="kw-col">
			<span>CDN节点</span><span>内容分发</span><span>全球负载</span><span>智能DNS</span><span
				>流量调度</span
			><span>Anycast</span><span>零信任</span><span>端到端加密</span><span>传输优化</span><span
				>加速通道</span
			><span>高速通道</span>
		</div>
	</div>

	<div class="card">
		<div class="card-glow"></div>
		<div class="card-content">
			<span class="spin-icon" aria-hidden="true"><Icon name="refresh" size={80} /></span>
			<p id="redirect-countdown-text" class="countdown">Redirecting in {delaySec}s...</p>

			<div class="ad-slot"><Ad type="auto" /></div>

			<div class="kw-block">
				<span>CDN加速</span><span>代理服务器</span><span>智能路由</span><span>全球加速</span><span
					>边缘节点</span
				><span>跨境网络</span><span>负载均衡</span><span>反向代理</span>
			</div>

			<div class="ad-slot"><Ad type="autorelaxed" /></div>

			<div class="kw-block">
				<span>Shadowsocks</span><span>V2Ray</span><span>Trojan</span><span>WireGuard</span><span
					>SOCKS5</span
				><span>HTTP代理</span><span>VPN隧道</span><span>隧道协议</span>
			</div>

			<div class="ad-slot"><Ad type="auto" /></div>

			<div class="kw-block">
				<span>智能DNS</span><span>流量调度</span><span>零信任</span><span>端到端加密</span><span
					>传输优化</span
				><span>链路聚合</span><span>边缘计算</span><span>内容分发</span>
			</div>

			<p id="redirect-skip" class="skip">
				<button onclick={() => location.reload()}>Click here if not redirected</button>
			</p>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		overflow-x: hidden;
	}
	.page {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 20px;
		background: transparent;
	}
	.keywords-bg {
		position: fixed;
		inset: 0;
		display: flex;
		gap: 32px;
		padding: 40px 32px;
		pointer-events: none;
		user-select: none;
		z-index: 0;
		flex-wrap: wrap;
		align-content: center;
		justify-content: center;
	}
	.kw-col {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-width: 140px;
		flex: 1;
		max-width: 220px;
	}
	.kw-col span {
		color: var(--md-sys-color-primary);
		font-size: 13px;
		font-weight: 500;
		opacity: 0;
		letter-spacing: 0.5px;
		white-space: nowrap;
		text-align: center;
	}
	.card {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 460px;
		background: var(--md-sys-color-surface-container);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: 20px;
		overflow: hidden;
	}
	.card-glow {
		position: absolute;
		inset: 0;
		background: var(--md-sys-color-primary-container);
		pointer-events: none;
		opacity: 0.15;
	}
	.card-content {
		position: relative;
		padding: 40px 28px 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.spin-icon {
		font-size: var(--md-sys-typescale-display-large-size);
		color: var(--md-sys-color-primary);
		animation: spin 0.5s linear infinite;
		margin-bottom: 20px;
	}
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	.countdown {
		font-size: 16px;
		color: var(--md-sys-color-on-surface-variant);
		margin: 0 0 20px;
		text-align: center;
		font-weight: 400;
		letter-spacing: 0.3px;
	}
	.ad-slot {
		width: 100%;
		margin: 8px 0;
	}
	.kw-block {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px 12px;
		margin: 12px 0;
		padding: 8px 0;
		user-select: none;
	}
	.kw-block span {
		font-size: 12px;
		color: var(--md-sys-color-on-surface-variant);
		opacity: 0;
		font-weight: 400;
		letter-spacing: 0.3px;
	}
	.skip {
		margin: 20px 0 8px;
		text-align: center;
	}
	.skip :global(button) {
		display: inline-block;
		padding: 12px 36px;
		background: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
		border: none;
		border-radius: 999px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		letter-spacing: 0.3px;
		transition: all 0.2s ease;
	}
	.skip :global(button:hover) {
		filter: brightness(1.06);
	}
</style>
