<script lang="ts">
	import { t, type Lang } from '$i18n';
	import { siteConfig } from '$config';
	import DownloadProbeBlock from '$lib/dynamic/blocks/DownloadProbeBlock.svelte';
	import type { PageData } from './$types';

	/*
	 * 测速流程、节点列表与跳转全在区块里（$lib/dynamic/blocks/download.svelte.ts），
	 * 页面只负责组合与广告开关。
	 */
	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);
	/** 广告开关：layout 层已按 adsense.allowedLangs 过滤，这里再叠加页面级开关 */
	let showAds = $derived(data.showAds && siteConfig.adsense.allowOnDownloadPage);
</script>

<svelte:head>
	<title>{t(lang, 'download.title')} - ZGF</title>
	<meta name="description" content={t(lang, 'download.description')} />
	<meta
		name="keywords"
		content="script download, userscript install, script acceleration download, greasyfork download, user script download"
	/>
</svelte:head>

<DownloadProbeBlock {lang} {showAds} />
