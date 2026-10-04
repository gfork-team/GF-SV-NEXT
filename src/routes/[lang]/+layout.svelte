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
		webPageJsonLd,
		breadcrumbJsonLd
	} from '$lib/seo';
	import { sendAudit } from '$lib/audit';
	import { onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import { initTheme, handleSystemChange } from '$lib/theme.svelte';
	import { initAdState, markSdkReady, markSdkBlocked, GOOGLEFC_INIT } from '$lib/ad-state.svelte';
	import { getColorFoucScript } from '$lib/colors';
	import { scriptTag } from '$utils';
	import Nav from '$components/Nav.svelte';
	import Footer from '$components/Footer.svelte';
	import CookieConsent from '$components/CookieConsent.svelte';
	import Snackbar from '$components/Snackbar.svelte';
	import InstallGuideDialog from '$components/InstallGuideDialog.svelte';
	import Icon from '$components/Icon.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
	let lang: Lang = $derived(data.lang);
	let showAds: boolean = $derived(data.showAds);

	let announceDismissed = $state(
		typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gf-announce.dismissed') === '1'
	);

	function dismissAnnounce() {
		announceDismissed = true;
		try {
			sessionStorage.setItem('gf-announce.dismissed', '1');
		} catch {
			// 无痕/隐私模式下 sessionStorage 可能不可写，关掉本次公告即可
		}
	}

	let announceEnabled = $derived(siteConfig.announce.enabled && !announceDismissed);
	let announceType = $derived(siteConfig.announce.type as string);
	let announceMsg = $derived(
		siteConfig.announce.message[lang] || siteConfig.announce.message['en'] || ''
	);
	let announceVisible = $derived(announceEnabled && announceMsg.length > 0);

	// 回到顶部按钮：滚动超过阈值后显示
	let showBackTop = $state(false);
	let reducedMotion = $state(false);

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
	}

	onMount(() => {
		initTheme();
		// 中国大陆无强制 Cookie 同意要求，视同已同意；其余地区按用户选择投放
		initAdState(lang === 'zh-hans');
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const onScroll = () => {
			showBackTop = window.scrollY > 400;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });

		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		mql.addEventListener('change', () => handleSystemChange());

		// Audit: pageview
		if (siteConfig.audit.enabled) {
			sendAudit('pageview', {
				path: page.url.pathname,
				lang: data.lang as string,
				referrer: document.referrer || undefined
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
						stack: error instanceof Error ? (error.stack || '').substring(0, 2000) : ''
					}
				});
				if (prevOnError) return prevOnError(msg, source, lineno, colno, error);
				return false;
			};
		}
	});

	// 路由切换动画：使用浏览器原生 View Transitions，浏览器不支持时自动降级
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	let cleanPath: string = $derived(page.url.pathname.replace(/^\/[^/]+/, '') || '/');
	let routeMeta = $derived(ROUTE_META[cleanPath] ?? ROUTE_META['/']!);
	let pageTitle = $derived(t(lang, routeMeta.titleKey));
	let pageDesc = $derived(t(lang, routeMeta.descKey));
	let canonical = $derived(canonicalUrl(lang, cleanPathFrom(page.url.pathname)));
	let ogImage = $derived(siteUrl(siteConfig.seo.defaultOgImage));
	// 跳转中间页不进索引；其余页面放开图片/摘要抓取上限，争取富媒体展示
	let isInterstitial = $derived(cleanPath === '/s' || cleanPath === '/l');
	let robotsContent = $derived(
		isInterstitial
			? 'noindex, follow'
			: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
	);
	let gtmId = siteConfig.adsense.gtmId;
	// AdSense 主脚本地址走配置；CN 端点对大陆访问更快，可整体替换
	let adsenseScript: string =
		siteConfig.adsense.script ||
		siteConfig.cdn.adsenseScript ||
		'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
	let adsenseClient: string = siteConfig.adsense.publisherId;
	let adsPrefetch: string[] = $derived(siteConfig.adsense.dnsPrefetch ?? []);
	let gtmCode = $derived(
		gtmId
			? `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id=${gtmId}';f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`
			: ''
	);
	let gtmNoscript = $derived(
		gtmId
			? `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
			: ''
	);
	let cdnStatic = $derived(siteConfig.cdn.enabled ? siteConfig.cdn.static : '');
	let cdnSiteProxy = $derived(siteProxyUrl());
</script>

<svelte:head>
	<!-- 以下注入的都是仓库自身生成的常量（配色脚本、结构化数据、AdSense/GTM 初始化代码），
	     不含任何远程输入，因此这里关闭 {@html} 的 XSS 告警是安全的。 -->
	<!-- eslint-disable svelte/no-at-html-tags -->

	<!-- Anti-FOUC（paint 前同步套用本地配色，杜绝闪变） -->
	{@html scriptTag(getColorFoucScript())}

	<!-- Robots directive（跳转中间页 noindex；正文页放开摘要/图片抓取上限） -->
	<meta name="robots" content={robotsContent} />

	<!-- Canonical URL (no trailing slash, Uniform URL) -->
	<link rel="canonical" href={canonical} />

	<!-- Open Graph -->
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:locale" content={OG_LOCALES[lang]} />
	{#each i18nConfig.supportedLangs as altLang (altLang)}
		{#if altLang !== lang}
			<meta property="og:locale:alternate" content={OG_LOCALES[altLang]} />
		{/if}
	{/each}
	<meta property="og:type" content={routeMeta.ogType || 'website'} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDesc} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content={String(siteConfig.seo.defaultOgImageWidth)} />
	<meta property="og:image:height" content={String(siteConfig.seo.defaultOgImageHeight)} />
	<meta property="og:image:alt" content={siteConfig.name} />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	{#if siteConfig.seo.twitterHandle}
		<meta name="twitter:site" content={siteConfig.seo.twitterHandle} />
	{/if}
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDesc} />
	<meta name="twitter:image" content={ogImage} />

	<!-- 搜索引擎站长验证（config.json → seo.*，留空则不输出） -->
	{#if siteConfig.seo.googleVerification}
		<meta name="google-site-verification" content={siteConfig.seo.googleVerification} />
	{/if}
	{#if siteConfig.seo.baiduVerification}
		<meta name="baidu-site-verification" content={siteConfig.seo.baiduVerification} />
	{/if}
	{#if siteConfig.seo.bingVerification}
		<meta name="msvalidate.01" content={siteConfig.seo.bingVerification} />
	{/if}

	<!-- Structured data: WebSite + Organization (site-wide) -->
	{#if cleanPath !== '/s' && cleanPath !== '/l'}
		{@html scriptTag(websiteJsonLd(lang), ' type="application/ld+json"')}
		{@html scriptTag(organizationJsonLd(), ' type="application/ld+json"')}
		{@html scriptTag(
			webPageJsonLd(lang, cleanPath, pageTitle, pageDesc),
			' type="application/ld+json"'
		)}

		<!-- Structured data: BreadcrumbList (auto-derived from path) -->
		{#if cleanPath !== '/'}
			{@html scriptTag(breadcrumbJsonLd(lang, cleanPath, pageTitle), ' type="application/ld+json"')}
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

	<!-- hreflang alternates (including x-default, Uniform URL no trailing slash) -->
	{#each i18nConfig.supportedLangs as langCode (langCode)}
		<link
			rel="alternate"
			hreflang={i18nConfig.langNames[langCode]}
			href={canonicalUrl(langCode, cleanPath)}
		/>
	{/each}
	<link
		rel="alternate"
		hreflang="x-default"
		href={canonicalUrl(i18nConfig.defaultLang, cleanPath)}
	/>

	{#if showAds}
		<!-- 广告域名预解析：减少 adsbygoogle.js 首字节延迟 -->
		{#each adsPrefetch as host (host)}
			<link rel="dns-prefetch" href={host} />
			<link rel="preconnect" href={host} crossorigin="anonymous" />
		{/each}
		<!--
			AdSense 主脚本。googlefc:true 是非个性化广告通道的开关：
			用户拒绝 Cookie 同意时，Ad 组件通过该通道仍可展示非个性化广告。
		-->
		<script
			async
			src="{adsenseScript}?client={adsenseClient}"
			crossorigin="anonymous"
			onload={() => markSdkReady()}
			onerror={() => markSdkBlocked()}
		></script>
		<!-- 非个性化广告通道开关：用户拒绝 Cookie 同意时靠它仍可获得展示 -->
		{@html scriptTag(GOOGLEFC_INIT)}
	{/if}
	{#if showAds && gtmCode}
		{@html scriptTag(gtmCode)}
	{/if}

	<!-- eslint-enable svelte/no-at-html-tags -->
</svelte:head>

<div class="zh-topbar"></div>
<Nav {lang} />

{#if announceVisible}
	<div class="announce announce--{announceType}">
		<div class="announce__inner">
			<span class="announce__text">{announceMsg}</span>
			<button class="announce__close" onclick={dismissAnnounce} aria-label="Close announcement">
				<Icon name="close" size={16} />
			</button>
		</div>
	</div>
{/if}

<!-- GTM noscript fallback (before any visible content) -->
{#if showAds && gtmNoscript}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- 本仓库 config 里的 GTM noscript 片段常量 -->
	<noscript>{@html gtmNoscript}</noscript>
{/if}

<div class="layout-body">
	<main id="main" tabindex="-1">
		{@render children()}
	</main>
</div>

<Footer {lang} />

<CookieConsent {lang} />

<Snackbar />

<InstallGuideDialog {lang} />

<!-- 回到顶部按钮（右下角） -->
<button
	class="back-top"
	class:show={showBackTop}
	onclick={scrollToTop}
	aria-label="Back to top"
	title="Back to top"
>
	<Icon name="arrow-up" size={24} />
</button>

<style>
	/* 回到顶部按钮 */
	.back-top {
		position: fixed;
		right: 16px;
		bottom: 16px;
		z-index: 70;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-full);
		background: var(--md-sys-color-secondary-container);
		color: var(--md-sys-color-on-secondary-container);
		cursor: pointer;
		opacity: 0;
		visibility: hidden;
		transform: translateY(8px);
		transition:
			opacity var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard),
			transform var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard),
			visibility var(--md-sys-motion-duration-medium);
	}
	.back-top.show {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
	}
	.back-top:hover {
		background: var(
			--md-sys-color-secondary-container-high,
			var(--md-sys-color-secondary-container)
		);
	}
	.back-top:active {
		transform: translateY(0) scale(0.94);
	}
	@media (min-width: 840px) {
		.back-top {
			right: 24px;
			bottom: 24px;
		}
	}

	/* 全站公告条 */
	.announce {
		text-align: center;
	}
	.announce__inner {
		max-width: var(--md-sys-layout-max-width);
		margin: 0 auto;
		padding: 10px 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		font-size: var(--md-sys-typescale-body-medium-size);
		font-weight: 500;
	}
	.announce--info .announce__inner {
		background: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
	}
	.announce--warning .announce__inner {
		background: var(--md-sys-color-tertiary-container);
		color: var(--md-sys-color-on-tertiary-container);
	}
	.announce--alert .announce__inner {
		background: var(--md-sys-color-error-container);
		color: var(--md-sys-color-on-error-container);
	}
	.announce__text {
		flex: 1;
	}
	.announce__close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: var(--md-sys-shape-corner-full);
		background: transparent;
		color: inherit;
		opacity: 0.75;
		cursor: pointer;
	}
	.announce__close:hover {
		opacity: 1;
		background: rgb(0 0 0 / 0.08);
	}

	/* 顶部细粉紫带（gov.cn 风格） */
	.zh-topbar {
		height: 4px;
		background: linear-gradient(
			90deg,
			var(--zh-seal-deep, #c86b8a) 0%,
			var(--zh-seal, #ddaacc) 50%,
			var(--zh-seal-bright, #eed3e5) 100%
		);
	}

	/* 正文与 Nav / Footer 共用同一个宽度 token，避免三块内容左右错位 */
	.layout-body {
		max-width: var(--md-sys-layout-max-width);
		margin: 0 auto;
		padding: 24px var(--md-sys-layout-side-margin) 48px;
	}
	.layout-body main {
		min-height: 60vh;
	}
	.layout-body main:focus {
		outline: none;
	}

	@media (max-width: 599px) {
		.layout-body {
			padding: 16px var(--md-sys-layout-side-margin) 32px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.back-top {
			transition: none;
		}
	}

	/* 路由切换过渡（View Transitions） */
	@media (prefers-reduced-motion: no-preference) {
		::view-transition-old(root) {
			animation: vt-out 90ms ease-in both;
		}
		::view-transition-new(root) {
			animation: vt-in 140ms ease-out both;
		}
	}
	@keyframes vt-out {
		to {
			opacity: 0;
		}
	}
	@keyframes vt-in {
		from {
			opacity: 0;
		}
	}
</style>
