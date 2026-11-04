<script lang="ts">
	/**
	 * 区块 mirror-status · probe
	 *
	 * 冷加载：构建期就写死一个完整的胶囊（未知态 + 「检测中」文案），
	 * 水合后探测 /ping，只覆盖文案与配色，胶囊结构不变。
	 *
	 * 开关：`config.json → mirrorStatus.enabled`（当前 false）。
	 * 关闭时整栏 `hidden`，Slot 不渲染 → 不挂载 → 不会发起 /ping 探活。
	 */
	import { dynamicConfig, siteConfig } from '$config';
	import { t, type Lang } from '$i18n';
	import Icon from '$components/Icon.svelte';
	import Slot from '../core/Slot.svelte';
	import { mirrorResource, type MirrorView } from './mirror';

	let { lang }: { lang: Lang } = $props();

	/** 配置总开关 */
	const enabled = $derived(siteConfig.mirrorStatus.enabled);

	const resource = $derived(mirrorResource(lang));

	// 停留超过配置间隔后重新探活；prerender / SSR 不执行 effect
	$effect(() => {
		if (!enabled) return;
		const sec = dynamicConfig.refresh.mirrorSec;
		if (sec <= 0) return;
		const timer = setInterval(() => resource.load(true), sec * 1000);
		return () => clearInterval(timer);
	});
</script>

<div class="mirror-host" hidden={!enabled}>
	{#if enabled}
		<Slot {resource}>
			{#snippet children(view: MirrorView)}
				<p class="mirror mirror--{view.tone}" role="status" aria-live="polite">
					<span class="mirror__dot" aria-hidden="true"></span>
					<span class="mirror__label">{view.label}</span>
					<span class="mirror__item mirror__latency" title={t(lang, 'mirror.latency')}
						>{view.latency ? `${t(lang, 'mirror.latency')} ${view.latency}` : ''}</span
					>
					<span class="mirror__item mirror__synced"
						>{view.synced ? `${t(lang, 'mirror.synced')} ${view.synced}` : ''}</span
					>
					<span class="mirror__item mirror__node" title={t(lang, 'mirror.node')}>
						{#if view.node}<Icon name="shield" size={14} />{/if}{view.node}
					</span>
				</p>
			{/snippet}
		</Slot>
	{/if}
</div>

<style>
	.mirror-host {
		display: flex;
		justify-content: center;
	}
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
	/* 空字段（数据还没到 / 该项缺失）收起，节点本身始终存在 */
	.mirror__item:empty {
		display: none;
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
