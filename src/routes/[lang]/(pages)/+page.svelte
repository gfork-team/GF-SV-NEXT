<script lang="ts">
	import { t, type Lang } from '$i18n';
	import { siteConfig } from '$lib/config';
	import Ad from '$components/Ad.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

	let inputUrl = $state('');
	let outputUrl = $state('');
	let urlError = $state('');

	function replaceUrl() {
		const url = inputUrl.trim();
		urlError = '';
		outputUrl = '';

		if (!/greasyfork\.org|sleazyfork\.org/.test(url)) {
			urlError = t(lang, 'home.url_tool.error');
			return;
		}

		let result = url;
		siteConfig.urlRewriteRules.forEach(({ from, to }) => {
			result = result.replace(from, to);
		});
		outputUrl = result;
	}
</script>

<svelte:head>
<title>{t(lang, 'meta.home_title')}</title>
	<meta name="description" content={t(lang, 'meta.home_desc')} />
	<meta name="keywords" content="greasyfork, mirror, proxy, userscript, greasyfork镜像, 油猴脚本, 脚本加速, greasyfork加速, user scripts, tampermonkey" />
</svelte:head>

<div class="container-main" style="padding-top:32px;padding-bottom:32px">
	<div style="max-width:640px;margin:0 auto">

		<!-- ═══ AD: Top banner ═══ -->
		<div style="text-align:center;margin-bottom:16px">
			<Ad type="fluid" />
		</div>

		<!-- ═══ Hero Search Section ═══ -->
		<div class="md3-card">
			<h2 class="headline-medium" style="margin-bottom:24px;text-align:center">{t(lang, 'home.super_title')}</h2>
			<form class="home-search" action="/{lang}/s" accept-charset="UTF-8" method="get" target="_blank" style="display:flex;flex-direction:column;align-items:center;gap:12px" onsubmit={e => { const fd = new FormData(e.currentTarget as HTMLFormElement); const qs = new URLSearchParams(); fd.forEach((v, k) => { const val = typeof v === 'string' ? v.trim() : ''; if (val) qs.set(k, val); }); (e.currentTarget as HTMLFormElement).action = `/${lang}/s?${qs.toString()}`; }}>
				<div class="md3-search-bar">
					<input type="search" name="q" placeholder={t(lang, 'search.placeholder')} required />
					<input type="hidden" name="sort" value="" />
					<input type="hidden" name="filter_locale" value="0" />
					<button type="submit" class="search-icon-btn md3-ripple" aria-label={t(lang, 'search.button')}>
						<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</button>
				</div>
				{#if siteConfig.search.siteFilterEnabled}
				<div class="md3-search-bar" style="width:50%;min-width:200px">
					<input type="search" name="site" placeholder={t(lang, 'search.site.placeholder')} />
				</div>
				{/if}
			</form>
		</div>

		<!-- ═══ AD: Below search ═══ -->
		<div style="text-align:center;margin:16px 0">
			<Ad type="fluid" />
		</div>

		<!-- ═══ Intro Section ═══ -->
		<div class="md3-card" style="margin-top:16px;text-align:center">
			<img src="/img/gforkg.svg" alt="site-logo" loading="lazy" style="height:180px;user-select:none;pointer-events:none" />
			<p style="margin-top:16px;color:var(--md-sys-color-on-surface-variant)">{t(lang, 'home.intro')}</p>
		</div>

		<!-- ═══ ScriptCat Recommend (Chinese only) ═══ -->
		{#if lang === 'zh-hans' || lang === 'zh-hant'}
		<div class="md3-card">
			<p style="font-size:0.8em;color:var(--md-sys-color-on-surface-variant);text-align:center">
				{t(lang, 'home.recommend')}
				<a href="https://bbs.tampermonkey.net.cn/forum.php" target="_blank" rel="noopener noreferrer">{t(lang, 'home.recommend.link1')}</a>
				{t(lang, 'home.recommend.link2')}
			</p>
		</div>

		{/if}

		<!-- ═══ URL Tool Section ═══ -->
		<div class="md3-card" style="margin-top:16px;text-align:center">
			<p style="margin-bottom:12px;font-weight:500">{t(lang, 'home.url_tool.title')}</p>
			<div style="display:flex;flex-direction:column;gap:8px;max-width:560px;margin:0 auto 16px">
				<input type="search" id="inputUrl" bind:value={inputUrl} placeholder={t(lang, 'home.url_tool.placeholder')}
					style="padding:10px 16px;border:1px solid var(--md-sys-color-outline-variant);border-radius:var(--md-sys-shape-corner-full);font-family:inherit;font-size:14px;background:var(--md-sys-color-surface-container-highest);outline:none;color:var(--md-sys-color-on-surface)" />
				<button onclick={replaceUrl} class="md3-button md3-ripple">{t(lang, 'home.url_tool.button')}</button>
			</div>
			<p class="text-gf-muted">{t(lang, 'home.url_tool.result')}</p>
			{#if outputUrl}
				<p id="outputUrl" style="word-break:break-all;font-family:monospace;background:var(--md-sys-color-surface-container-highest);padding:10px 16px;border-radius:var(--md-sys-shape-corner-small);margin-top:8px;font-size:13px">{outputUrl}</p>
			{/if}
			{#if urlError}
				<p id="errorMessage" style="color:var(--md-sys-color-error);margin-top:8px">{urlError}</p>
			{/if}
		</div>

		<!-- ═══ AD: After URL tool ═══ -->
		<div style="text-align:center;margin:16px 0">
			<Ad type="autorelaxed" />
		</div>

		<!-- ═══ TOS & Installing Links ═══ -->
		<div class="md3-card" style="margin-top:16px;text-align:center">
			<div style="display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap">
				<span>{t(lang, 'home.tos_agree')}</span>
				<a href="/{lang}/tos" class="md3-tonal-button md3-ripple" data-sveltekit-preload-data="hover">{t(lang, 'home.tos_link')}</a>
			</div>
			<div style="margin-top:16px">
				<a href="/{lang}/installing" class="md3-tonal-button md3-ripple" data-sveltekit-preload-data="hover">{t(lang, 'home.installing_link')}</a>
			</div>
		</div>

		<!-- ═══ AD: Bottom ═══ -->
		<div style="text-align:center;margin-top:16px">
			<Ad type="auto" />
		</div>

	</div>
</div>
