<script lang="ts">
	import { getSnackbar, dismissSnackbar } from '$lib/ui-state.svelte';
	import Icon from '$components/Icon.svelte';
</script>

{#if getSnackbar()}
	{@const sb = getSnackbar()}
	<div class="snackbar" role="status" aria-live="polite">
		<span class="snackbar__text">{sb?.message}</span>
		{#if sb?.action}
			{#if sb.action.href}
				<a class="snackbar__action" href={sb.action.href}>{sb.action.label}</a>
			{:else}
				<button
					class="snackbar__action"
					type="button"
					onclick={() => {
						sb?.action?.onAction?.();
						dismissSnackbar();
					}}
				>
					{sb.action.label}
				</button>
			{/if}
		{/if}
		<button class="snackbar__close" type="button" onclick={() => dismissSnackbar()}>
			<Icon name="close" size={18} />
			<span class="visually-hidden">关闭</span>
		</button>
	</div>
{/if}

<style>
	.snackbar {
		position: fixed;
		z-index: 90;
		left: 16px;
		right: 16px;
		bottom: calc(16px + env(safe-area-inset-bottom, 0px));
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 48px;
		padding: 8px 8px 8px 16px;
		background: var(--md-sys-color-inverse-surface);
		color: var(--md-sys-color-inverse-on-surface);
		border-radius: var(--md-sys-shape-corner-small);
		font-size: var(--md-sys-typescale-body-medium-size);
		animation: snack-in var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-emphasized);
	}
	@media (min-width: 600px) {
		.snackbar {
			left: auto;
			right: 24px;
			max-width: 420px;
			bottom: 24px;
		}
	}
	.snackbar__text {
		flex: 1;
		min-width: 0;
	}
	.snackbar__action {
		flex: none;
		min-height: 40px;
		padding: 0 12px;
		background: transparent;
		color: var(--md-sys-color-inverse-primary);
		border: none;
		border-radius: var(--md-sys-shape-corner-full);
		font-size: var(--md-sys-typescale-label-large-size);
		font-weight: 500;
		cursor: pointer;
	}
	.snackbar__action:hover {
		background: rgba(128, 213, 213, 0.14);
	}
	.snackbar__close {
		flex: none;
		width: 40px;
		height: 40px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		color: inherit;
		border: none;
		border-radius: var(--md-sys-shape-corner-full);
		cursor: pointer;
	}
	.snackbar__close:hover {
		background: rgba(128, 213, 213, 0.14);
	}

	@keyframes snack-in {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.snackbar {
			animation: none;
		}
	}
</style>
