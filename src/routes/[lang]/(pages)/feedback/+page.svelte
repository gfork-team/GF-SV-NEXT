<script lang="ts">
	import { t, type Lang } from '$i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);
</script>

<svelte:head>
	<title>{t(lang, 'meta.feedback_title')}</title>
	<meta name="description" content={t(lang, 'meta.feedback_desc')} />
	<meta name="keywords" content="greasyfork feedback, contact, userscript feedback, user script support" />
</svelte:head>

<div class="width-constraint" style="padding-top:32px;padding-bottom:32px">
	<section class="text-content">
		<h2 class="headline-small" style="text-align:center;margin-bottom:16px">{t(lang, 'feedback.title_page')}</h2>
		<p style="margin-bottom:12px;color:var(--md-sys-color-on-surface-variant)">{t(lang, 'feedback.contact')}</p>
		<p>
			{t(lang, 'tos.email')}<br />
			<strong>{t(lang, 'tos.email')}</strong>
		</p>
	</section>
</div>