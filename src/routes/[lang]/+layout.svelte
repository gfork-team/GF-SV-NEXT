<script lang="ts">
	import { page } from '$app/state';
	import { i18nConfig, t, type Lang } from '$i18n';
	import { siteConfig, siteProxyUrl, siteUrl } from '$lib/config';
	import {
		OG_LOCALES,
		ROUTE_META,
		canonicalUrl,
		cleanPathFrom,
		websiteJsonLd,
		organizationJsonLd,
		breadcrumbJsonLd
	} from '$lib/seo';
	import Ad from '$components/Ad.svelte';
	import { sendAudit } from '$lib/audit';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { initTheme, handleSystemChange } from '$lib/theme.svelte';
	import { getColorFoucScript } from '$lib/colors';
	import Nav from '$components/Nav.svelte';
	import Footer from '$components/Footer.svelte';
	import CookieConsent from '$components/CookieConsent.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
	let lang: Lang = $derived(data.lang);
	let showAds: boolean = $derived(data.showAds);

	let announceDismissed = $state(
		typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gf-announce.dismissed') === '1'
	);

	function dismissAnnounce() {
		announceDismissed = true;
		try { sessionStorage.setItem('gf-announce.dismissed', '1'); } catch {}
	}

	let announceEnabled = $derived(siteConfig.announce.enabled && !announceDismissed);
	let announceType = $derived(siteConfig.announce.type as string);
	let announceMsg = $derived(siteConfig.announce.message[lang] || siteConfig.announce.message['en'] || '');
	let announceVisible = $derived(announceEnabled && announceMsg.length > 0);

	// 回到顶部按钮：滚动超过阈值后显示
	let showBackTop = $state(false);
	let reducedMotion = $state(false);

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
	}

	onMount(() => {
		initTheme();
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const onScroll = () => { showBackTop = window.scrollY > 400; };
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });

		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		mql.addEventListener('change', () => handleSystemChange());

		// Audit: pageview
		if (siteConfig.audit.enabled) {
			sendAudit('pageview', {
				path: page.url.pathname,
				lang: data.lang as string,
				referrer: document.referrer || undefined,
			});

			// Global error capture
			const prevOnError = window.onerror;
			window.onerror = (msg, source, lineno, colno, error) => {
				sendAudit('error', {
					path: page.url.pathname,
					lang: data.lang as string,
					payload: {
						message: String(msg),
						source: source || '',
						line: lineno || 0,
						col: colno || 0,
						stack: error instanceof Error ? (error.stack || '').substring(0, 2000) : '',
					},
				});
				if (prevOnError) return prevOnError(msg, source, lineno, colno, error);
				return false;
			};
		}

		// Scroll reveal: observe only after the page has settled so that
		// in-viewport sections keep their staggered fade-up instead of
		// being revealed all at once during initial render / SPA swap.
		scheduleReveal();
	});

	// Scroll reveal (Cloudflare-style fade-up)
	let revealObs: IntersectionObserver | null = null;
	const ensureRevealObserver = () => {
		if (revealObs) return;
		revealObs = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const el = entry.target as HTMLElement;
						el.setAttribute('data-reveal', 'true');
						revealObs?.unobserve(el);
					}
				}
			},
			{ threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
		);
	};
	const observeReveal = () => {
		ensureRevealObserver();
		document.querySelectorAll('[data-reveal]:not([data-reveal="true"])').forEach((el) => revealObs?.observe(el));
	};
	const scheduleReveal = () => {
		window.requestAnimationFrame(() => window.setTimeout(observeReveal, 80));
	};

	afterNavigate(() => {
		scheduleReveal();
	});

	let cleanPath: string = $derived(page.url.pathname.replace(/^\/[^/]+/, '') || '/');
	let routeMeta = $derived(ROUTE_META[cleanPath] ?? ROUTE_META['/']!);
	let pageTitle = $derived(t(lang, routeMeta.titleKey));
	let pageDesc = $derived(t(lang, routeMeta.descKey));
	let canonical = $derived(canonicalUrl(lang, cleanPathFrom(page.url.pathname)));
	let ogImage = $derived(siteUrl(siteConfig.seo.defaultOgImage));
	let gtmId = siteConfig.adsense.gtmId;
	let gtmCode = $derived(gtmId
		? `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id=${gtmId}';f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`
		: '');
	let gtmNoscript = $derived(gtmId
		? `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
		: '');
	let cdnStatic = $derived(siteConfig.cdn.enabled ? siteConfig.cdn.static : '');
	let cdnSiteProxy = $derived(siteProxyUrl());
</script>

<svelte:head>
	<!-- Anti-FOUC（paint 前同步套用本地配色，杜绝闪变） -->
	{@html `<script>${getColorFoucScript()}</script>`}

	<!-- Canonical URL (no trailing slash, Uniform URL) -->
	<link rel="canonical" href={canonical} />

	<!-- Open Graph -->
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:locale" content={OG_LOCALES[lang]} />
	<meta property="og:type" content={routeMeta.ogType || 'website'} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDesc} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:alt" content={siteConfig.name} />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDesc} />
	<meta name="twitter:image" content={ogImage} />

	<!-- Structured data: WebSite + Organization (site-wide) -->
	{#if cleanPath !== '/s' && cleanPath !== '/l'}
		{@html `<script type="application/ld+json">${websiteJsonLd(lang)}</script>`}
		{@html `<script type="application/ld+json">${organizationJsonLd()}</script>`}

		<!-- Structured data: BreadcrumbList (auto-derived from path) -->
		{#if cleanPath !== '/'}
			{@html `<script type="application/ld+json">${breadcrumbJsonLd(lang, cleanPath, pageTitle)}</script>`}
		{/if}
	{/if}

	<!-- Favicons (from config) -->
	<link rel="icon" type="image/png" sizes="32x32" href={siteConfig.favicon.icon32} />
	<link rel="icon" type="image/png" sizes="16x16" href={siteConfig.favicon.icon16} />
	<link rel="icon" href={siteConfig.favicon.iconIco} sizes="any" />
	<link rel="apple-touch-icon" sizes="180x180" href={siteConfig.favicon.appleTouch} />
	<link rel="manifest" href={siteConfig.favicon.manifest} />

	<!-- DNS prefetch for CDN origins -->
	{#if cdnStatic}
		<link rel="dns-prefetch" href={cdnStatic} />
	{/if}
	{#if cdnSiteProxy}
		<link rel="dns-prefetch" href={cdnSiteProxy} />
	{/if}

	{#if cdnStatic}
		<link rel="preconnect" href={cdnStatic} crossorigin="anonymous" />
	{/if}
	{#if cdnSiteProxy}
		<link rel="preconnect" href={cdnSiteProxy} crossorigin="anonymous" />
	{/if}
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Material+Icons+Outlined" />

	<!-- hreflang alternates (including x-default, Uniform URL no trailing slash) -->
	{#each i18nConfig.supportedLangs as langCode}
		<link rel="alternate" hreflang={i18nConfig.langNames[langCode]} href={canonicalUrl(langCode, cleanPath)} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={canonicalUrl(i18nConfig.defaultLang, cleanPath)} />

	{#if showAds}
		<script async src="https://pagead2.googlesyndication-cn.com/pagead/js/adsbygoogle.js?client=ca-pub-3758644447684310" crossorigin="anonymous"></script>
		<script>(function(){var t;function r(){var a=window.adsbygoogle||[];var u=document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])');if(u.length){a.push({});t=setTimeout(r,2500)}else{t=undefined}}setTimeout(function(){r()},3000);window.addEventListener('load',function(){if(!t){setTimeout(r,1000)}})})();</script>
	{/if}
	{#if showAds && gtmCode}
		{@html `<script>${gtmCode}</script>`}
	{/if}
</svelte:head>

<!-- 全站背景动效（政务红水墨光斑，自定义配色时整体隐藏） -->
<div class="zh-bg" aria-hidden="true">
	<span class="zh-bg-blob zh-bg-blob--a"></span>
	<span class="zh-bg-blob zh-bg-blob--b"></span>
	<span class="zh-bg-blob zh-bg-blob--c"></span>
</div>

<Nav {lang} />

<!-- 顶部细粉带（gov.cn 式，全站）：贴于顶栏下缘，替代顶栏阴影 -->
<div class="zh-topbar" aria-hidden="true"></div>

<div class="m3-nav-ad"><Ad type="fluid" /></div>

{#if announceVisible}
<div class="m3-announce-banner m3-announce--{announceType}">
	<div class="m3-announce-inner">
		<span class="m3-announce-text">{announceMsg}</span>
		<button class="m3-announce-close" onclick={dismissAnnounce} aria-label="Close announcement">
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
		</button>
	</div>
</div>
{/if}

<!-- GTM noscript fallback (before any visible content) -->
{#if showAds && gtmNoscript}
	<noscript>{@html gtmNoscript}</noscript>
{/if}

<div class="m3-layout-body">
	<main>
		{@render children()}
	</main>

</div>

<Footer {lang} />

<CookieConsent {lang} />

<!-- 回到顶部按钮（右下角，material icon） -->
<button
	class="m3-back-top"
	class:show={showBackTop}
	onclick={scrollToTop}
	aria-label="Back to top"
	title="Back to top"
>
	<span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
</button>

<style>
	/* 顶部细粉带（gov.cn 式）：默认配色下为粉紫渐变，自定义配色回落主题色。
	   位于顶栏下方（粘性跟随），替代顶栏下缘的阴影线 */
	.zh-topbar {
		height: 4px;
		position: sticky;
		top: 72px;
		z-index: 49;
		background: linear-gradient(90deg, var(--md-sys-color-primary) 0%, var(--md-sys-color-primary) 100%);
	}
	:global(:root[data-zh-china="1"]) .zh-topbar {
		background: linear-gradient(90deg, var(--zh-seal-deep), var(--zh-seal) 55%, var(--zh-seal-bright));
	}
	@media (max-width: 767px) {
		.zh-topbar { top: 64px; }
	}

	/* 回到顶部按钮 */
	.m3-back-top {
		position: fixed;
		right: 20px;
		bottom: 24px;
		z-index: 60;
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--glass-border);
		border-radius: 50%;
		background: var(--glass-bg);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		color: var(--md-sys-color-primary);
		box-shadow: var(--glass-shadow);
		cursor: pointer;
		opacity: 0;
		visibility: hidden;
		transform: translateY(12px);
		transition: opacity 160ms ease-out, transform 160ms ease-out, visibility 160ms;
	}
	.m3-back-top.show {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
	}
	.m3-back-top:hover { filter: brightness(1.06); box-shadow: var(--glass-shadow), 0 6px 16px rgba(0,0,0,0.08); }
	.m3-back-top:active { transform: translateY(0) scale(.94); }
	:global(:root[data-zh-china="1"]) .m3-back-top {
		background: color-mix(in srgb, var(--zh-seal-bright) 62%, transparent);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		color: var(--zh-seal-deep);
		border-color: rgba(238, 211, 229, 0.55);
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 16px rgba(221,170,204,.30);
	}
	.m3-back-top .material-symbols-outlined { font-size: 24px; line-height: 1; }
	@media (prefers-reduced-motion: reduce) {
		.m3-back-top { transition: none; }
	}

	/* 全站背景动效：固定浮层，缓慢漂移的光斑，所有配色下持续运动 */
	.zh-bg {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
		opacity: 0;
		animation: zh-bg-fade 1.2s ease-out 0.35s forwards;
	}
	.zh-bg-blob {
		position: absolute;
		border-radius: 50%;
		will-change: transform;
	}
	/* 默认配色：粉紫 / 墨蓝光斑 */
	.zh-bg-blob--a {
		width: 62vmin; height: 62vmin; top: -14vmin; left: -12vmin;
		background: radial-gradient(circle, color-mix(in srgb, var(--zh-seal) 26%, transparent) 0%, transparent 68%);
		animation: zh-blob-a 26s ease-in-out infinite alternate;
	}
	.zh-bg-blob--b {
		width: 54vmin; height: 54vmin; top: 18%; right: -14vmin;
		background: radial-gradient(circle, color-mix(in srgb, var(--zh-seal-bright) 16%, transparent) 0%, transparent 66%);
		animation: zh-blob-b 34s ease-in-out infinite alternate;
	}
	.zh-bg-blob--c {
		width: 48vmin; height: 48vmin; bottom: -12vmin; left: 30%;
		background: radial-gradient(circle, color-mix(in srgb, var(--zh-azure) 12%, transparent) 0%, transparent 68%);
		animation: zh-blob-c 40s ease-in-out infinite alternate;
	}
	/* 自定义配色：同样持续运动，但回落中性灰，不“上色” */
	:global(:root:not([data-zh-china="1"])) .zh-bg-blob {
		background: radial-gradient(circle, rgba(108, 112, 122, 0.14) 0%, transparent 68%);
	}
	@keyframes zh-bg-fade { to { opacity: 1; } }
	@keyframes zh-blob-a {
		from { transform: translate3d(0, 0, 0) scale(1); }
		50%  { transform: translate3d(12vmin, 9vmin, 0) scale(1.22); }
		to { transform: translate3d(24vmin, 18vmin, 0) scale(1.18); }
	}
	@keyframes zh-blob-b {
		from { transform: translate3d(0, 0, 0) scale(1.1); }
		50%  { transform: translate3d(-13vmin, 10vmin, 0) scale(0.92); }
		to { transform: translate3d(-26vmin, 20vmin, 0) scale(0.96); }
	}
	@keyframes zh-blob-c {
		from { transform: translate3d(0, 0, 0) scale(0.95); }
		50%  { transform: translate3d(11vmin, -10vmin, 0) scale(1.16); }
		to { transform: translate3d(22vmin, -20vmin, 0) scale(1.12); }
	}
	@media (prefers-reduced-motion: reduce) {
		.zh-bg { animation: none; opacity: 1; }
	}

	/* 内容浮于背景动效之上 */
	:global(.m3-footer) {
		position: relative;
		z-index: 1;
	}

	.m3-nav-ad {
		max-width: 1160px;
		margin: 0 auto;
		padding: 12px var(--md-sys-layout-side-margin, 16px) 0;
		text-align: center;
	}

	.m3-announce-banner {
		width: 100%;
		text-align: center;
	}
	.m3-announce-inner {
		max-width: 1160px;
		margin: 0 auto;
		padding: 10px 16px;
		display: flex; align-items: center; justify-content: center; gap: 12px;
		font-size: 14px; font-weight: 500; line-height: 1.4;
		border-radius: 0;
	}
	.m3-announce--info .m3-announce-inner {
		background: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
	}
	.m3-announce--warning .m3-announce-inner {
		background: var(--md-sys-color-tertiary-container);
		color: var(--md-sys-color-on-tertiary-container);
	}
	.m3-announce--alert .m3-announce-inner {
		background: var(--md-sys-color-error);
		color: var(--md-sys-color-on-error);
	}
	.m3-announce-text { flex: 1; }
	.m3-announce-close {
		flex-shrink: 0;
		display: flex; align-items: center; justify-content: center;
		width: 28px; height: 28px;
		border: none; border-radius: var(--md-sys-shape-corner-full);
		background: transparent;
		color: inherit; opacity: 0.7;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.m3-announce-close:hover { opacity: 1; background: rgba(0,0,0,0.08); }

	.m3-layout-body {
		max-width: 1160px;
		margin: 0 auto;
		padding: 0 var(--md-sys-layout-side-margin, 16px);
		display: flex;
		gap: 24px;
		position: relative;
		z-index: 1;
	}

	.m3-layout-body main {
		min-width: 0;
		flex: 1 1 auto;
		min-height: var(--md-sys-layout-min-height, calc(100vh - 3.5rem - 8rem));
	}

	@media (max-width: 899px) {
		.m3-layout-body { padding: 0; }
	}
</style>