<script lang="ts">
	import { onMount } from 'svelte';
	import { t, type Lang } from '$i18n';
	import { measureMirror, type MirrorStatus } from '$lib/mirror-status';
	import { formatRelative } from '$lib/format';
	import Icon from '$components/Icon.svelte';

	interface Props {
		lang: Lang;
	}

	let { lang }: Props = $props();
	let status = $state<MirrorStatus | null | undefined>(undefined);

	onMount(() => {
		let alive = true;
		measureMirror().then((s) => {
			if (alive) status = s;
		});
		// 60s 后再探一次，避免用户长时间停留看到过期数据
		const timer = setTimeout(() => {
			if (!alive) return;
			measureMirror().then((s) => {
				if (alive) status = s;
			});
		}, 60_000);
		return () => {
			alive = false;
			clearTimeout(timer);
		};
	});

	const label = $derived.by(() => {
		if (!status) return '';
		if (status.state === 'ok') return t(lang, 'mirror.ok');
		if (status.state === 'degraded') return t(lang, 'mirror.degraded');
		return t(lang, 'mirror.down');
	});
</script>

{#if status}
	<p class="mirror mirror--{status.state}" role="status" aria-live="polite">
		<span class="mirror__dot" aria-hidden="true"></span>
		<span class="mirror__label">{label}</span>
		{#if status.latencyMs > 0}
			<span class="mirror__item">{t(lang, 'mirror.latency')} {status.latencyMs}ms</span>
		{/if}
		{#if status.upstreamFetchedAt}
			<span class="mirror__item">
				{t(lang, 'mirror.synced')}
				{formatRelative(status.upstreamFetchedAt, lang)}
			</span>
		{/if}
		{#if status.node}
			<span class="mirror__item mirror__node" title={t(lang, 'mirror.node')}>
				<Icon name="shield" size={14} />
				{status.node}
			</span>
		{/if}
	</p>
{/if}

<style>
	.mirror {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 14px;
		padding: 6px 14px;
		background: var(--md-sys-color-surface-container);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-full);
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-label-medium-size);
		line-height: 1.4;
	}
	.mirror__dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--md-sys-color-on-surface-variant);
		flex: none;
	}
	.mirror__label {
		color: var(--md-sys-color-on-surface);
		font-weight: 500;
	}
	.mirror__item {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-variant-numeric: tabular-nums;
	}
	.mirror--ok .mirror__dot {
		background: var(--gf-success);
	}
	.mirror--degraded .mirror__dot {
		background: var(--gf-warning);
	}
	.mirror--degraded .mirror__label {
		color: var(--md-sys-color-on-surface);
	}
	.mirror--down .mirror__dot {
		background: var(--md-sys-color-error);
	}
</style>
