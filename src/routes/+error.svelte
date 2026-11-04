<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { adsenseScriptUrl, siteConfig } from '$lib/config';
	import { initAdState, markSdkBlocked, GOOGLEFC_INIT } from '$lib/ad-state.svelte';
	import { scriptTag } from '$utils';
	import Ad from '$components/Ad.svelte';

	/*
	 * 错误页可能渲染在 [lang] 布局内部（那里已经注入了 adsbygoogle.js），
	 * 只有「独立渲染」（拿不到 layout 的 lang）时才自带脚本，
	 * 否则同一文档会执行两份 SDK，AdSense 会报 already-have-ads 并可能漏投。
	 */
	let hasLayoutSdk = $derived(!!(page.data as { lang?: string }).lang);
	let showAds = $derived(!hasLayoutSdk && siteConfig.adsense.enabled);

	let locale = $derived((page.data as { lang?: string }).lang ?? 'zh-hant');
	let isZh = $derived(locale.startsWith('zh'));
	let isHant = $derived(locale === 'zh-hant');
	let homeHref = $derived(`/${locale === 'zh-hant' ? 'zh-hant' : locale}`);
	let homeLabel = $derived(isHant ? '返回首頁' : isZh ? '返回首页' : 'Go Home');
	let notFoundTitle = $derived(isHant ? '找不到頁面' : isZh ? '找不到页面' : 'Page Not Found');
	let notFoundDesc = $derived(
		isHant
			? '您訪問的頁面不存在、已被移動，或連結有誤。'
			: isZh
				? '您访问的页面不存在、已被移动，或链接有误。'
				: 'The page you are looking for does not exist or has been moved.'
	);

	onMount(() => {
		initAdState(isZh);
	});
</script>

<svelte:head>
	<title>{notFoundTitle} - ZGF</title>
	{#if showAds}
		<script
			async
			src="{adsenseScriptUrl()}?client={siteConfig.adsense.publisherId}"
			crossorigin="anonymous"
			onerror={() => markSdkBlocked()}
		></script>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- 本仓库自身生成的 AdSense 初始化常量 -->
		{@html scriptTag(GOOGLEFC_INIT)}
	{/if}
</svelte:head>

<div class="e404">
	<main class="e404-card ui-card">
		<h1 class="e404-code">404</h1>
		<p class="e404-title">{notFoundTitle}</p>
		<p class="e404-desc">{notFoundDesc}</p>
		<a class="ui-btn ui-btn--filled ui-btn--lg" href={homeHref}>{homeLabel}</a>
	</main>

	<aside class="e404-extra">
		<Ad type="autorelaxed" />

		<p class="e404-sponsor">
			Sponsored by <a href={siteConfig.sponsor.url} target="_blank" rel="noopener noreferrer"
				>{siteConfig.sponsor.name}</a
			>
		</p>
		<a href={siteConfig.sponsor.url} target="_blank" rel="noopener noreferrer">
			<img
				src={siteConfig.sponsor.image}
				alt="Sponsor"
				loading="lazy"
				width="400"
				height="60"
				class="e404-sponsor-img"
			/>
		</a>

		<div class="e404-footer-ad">
			<Ad type="auto" />
		</div>
	</aside>
</div>

<style>
	.e404 {
		position: relative;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 20px;
		background: var(--md-sys-color-surface, #fafafa);
		color: var(--md-sys-color-on-surface, #1f1f1f);
		text-align: center;
	}
	.e404-card {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 480px;
		padding: 48px 32px 40px;
		text-align: center;
	}
	.e404-code {
		font-size: 76px;
		font-weight: 300;
		color: var(--md-sys-color-primary);
		margin: 0;
		line-height: 1.1;
		letter-spacing: 2px;
	}
	.e404-title {
		font-size: var(--md-sys-typescale-headline-small-size);
		font-weight: 500;
		margin: 8px 0;
		color: var(--md-sys-color-on-surface);
	}
	.e404-desc {
		font-size: var(--md-sys-typescale-body-medium-size);
		color: var(--md-sys-color-on-surface-variant);
		margin: 0 0 28px;
		line-height: 1.7;
	}
	.e404-extra {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 600px;
		margin-top: 36px;
	}
	.e404-sponsor {
		margin: 36px 0 8px;
		font-size: var(--md-sys-typescale-body-medium-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.e404-sponsor a {
		color: var(--md-sys-color-primary);
	}
	.e404-sponsor-img {
		max-width: 100%;
		height: auto;
	}
	.e404-footer-ad {
		width: 100%;
		margin-top: 24px;
	}

	@media (max-width: 480px) {
		.e404-code {
			font-size: 56px;
		}
		.e404-card {
			padding: 36px 20px 28px;
		}
	}
</style>
