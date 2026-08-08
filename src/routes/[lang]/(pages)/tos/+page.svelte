<script lang="ts">
	import { t, type Lang } from '$i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);
</script>

<svelte:head>
	<title>{t(lang, 'meta.tos_title')}</title>
	<meta name="description" content={t(lang, 'meta.tos_desc')} />
	<meta name="keywords" content="terms of service, greasyfork proxy terms, user agreement, tos" />
</svelte:head>

<div class="width-constraint" style="padding-top:32px;padding-bottom:32px">
	<section class="text-content">
		<h2 class="headline-small" style="text-align:center;margin-bottom:20px">{t(lang, 'tos.title')}</h2>
		<h3>{t(lang, 'tos.welcome')}</h3>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.preamble')}</p>

		<hr class="md3-divider" />

		<h3>{t(lang, 'tos.section1_title')}</h3>
		<p style="color:var(--md-sys-color-on-surface-variant)">{@html t(lang, 'tos.section1_1')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{@html t(lang, 'tos.section1_2')}</p>

		<h3>{t(lang, 'tos.section2_title')}</h3>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section2_1')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section2_2')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section2_3')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section2_4')}</p>

		<h3>{t(lang, 'tos.section3_title')}</h3>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section3_1')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section3_2')}</p>
		<h4>{t(lang, 'tos.section3_3_title')}</h4>
		<p style="color:var(--md-sys-color-on-surface-variant)">{@html t(lang, 'tos.section3_3_content')}</p>

		<h3>{t(lang, 'tos.section4_title')}</h3>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section4_1')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section4_2')}</p>

		<h3>{t(lang, 'tos.section5_title')}</h3>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section5_1')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section5_2')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section5_3')}</p>

		<h3>{t(lang, 'tos.section6_title')}</h3>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section6_1')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section6_2')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section6_3')}</p>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section6_4')}</p>

		<h3>{t(lang, 'tos.section7_title')}</h3>
		<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'tos.section7_1')}</p>
		<p><strong>{t(lang, 'tos.email')}</strong></p>

		<hr class="md3-divider" />
		<p style="text-align:center"><strong>{t(lang, 'tos.thanks')}</strong></p>
	</section>
</div>