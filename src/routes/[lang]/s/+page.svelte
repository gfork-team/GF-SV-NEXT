<script lang="ts">
	import type { Lang } from '$i18n';
	import { siteConfig } from '$lib/config';
	import RedirectInterstitial from '$components/RedirectInterstitial.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

	function buildUrl(lang: Lang): string {
		const sp = new URLSearchParams(window.location.search);
		let hp = new URLSearchParams();
		const hash = window.location.hash;
		if (hash && hash.indexOf('#?') === 0) hp = new URLSearchParams(hash.substring(2));
		const merged = new URLSearchParams();
		sp.forEach((v, k) => { if (v) merged.set(k, v); });
		hp.forEach((v, k) => { if (v) merged.set(k, v); });
		const qs = merged.toString();
		return qs ? `/${lang}/lookup#?${qs}` : `/${lang}/lookup`;
	}
</script>

<RedirectInterstitial {lang} delaySec={siteConfig.redirects.searchDelaySec} {buildUrl} showAds={siteConfig.adsense.allowOnRedirectPages} />
