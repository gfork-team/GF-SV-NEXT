<script lang="ts">
	import { onMount } from 'svelte';
	import { t, type Lang } from '$i18n';
	import { getConsentGranted, setConsent } from '$lib/ad-state.svelte';

	let { lang }: { lang: Lang } = $props();

	let visible = $state(false);
	let hidden = $state(false);

	function dismiss(granted: boolean) {
		hidden = true;
		setConsent(granted);
	}

	onMount(() => {
		if (lang === 'zh-hans') return;
		if (getConsentGranted() !== null) return;
		visible = true;
	});
</script>

{#if visible}
	<div class="cookie-consent" class:is-hidden={hidden} role="dialog" aria-live="polite">
		<div class="cookie-card ui-card">
			<h2 class="cookie-title">{t(lang, 'cookie.title')}</h2>
			<p class="cookie-text">
				{t(lang, 'cookie.text')}
				<a class="cookie-link" href="/{lang}/tos" data-sveltekit-preload-data="hover"
					>{t(lang, 'cookie.tos_link')}</a
				>
			</p>
			<div class="cookie-actions">
				<button class="ui-btn ui-btn--filled" onclick={() => dismiss(true)}>
					{t(lang, 'cookie.accept')}
				</button>
				<button class="ui-btn ui-btn--outlined" onclick={() => dismiss(false)}>
					{t(lang, 'cookie.decline')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.cookie-consent {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 80;
		display: flex;
		justify-content: center;
		padding: 0 16px 16px;
		pointer-events: none;
	}
	.cookie-consent.is-hidden {
		opacity: 0;
		transform: translateY(16px);
		visibility: hidden;
	}

	.cookie-card {
		pointer-events: auto;
		width: 100%;
		max-width: 560px;
		padding: 18px 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		transition:
			opacity var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard),
			transform var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard),
			visibility var(--md-sys-motion-duration-short);
	}

	.cookie-title {
		margin: 0;
		font-size: var(--md-sys-typescale-title-medium-size);
		font-weight: 500;
		color: var(--md-sys-color-on-surface);
	}

	.cookie-text {
		margin: 0;
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.6;
		color: var(--md-sys-color-on-surface-variant);
	}

	.cookie-link {
		color: var(--md-sys-color-primary);
		text-decoration: none;
	}
	.cookie-link:hover {
		text-decoration: underline;
	}

	.cookie-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.cookie-actions > * {
		flex: 1 1 auto;
	}

	@media (prefers-reduced-motion: reduce) {
		.cookie-card {
			transition: none;
		}
	}
</style>
