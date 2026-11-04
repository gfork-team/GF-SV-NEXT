<script lang="ts">
	import { t, type Lang } from '$i18n';
	import Ad from '$components/Ad.svelte';
	import ContactChannels from '$components/ContactChannels.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);
</script>

<svelte:head>
	<title>{t(lang, 'meta.feedback_title')}</title>
	<meta name="description" content={t(lang, 'meta.feedback_desc')} />
	<meta
		name="keywords"
		content="greasyfork feedback, contact, userscript feedback, user script support"
	/>
</svelte:head>

<div class="width-constraint" style="padding-top:32px;padding-bottom:32px">
	<section class="text-content">
		<h2 class="headline-small" style="text-align:center;margin-bottom:16px">
			{t(lang, 'feedback.title_page')}
		</h2>
		<p style="margin-bottom:12px;color:var(--md-sys-color-on-surface-variant)">
			{t(lang, 'feedback.contact')}
		</p>
		<ContactChannels {lang} />

		<!-- AD: Bottom -->
		<div style="text-align:center;margin:16px 0">
			<Ad type="fluid" />
		</div>
	</section>

	<!-- AD: 页面末尾补充一个不同单元的曝光（反馈页原本只有 1 个单元） -->
	<div style="text-align:center;margin:24px 0 8px">
		<Ad type="auto" />
	</div>
</div>
