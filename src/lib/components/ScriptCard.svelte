<script lang="ts">
	import { t, type Lang } from '$i18n';
	import type { ScriptSummary } from '$lib/scripts-api';
	import { authorHref, detailHref, installHref } from '$lib/scripts-api';
	import { truncate } from '$lib/format';
	import Chip from '$components/Chip.svelte';
	import StatBar from '$components/StatBar.svelte';
	import InstallButton from '$components/InstallButton.svelte';

	interface Props {
		lang: Lang;
		script: ScriptSummary;
		/** 适用站点：列表接口不提供，缺省不显示 */
		sites?: string[];
		variant?: 'grid' | 'list';
		showInstall?: boolean;
	}

	let { lang, script, sites = [], variant = 'grid', showInstall = true }: Props = $props();

	const href = $derived(detailHref(lang, script));
	const install = $derived(installHref(lang, script));
	const author = $derived(authorHref(lang, script));
	const authorName = $derived(script.users?.[0]?.name ?? '');
</script>

<article class="ui-card card" class:card--list={variant === 'list'}>
	<div class="card__head">
		<h3 class="card__title" style="view-transition-name:script-title-{script.id}">
			<a {href} data-sveltekit-preload-data="hover">{script.name}</a>
		</h3>
		{#if script.version}
			<span class="ui-badge ui-badge--neutral card__ver">v{script.version}</span>
		{/if}
	</div>

	{#if script.description}
		<p class="card__desc">{truncate(script.description, variant === 'list' ? 110 : 90)}</p>
	{/if}

	{#if sites.length}
		<div class="card__sites">
			{#each sites.slice(0, 3) as site (site)}
				<Chip site>{site}</Chip>
			{/each}
			{#if sites.length > 3}
				<Chip site>+{sites.length - 3}</Chip>
			{/if}
		</div>
	{/if}

	<StatBar
		{lang}
		totalInstalls={script.total_installs}
		dailyInstalls={script.daily_installs}
		goodRatings={script.good_ratings}
		okRatings={script.ok_ratings}
		badRatings={script.bad_ratings}
		updatedAt={script.code_updated_at}
	/>

	<div class="card__foot">
		{#if showInstall && install}
			<InstallButton
				{lang}
				installHref={install}
				sourceUrl={script.url}
				scriptName={script.name}
				size="sm"
			/>
		{/if}
		{#if authorName}
			{#if author}
				<a class="card__author" href={author} data-sveltekit-preload-data="hover">
					{t(lang, 'card.by')}
					{authorName}
				</a>
			{:else}
				<span class="card__author">{t(lang, 'card.by')} {authorName}</span>
			{/if}
		{/if}
	</div>
</article>

<style>
	.card {
		gap: 8px;
	}
	.card__head {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}
	.card__title {
		flex: 1;
		min-width: 0;
		font-size: var(--md-sys-typescale-title-medium-size);
		font-weight: 600;
		line-height: 1.4;
	}
	/* 整卡可点：链接铺满卡片，安装按钮靠 z-index 保留自己的点击 */
	.card__title a {
		color: var(--md-sys-color-on-surface);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.card__title a::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: inherit;
	}
	.card__title a:hover {
		color: var(--md-sys-color-primary);
	}
	.card__ver {
		flex: none;
		margin-top: 2px;
		font-variant-numeric: tabular-nums;
	}
	.card__desc {
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-body-small-size);
		line-height: 1.6;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.card__sites {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.card__foot {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: 2px;
	}
	.card__author {
		min-width: 0;
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-label-medium-size);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	a.card__author:hover {
		color: var(--md-sys-color-primary);
	}

	/* 列表密度：横向排布 */
	.card--list {
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 8px 16px;
	}
	.card--list .card__head {
		flex: 1 1 40%;
	}
	.card--list .card__desc {
		flex: 1 1 40%;
	}
	.card--list .card__sites {
		flex: 1 1 100%;
	}
	@media (max-width: 599px) {
		.card--list {
			flex-direction: column;
		}
	}
</style>
