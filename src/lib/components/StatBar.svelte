<script lang="ts">
	import { t, type Lang } from '$i18n';
	import { formatCount, formatRelative, ratingPercent } from '$lib/format';
	import Icon from '$components/Icon.svelte';

	interface Props {
		lang: Lang;
		totalInstalls?: number | null;
		dailyInstalls?: number | null;
		goodRatings?: number | null;
		okRatings?: number | null;
		badRatings?: number | null;
		/** 更新时间（ISO），传了才显示该项 */
		updatedAt?: string | null;
		/** sm 用于卡片，md 用于详情页 */
		size?: 'sm' | 'md';
	}

	let {
		lang,
		totalInstalls,
		dailyInstalls,
		goodRatings,
		okRatings,
		badRatings,
		updatedAt,
		size = 'sm'
	}: Props = $props();

	const total = $derived(totalInstalls == null ? null : formatCount(totalInstalls, lang));
	const daily = $derived(dailyInstalls == null ? null : formatCount(dailyInstalls, lang));
	const rating = $derived(ratingPercent(goodRatings, okRatings, badRatings));
	const updated = $derived(updatedAt ? formatRelative(updatedAt, lang) : null);
	const empty = $derived(!total && !daily && rating == null && !updated);
</script>

{#if !empty}
	<div class="statbar" class:statbar--md={size === 'md'}>
		{#if total}
			<span class="stat" title={`${t(lang, 'stat.total_installs')}: ${totalInstalls}`}>
				<Icon name="install" size={14} />
				<span class="stat__num">{total}</span>
				<span class="stat__label">{t(lang, 'stat.installs')}</span>
			</span>
		{/if}
		{#if daily}
			<span class="stat" title={`${t(lang, 'stat.daily_installs')}: ${dailyInstalls}`}>
				<Icon name="refresh" size={14} />
				<span class="stat__num">{daily}</span>
				<span class="stat__label">{t(lang, 'stat.daily')}</span>
			</span>
		{/if}
		{#if rating != null}
			<span class="stat">
				<Icon name="star" size={14} />
				<span class="stat__num">{rating}%</span>
				<span class="stat__label">{t(lang, 'stat.good_rating')}</span>
			</span>
		{/if}
		{#if updated}
			<span class="stat">
				<Icon name="history" size={14} />
				<span class="stat__label">{t(lang, 'stat.updated')} {updated}</span>
			</span>
		{/if}
	</div>
{/if}

<style>
	.statbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 14px;
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-label-medium-size);
		line-height: 1.4;
	}
	.stat {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
	}
	.stat__num {
		color: var(--md-sys-color-on-surface);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	.statbar--md {
		font-size: var(--md-sys-typescale-body-small-size);
		gap: 6px 20px;
	}
</style>
