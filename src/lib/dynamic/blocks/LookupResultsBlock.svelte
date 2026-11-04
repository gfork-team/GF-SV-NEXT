<script lang="ts">
	/**
	 * 区块 lookup-results · race + list（视图）
	 *
	 * 结构在构建期就完整：状态条 + 固定数量的占位行 + 分页条。
	 * 水合后只覆盖状态文案与行内容，不换整棵子树。
	 */
	import { untrack } from 'svelte';
	import { siteConfig } from '$config';
	import { t, type Lang } from '$i18n';
	import Ad from '$components/Ad.svelte';
	import Icon from '$components/Icon.svelte';
	import ScriptCard from '$components/ScriptCard.svelte';
	import type { LookupSearch, LookupStatus } from './lookup.svelte';

	let { lang, search }: { lang: Lang; search: LookupSearch } = $props();

	const resource = $derived(search.resource);
	const rows = $derived(resource.data.rows);

	const status = $derived.by<LookupStatus>(() => {
		if (!search.hasQuery) return 'idle';
		if (resource.state === 'error') return 'error';
		if (resource.state === 'ready') return rows.length === 0 ? 'empty' : 'ready';
		return 'loading';
	});

	const title = $derived.by(() => {
		if (status === 'empty') return t(lang, 'lookup.no_results');
		if (status === 'ready') return t(lang, 'lookup.result_count', { n: String(rows.length) });
		if (status === 'error') return t(lang, 'lookup.load_failed');
		if (status === 'loading') return t(lang, 'lookup.loading');
		return t(lang, 'lookup.placeholder_title');
	});

	// 冷加载时这段就是「怎么用这个页面」的说明，失败时换成错误原因
	const detail = $derived.by(() => {
		if (status === 'error') return resource.error ?? '';
		if (status === 'idle') {
			return `${t(lang, 'lookup.placeholder_desc')} ${t(lang, 'lookup.placeholder_example')}`;
		}
		return '';
	});

	const pageNum = $derived(Number(search.params.page) || 1);
	// 有没有下一页由区块 mapper 判断（新版裸数组没有 options.per_page）
	const hasNext = $derived(resource.data.hasMore);
	/**
	 * in-feed 单元插入位置（0 = 关闭）。
	 * fluid 是无固定尺寸的信息流格式，本来就是「在流里重复投放」的设计，
	 * 所以这里与页面底部的 fluid 同单元是预期行为，不算重复浪费。
	 */
	const inFeedAfter = $derived(Number(siteConfig.adsense.inFeedAfter) || 0);

	// 水合后才初始化（读 hash + 挂监听 + 首次搜索）；prerender 不执行 effect
	$effect(() => {
		untrack(() => search.init());
		return () => search.destroy();
	});

	function goToPage(page: number): void {
		search.apply({ ...search.params, page: String(page) });
	}
</script>

<div class="lk-results-block" data-block="lookup-results" data-state={status}>
	<div class="lk-status" role="status" aria-live="polite">
		<span class="lk-status__title">{title}</span>
		<span class="lk-status__detail">{detail}</span>
		<button
			type="button"
			class="ui-btn ui-btn--outlined lk-status__retry"
			hidden={status !== 'error'}
			onclick={() => search.reload()}
		>
			<Icon name="refresh" size={18} />
			{t(lang, 'lookup.retry')}
		</button>
	</div>

	<!--
		冷加载遮罩：构建期铺了 100 行占位，这里只盖住「当前离线视口」那一段，
		滚动时遮罩跟着 sticky 走，所以看不到一整片占位卡片。
		ready 后遮罩消失，真实行数替换占位行，页面高度不跳。
	-->
	<div class="lk-shield" hidden={status === 'ready'} aria-hidden={status === 'ready'}>
		<span class="lk-shield__spinner" class:is-spinning={status === 'loading'}>
			<Icon name="refresh" size={28} />
		</span>
		<span class="lk-shield__text">{status === 'idle' ? title : t(lang, 'lookup.loading')}</span>
	</div>

	<!--
		列表按「下标」而不是 id 做 key：占位行的 id 是负数、真实行是正数，
		用 id 做 key 会在数据到达时把 100 个 <li> 全部销毁重建；
		按下标复用后，同一批 <li> / ScriptCard 原地保留，只改里面的文字，
		超出的占位行才被删除。这才是"结构不动、只换内容"。
	-->
	<ul class="lk-results" style="--dyn-rows:{rows.length}">
		{#each rows as row, i (i)}
			<li class="lk-row">
				<ScriptCard {lang} script={row} variant="list" placeholder={row.id < 0} />
			</li>
			{#if inFeedAfter > 0 && status === 'ready' && rows.length > inFeedAfter && i === inFeedAfter - 1}
				<li class="lk-row lk-row--ad"><Ad type="fluid" /></li>
			{/if}
		{/each}
	</ul>

	<nav class="lk-pagination" hidden={status !== 'ready'} aria-label="pagination">
		<button class="ui-btn ui-btn--outlined" disabled={pageNum === 1} onclick={() => goToPage(1)}>
			{t(lang, 'lookup.pagination.first')}
		</button>
		<button
			class="ui-btn ui-btn--outlined"
			disabled={pageNum === 1}
			onclick={() => goToPage(Math.max(pageNum - 1, 1))}
		>
			{t(lang, 'lookup.pagination.prev')}
		</button>
		<span class="lk-pagination__page">{pageNum}</span>
		<button
			class="ui-btn ui-btn--outlined"
			disabled={!hasNext}
			onclick={() => goToPage(pageNum + 1)}
		>
			{t(lang, 'lookup.pagination.next')}
		</button>
	</nav>
</div>

<style>
	/* 状态条：结构固定，只换文字；min-height 顶住两行，避免出现/消失时抖动 */
	.lk-status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 12px;
		min-height: 56px;
	}
	.lk-status__title {
		font-size: var(--md-sys-typescale-body-medium-size);
		font-weight: 500;
		color: var(--md-sys-color-on-surface);
	}
	.lk-results-block[data-state='idle'] .lk-status__title,
	.lk-status__detail {
		color: var(--md-sys-color-on-surface-variant);
	}
	.lk-status__detail {
		flex: 1;
		min-width: 0;
		font-size: var(--md-sys-typescale-body-small-size);
		line-height: 1.6;
	}
	.lk-status__detail:empty {
		display: none;
	}
	.lk-status__retry {
		flex: none;
	}

	.lk-results {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
		/* 行模板固定：占位行数与行高决定最小高度，真实行数变少时版面不塌 */
		min-height: calc(var(--dyn-rows, 4) * (var(--dyn-row-h, 88px) + 12px) - 12px);
	}
	/* 遮罩：sticky 覆盖视口可见段，负 margin 抵消它自己的占位 */
	.lk-shield {
		position: sticky;
		top: 88px;
		z-index: 6;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		height: min(60vh, 520px);
		margin-bottom: calc(-1 * min(60vh, 520px));
		background: var(--md-sys-color-surface-container-lowest);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-large);
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-body-medium-size);
	}
	.lk-shield__spinner {
		display: inline-flex;
		color: var(--md-sys-color-primary);
	}
	.lk-shield__spinner.is-spinning {
		animation: lk-spin 0.9s linear infinite;
	}
	@keyframes lk-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lk-shield__spinner.is-spinning {
			animation: none;
		}
	}
	.lk-row {
		min-height: var(--dyn-row-h, 88px);
	}
	/* 信息流里的广告行不套行高，由 Ad 自己的预留高度决定 */
	.lk-row--ad {
		min-height: 0;
	}

	.lk-pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	.lk-pagination__page {
		min-width: 40px;
		text-align: center;
		font-size: var(--md-sys-typescale-body-medium-size);
		font-variant-numeric: tabular-nums;
		color: var(--md-sys-color-on-surface);
	}
</style>
