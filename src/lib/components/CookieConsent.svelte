<script lang="ts">
	import { onMount } from 'svelte';
	import { t, type Lang } from '$i18n';

	let { lang }: { lang: Lang } = $props();

	const STORAGE_KEY = 'gf-cookie-consent';

	let visible = $state(false);
	let hidden = $state(false);

	function dismiss(choice: '1' | '0') {
		hidden = true;
		try {
			localStorage.setItem(STORAGE_KEY, choice);
		} catch {
			/* storage unavailable — still hide in this session */
		}
	}

	onMount(() => {
		if (lang === 'zh-hans') return;
		let answered = false;
		try {
			answered = localStorage.getItem(STORAGE_KEY) !== null;
		} catch {
			answered = false;
		}
		if (!answered) {
			visible = true;
		}
	});
</script>

{#if visible}
	<div class="cookie-consent" class:is-hidden={hidden} role="dialog" aria-live="polite">
		<div class="cookie-card">
			<h2 class="cookie-title">{t(lang, 'cookie.title')}</h2>
			<p class="cookie-text">
				{t(lang, 'cookie.text')}
				<a class="cookie-link" href="/{lang}/tos" data-sveltekit-preload-data="hover">{t(lang, 'cookie.tos_link')}</a>
			</p>
			<div class="cookie-actions">
				<button class="cookie-btn cookie-btn--accept" onclick={() => dismiss('1')}>
					{t(lang, 'cookie.accept')}
				</button>
				<button class="cookie-btn cookie-btn--decline" onclick={() => dismiss('0')}>
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
		background: var(--md-sys-color-surface-container-lowest, #ffffff);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: 14px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(0, 0, 0, 0.06), 0 24px 64px rgba(0, 0, 0, 0.1);
		padding: 18px 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		transition: opacity 200ms ease-out, transform 200ms ease-out, visibility 200ms;
	}

	.cookie-title {
		margin: 0;
		font-size: var(--md-sys-typescale-title-medium-size, 16px);
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}

	.cookie-text {
		margin: 0;
		font-size: var(--md-sys-typescale-body-medium-size, 14px);
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

	.cookie-btn {
		flex: 1 1 auto;
		min-height: 40px;
		padding: 0 18px;
		border-radius: 10px;
		font-size: var(--md-sys-typescale-label-large-size, 14px);
		font-weight: 600;
		cursor: pointer;
		transition: transform 160ms ease-out, box-shadow 160ms ease-out, filter 160ms ease-out;
	}
	.cookie-btn:active {
		transform: scale(0.96);
	}
	.cookie-btn:focus-visible {
		outline: 2px solid var(--md-sys-color-primary);
		outline-offset: 2px;
	}

	.cookie-btn--accept {
		border: none;
		color: var(--md-sys-color-on-primary);
		background: linear-gradient(135deg, var(--zh-seal-bright, #eed3e5), var(--zh-seal-deep, #c86b8a));
		box-shadow: 0 6px 16px rgba(221, 170, 204, 0.3);
	}
	.cookie-btn--accept:hover {
		filter: brightness(1.04);
		box-shadow: 0 6px 16px rgba(221, 170, 204, 0.3), 0 10px 24px rgba(0, 0, 0, 0.06);
	}

	.cookie-btn--decline {
		border: 1px solid var(--md-sys-color-outline);
		color: var(--md-sys-color-on-surface);
		background: var(--md-sys-color-surface);
	}
	.cookie-btn--decline:hover {
		background: var(--md-sys-color-surface-variant);
	}

	@media (prefers-reduced-motion: reduce) {
		.cookie-card {
			transition: none;
		}
	}
</style>
