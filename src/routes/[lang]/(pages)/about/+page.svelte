<script lang="ts">
	import { t, type Lang } from '$i18n';
	import { siteConfig } from '$lib/config';
	import Ad from '$components/Ad.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);
</script>

<svelte:head>
	<title>{t(lang, 'meta.about_title')}</title>
	<meta name="description" content={t(lang, 'meta.about_desc')} />
	<meta name="keywords" content="about greasyfork, mirror service, greasyfork mirror, userscripts, greasy fork proxy, script acceleration" />
</svelte:head>

<div class="container-main" style="padding-top:32px;padding-bottom:32px">
	<div style="max-width:640px;margin:0 auto">
		<h1 class="headline-medium" style="margin-bottom:24px">{t(lang, 'about.title')}</h1>

		<!-- Description -->
		<div class="md3-card">
			<p style="color:var(--md-sys-color-on-surface-variant);line-height:1.6;font-size:14px">
				{t(lang, 'about.description')}
			</p>
		</div>

		<!-- Features -->
		<div class="md3-card" style="margin-top:16px">
			<h2 class="title-large" style="margin-bottom:16px">{t(lang, 'about.features')}</h2>
			<ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:12px">
				<li style="display:flex;align-items:flex-start;gap:12px;font-size:14px;color:var(--md-sys-color-on-surface-variant)">
					<svg width="20" height="20" fill="none" stroke="var(--md-sys-color-primary)" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>{t(lang, 'about.feature_1')}</span>
				</li>
				<li style="display:flex;align-items:flex-start;gap:12px;font-size:14px;color:var(--md-sys-color-on-surface-variant)">
					<svg width="20" height="20" fill="none" stroke="var(--md-sys-color-primary)" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>{t(lang, 'about.feature_2')}</span>
				</li>
				<li style="display:flex;align-items:flex-start;gap:12px;font-size:14px;color:var(--md-sys-color-on-surface-variant)">
					<svg width="20" height="20" fill="none" stroke="var(--md-sys-color-primary)" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>{t(lang, 'about.feature_3')}</span>
				</li>
				<li style="display:flex;align-items:flex-start;gap:12px;font-size:14px;color:var(--md-sys-color-on-surface-variant)">
					<svg width="20" height="20" fill="none" stroke="var(--md-sys-color-primary)" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>{t(lang, 'about.feature_4')}</span>
				</li>
			</ul>
		</div>

		<!-- AD: After features -->
		<div style="text-align:center;margin:16px 0">
			<Ad type="auto" />
		</div>

		<!-- Open Source -->
		<div class="md3-card" style="margin-top:16px">
			<h2 class="title-large" style="margin-bottom:12px">{t(lang, 'about.opensource_title')}</h2>
			<p style="color:var(--md-sys-color-on-surface-variant);line-height:1.6;font-size:14px">
				{t(lang, 'about.opensource_desc')}
				<a href={siteConfig.github.org} style="color:var(--md-sys-color-primary)">{t(lang, 'about.opensource_link')}</a>
			</p>
		</div>

		<!-- Contact -->
		<div class="md3-card" style="margin-top:16px">
			<h2 class="title-large" style="margin-bottom:12px">{t(lang, 'about.contact')}</h2>
			<p style="color:var(--md-sys-color-on-surface-variant);line-height:1.6;font-size:14px">
				{t(lang, 'about.contact_desc')}
				<a href="mailto:{siteConfig.contactEmail}" style="color:var(--md-sys-color-primary)">{siteConfig.contactEmail}</a>
			</p>
		</div>

		<!-- User Agreement -->
		<div class="md3-card" style="margin-top:16px">
			<h2 class="title-large" style="margin-bottom:12px">{t(lang, 'about.tos_title')}</h2>
			<p style="color:var(--md-sys-color-on-surface-variant);line-height:1.6;font-size:14px">
				{t(lang, 'about.tos_desc')}
				<a href="/{lang}/tos" style="color:var(--md-sys-color-primary)">{t(lang, 'about.tos_link')}</a>
			</p>
		</div>

		<!-- AD: Bottom -->
		<div style="text-align:center;margin:16px 0">
			<Ad type="autorelaxed" />
		</div>
	</div>
</div>