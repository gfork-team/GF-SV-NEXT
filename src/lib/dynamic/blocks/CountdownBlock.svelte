<script lang="ts">
	/**
	 * 区块 countdown · 倒计时文案（视图）
	 *
	 * 构建期写的就是「{countdown} 秒后到达」这一句，水合后只覆盖同一个文本节点。
	 * 「刷新重试」按钮是静态文案，留在页面里，不参与覆盖。
	 */
	import { untrack } from 'svelte';
	import type { Lang } from '$i18n';
	import { createCountdown } from './countdown.svelte';

	let {
		lang,
		delaySec,
		buildUrl,
		metaRefresh = false
	}: {
		lang: Lang;
		delaySec: number;
		buildUrl: () => string;
		metaRefresh?: boolean;
	} = $props();

	const countdown = $derived(createCountdown({ lang, delaySec, buildUrl, metaRefresh }));

	$effect(() => {
		const current = countdown;
		untrack(() => current.start());
		return () => current.stop();
	});
</script>

<p
	id="redirect-countdown-text"
	class="dyn-countdown"
	data-block="countdown"
	data-state={countdown.loading ? 'ready' : 'running'}
>
	{countdown.text}
</p>
<div class="dyn-countdown-track" aria-hidden="true">
	<span class="dyn-countdown-fill" style="width:{Math.round(countdown.progress * 100)}%"></span>
</div>

<style>
	.dyn-countdown {
		font-size: 15px;
		color: var(--md-sys-color-on-surface-variant);
		margin: 0 0 10px;
		text-align: center;
		font-weight: 400;
		letter-spacing: 0.3px;
	}
	.dyn-countdown-track {
		width: min(100%, 260px);
		height: 3px;
		margin: 0 auto 20px;
		border-radius: 999px;
		background: var(--md-sys-color-surface-container-highest);
		overflow: hidden;
	}
	.dyn-countdown-fill {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--md-sys-color-primary);
		transition: width 0.9s linear;
	}
	@media (prefers-reduced-motion: reduce) {
		.dyn-countdown-fill {
			transition: none;
		}
	}
</style>
