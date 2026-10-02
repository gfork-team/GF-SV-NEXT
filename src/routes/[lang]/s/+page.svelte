<script lang="ts">
	import type { Lang } from '$i18n';
	import { siteConfig } from '$lib/config';
	import { parseSearchParams, stringifySearchParams, type SearchParams } from '$lib/search-params';
	import RedirectInterstitial from '$components/RedirectInterstitial.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

	function buildUrl(lang: Lang): string {
		const merged: SearchParams = {};
		// hash 里的高级筛选优先于查询串（用户刚点的「应用筛选」更新）
		for (const src of [window.location.search, hashQuery()]) {
			for (const [k, v] of Object.entries(parseSearchParams(src))) merged[k] = v;
		}
		const qs = stringifySearchParams(merged);
		return qs ? `/${lang}/lookup#?${qs}` : `/${lang}/lookup`;
	}

	function hashQuery(): string {
		const hash = window.location.hash;
		return hash.startsWith('#?') ? hash.substring(2) : '';
	}
</script>

<RedirectInterstitial
	{lang}
	delaySec={siteConfig.redirects.searchDelaySec}
	{buildUrl}
	showAds={siteConfig.adsense.allowOnRedirectPages}
/>
