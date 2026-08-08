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
	import { initTheme, handleSystemChange } from '$lib/theme.svelte';
	import { getColorFoucScript } from '$lib/colors';
	import Nav from '$components/Nav.svelte';
	import Footer from '$components/Footer.svelte';
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

	onMount(() => {
		initTheme();
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
	<!-- Theme flash prevention: sets inline CSS vars before paint -->
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
		<script>(function(){var t;function r(){var a=window.adsbygoogle||[];var u=document.querySelectorAll('.adsbygoogle[data-ad-status="unfilled"]');if(u.length){u.forEach(function(e){var c=parseInt(e.getAttribute('data-retry-count')||'0');if(c<3){e.setAttribute('data-retry-count',String(c+1));e.removeAttribute('data-ad-status');a.push({})}});t=setTimeout(r,2500)}else{t=undefined}}setTimeout(function(){r()},3000);window.addEventListener('load',function(){if(!t){setTimeout(r,1000)}})})();</script>
	{/if}
	{#if showAds && gtmCode}
		{@html `<script>${gtmCode}</script>`}
	{/if}
</svelte:head>

<Nav {lang} />

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

<style>
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