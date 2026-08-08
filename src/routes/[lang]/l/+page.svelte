<script lang="ts">
	import type { Lang } from '$i18n';
	import { siteConfig } from '$lib/config';
	import RedirectInterstitial from '$components/RedirectInterstitial.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

	function buildUrl(lang: Lang): string {
		const hash = window.location.hash;
		return window.location.origin + '/' + lang + '/download' + (hash && hash.indexOf('#/') === 0 ? hash : '');
	}
</script>

<RedirectInterstitial {lang} delaySec={siteConfig.redirects.downloadDelaySec} {buildUrl} showAds={siteConfig.adsense.allowOnRedirectPages} />
