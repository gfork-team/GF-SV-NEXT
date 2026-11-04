<script lang="ts">
	import { t, type Lang } from '$i18n';
	import Ad from '$components/Ad.svelte';
	import Chip from '$components/Chip.svelte';
	import Icon from '$components/Icon.svelte';
	import SearchBar from '$components/SearchBar.svelte';
	import LookupResultsBlock from '$lib/dynamic/blocks/LookupResultsBlock.svelte';
	import { createLookupSearch } from '$lib/dynamic/blocks/lookup.svelte';
	import { getParam, getParamList, type SearchParams } from '$lib/search-params';
	import { LOCALE_OPTIONS as localeOptions } from '$lib/locale-options';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

	/*
	 * 数据、hash 读取与监听全部在区块控制器里（$lib/dynamic/blocks/lookup.svelte.ts）。
	 * 页面只做三件事：组合区块、渲染筛选器、把筛选结果交回控制器。
	 */
	const search = $derived(createLookupSearch(lang));

	let filtersOpen = $state(false);

	const query = $derived(getParam(search.params, 'q'));
	const sortBy = $derived(getParam(search.params, 'sort'));
	const filterLocale = $derived(getParam(search.params, 'filter_locale') || '0');

	let pageTitle = $derived.by(() => {
		const parts: string[] = [];
		if (query) parts.push(query);
		const site = getParam(search.params, 'site');
		if (site) parts.push(`@${site}`);
		return parts.length > 0 ? `${parts.join(' ')} - ZGF` : `${t(lang, 'lookup.title')} - ZGF`;
	});

	// ─── Filter option definitions (i18n keys resolved at render time) ───
	const sortOptions: { value: string; key: string }[] = [
		{ value: '', key: 'lookup.sort_relevance' },
		{ value: 'daily_installs', key: 'lookup.sort_daily_installs' },
		{ value: 'total_installs', key: 'lookup.sort_total_installs' },
		{ value: 'ratings', key: 'lookup.sort_ratings' },
		{ value: 'created', key: 'lookup.sort_created' },
		{ value: 'updated', key: 'lookup.sort_updated' },
		{ value: 'name', key: 'lookup.sort_name' }
	];

	const numericFilters: { key: string; labelKey: string; type: string; step?: string }[] = [
		{ key: 'total_installs', labelKey: 'lookup.total_installs', type: 'number' },
		{ key: 'daily_installs', labelKey: 'lookup.daily_installs', type: 'number' },
		{ key: 'ratings', labelKey: 'lookup.ratings', type: 'number', step: '0.1' }
	];

	const dateFilters: { key: string; labelKey: string }[] = [
		{ key: 'created', labelKey: 'lookup.created' },
		{ key: 'updated', labelKey: 'lookup.updated' }
	];

	// ─── Handlers：只改 hash，取数交给区块 ─────────────────────────────
	function handleSearch(q: string): void {
		const next: SearchParams = { ...search.params, q };
		delete next.page;
		search.apply(next);
	}

	function handleSort(value: string): void {
		search.apply({ ...search.params, sort: value });
	}

	function handleLangFilter(value: string): void {
		search.apply({ ...search.params, filter_locale: value });
	}

	function applyFilter(e: SubmitEvent & { currentTarget: HTMLFormElement }): void {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const next: SearchParams = { ...search.params };

		// 同步用完的 key 集合，不存进 $state
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const formKeys = new Set<string>(['site', 'tz', 'entry_locales[]']);
		for (const f of [...numericFilters, ...dateFilters]) {
			formKeys.add(f.key);
			formKeys.add(`${f.key}_operator`);
		}
		for (const key of formKeys) delete next[key];
		delete next.page;

		for (const [key, value] of fd.entries()) {
			if (key.endsWith('[]')) {
				if (!Array.isArray(next[key])) next[key] = [];
				if (value) (next[key] as string[]).push(value as string);
			} else if (value) {
				next[key] = value as string;
			}
		}

		search.apply(next);
	}

	function clearFilters(): void {
		const page = getParam(search.params, 'page');
		search.apply({
			q: getParam(search.params, 'q'),
			page: page !== '1' ? page : undefined
		});
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={t(lang, 'lookup.description')} />
	<meta
		name="keywords"
		content="userscript search, greasyfork lookup, script search, browser scripts, greasyfork scripts, user scripts"
	/>
</svelte:head>

<section class="lk-page">
	<div class="lk-layout" class:lk-layout--open={filtersOpen}>
		<button
			class="ui-btn ui-btn--outlined lk-filters-toggle"
			aria-expanded={filtersOpen}
			aria-controls="lk-filters"
			onclick={() => (filtersOpen = !filtersOpen)}
		>
			<Icon name={filtersOpen ? 'close' : 'filter'} size={18} />
			{t(lang, 'lookup.sidebar_title')}
		</button>

		<aside class="lk-sidebar" class:open={filtersOpen} id="lk-filters">
			<div class="lk-sidebar__search">
				<SearchBar id="lk" {lang} initialQuery={query} onsearch={handleSearch} />
			</div>

			<div class="lk-option-group">
				<div class="lk-option-label">
					<Icon name="sort" size={16} />
					{t(lang, 'lookup.sidebar_sort')}
				</div>
				<div class="lk-chip-row">
					{#each sortOptions as opt (opt.value)}
						<Chip selected={sortBy === opt.value} onclick={() => handleSort(opt.value)}>
							{t(lang, opt.key)}
						</Chip>
					{/each}
				</div>
			</div>

			<div class="lk-option-group">
				<div class="lk-option-label">
					<Icon name="globe" size={16} />
					{t(lang, 'lookup.sidebar_lang')}
				</div>
				<div class="lk-chip-row">
					<Chip selected={filterLocale === '0'} onclick={() => handleLangFilter('0')}>
						{t(lang, 'lookup.lang_all')}
					</Chip>
					<Chip selected={filterLocale === '1'} onclick={() => handleLangFilter('1')}>
						{t(lang, 'lookup.lang_zh')}
					</Chip>
				</div>
			</div>

			<details class="lk-advanced">
				<summary class="lk-advanced__summary">
					<span class="lk-advanced__title"
						><Icon name="filter" size={16} /> {t(lang, 'lookup.sidebar_advanced')}</span
					>
					<span class="lk-advanced__chevron"><Icon name="chevron-down" size={18} /></span>
				</summary>

				<form class="lk-advanced-form" onsubmit={applyFilter}>
					<div class="lk-field">
						<label class="lk-label" for="lk-site">{t(lang, 'lookup.filter_site_placeholder')}</label
						>
						<input
							class="lk-input"
							id="lk-site"
							name="site"
							value={getParam(search.params, 'site')}
						/>
					</div>

					{#each numericFilters as filter (filter.key)}
						<div class="lk-field">
							<label class="lk-label" for="{filter.key}_operator">{t(lang, filter.labelKey)}</label>
							<div class="lk-field__row">
								<select
									class="lk-input lk-select"
									id="{filter.key}_operator"
									name="{filter.key}_operator"
									value={getParam(search.params, filter.key + '_operator') || 'gt'}
								>
									<option value="gt">{t(lang, 'lookup.operator.gt')}</option>
									<option value="lt">{t(lang, 'lookup.operator.lt')}</option>
									<option value="eq">{t(lang, 'lookup.operator.eq')}</option>
								</select>
								<input
									class="lk-input"
									type={filter.type}
									name={filter.key}
									placeholder={t(lang, 'lookup.filter_value_placeholder')}
									step={filter.step || ''}
									value={getParam(search.params, filter.key)}
								/>
							</div>
						</div>
					{/each}

					{#each dateFilters as filter (filter.key)}
						<div class="lk-field">
							<label class="lk-label" for="{filter.key}_operator">{t(lang, filter.labelKey)}</label>
							<div class="lk-field__row">
								<select
									class="lk-input lk-select"
									id="{filter.key}_operator"
									name="{filter.key}_operator"
									value={getParam(search.params, filter.key + '_operator') || 'gt'}
								>
									<option value="gt">{t(lang, 'lookup.operator.after')}</option>
									<option value="lt">{t(lang, 'lookup.operator.before')}</option>
								</select>
								<input
									class="lk-input"
									type="datetime-local"
									name={filter.key}
									value={getParam(search.params, filter.key)}
								/>
							</div>
						</div>
					{/each}

					<div class="lk-field">
						<label class="lk-label" for="entry_locales"
							>{t(lang, 'lookup.filter_script_lang')}</label
						>
						<select
							class="lk-input"
							name="entry_locales[]"
							multiple
							size="5"
							id="entry_locales"
							value={getParamList(search.params, 'entry_locales[]')}
						>
							{#each localeOptions as loc (loc.value)}
								<option value={loc.value}>{loc.label}</option>
							{/each}
						</select>
						<small class="lk-hint">{t(lang, 'lookup.filter_multi_hint')}</small>
					</div>

					<input type="hidden" name="tz" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />

					<div class="lk-filter-actions">
						<button type="submit" class="ui-btn ui-btn--filled"
							>{t(lang, 'lookup.filter_apply')}</button
						>
						<button type="button" class="ui-btn ui-btn--outlined" onclick={clearFilters}
							>{t(lang, 'lookup.filter_clear')}</button
						>
					</div>
				</form>
			</details>

			<div class="lk-sidebar__ad"><Ad type="sidebar" /></div>
		</aside>

		<div class="lk-main">
			<div class="lk-ad"><Ad type="auto" /></div>

			<LookupResultsBlock {lang} {search} />

			<p class="lk-warning">
				<Icon name="info" size={16} />
				{t(lang, 'lookup.warning')}
			</p>

			<div class="lk-ad"><Ad type="fluid" /></div>
			<Ad type="horizontal" />
		</div>
	</div>
</section>

<style>
	.lk-page {
		color: var(--md-sys-color-on-surface);
	}

	.lk-layout {
		display: flex;
		align-items: flex-start;
		gap: 24px;
	}

	/* ─── Sidebar ──────────────────────────────────────── */
	.lk-sidebar {
		flex: 0 0 280px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		position: sticky;
		top: 88px;
		padding: 20px;
		background: var(--md-sys-color-surface-container-low);
		border-radius: var(--md-sys-shape-corner-large);
	}

	.lk-filters-toggle {
		display: none;
		align-self: flex-start;
	}

	.lk-sidebar__search {
		position: relative;
	}

	.lk-option-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.lk-option-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: var(--md-sys-typescale-title-small-size);
		font-weight: 600;
		color: var(--md-sys-color-on-surface-variant);
	}
	.lk-chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	/* 高级筛选 */
	.lk-advanced {
		background: var(--md-sys-color-surface-container);
		border-radius: var(--md-sys-shape-corner-medium);
	}
	.lk-advanced__summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 12px 14px;
		cursor: pointer;
		list-style: none;
		font-size: var(--md-sys-typescale-body-medium-size);
		font-weight: 500;
		color: var(--md-sys-color-on-surface);
	}
	.lk-advanced__summary::-webkit-details-marker {
		display: none;
	}
	.lk-advanced__title {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.lk-advanced__chevron {
		display: flex;
		color: var(--md-sys-color-on-surface-variant);
		transition: transform 160ms ease-out;
	}
	.lk-advanced[open] .lk-advanced__chevron {
		transform: rotate(180deg);
	}

	.lk-advanced-form {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 0 14px 14px;
	}
	.lk-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.lk-field__row {
		display: flex;
		gap: 8px;
	}
	.lk-field__row .lk-input {
		min-width: 0;
	}
	.lk-field__row .lk-select {
		flex: 0 0 96px;
	}
	.lk-label {
		font-size: var(--md-sys-typescale-label-medium-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.lk-input {
		width: 100%;
		height: 40px;
		padding: 0 12px;
		font: inherit;
		font-size: var(--md-sys-typescale-body-small-size);
		color: var(--md-sys-color-on-surface);
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
	}
	.lk-input:focus-visible {
		outline: none;
		border-color: var(--md-sys-color-primary);
	}
	select.lk-input[multiple] {
		height: auto;
		padding: 8px;
	}
	.lk-hint {
		font-size: var(--md-sys-typescale-label-small-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.lk-filter-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.lk-sidebar__ad {
		margin-top: auto;
	}

	/* ─── Main ─────────────────────────────────────────── */
	.lk-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.lk-ad {
		display: flex;
		justify-content: center;
	}

	.lk-warning {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		margin: 0;
		font-size: var(--md-sys-typescale-label-small-size);
		color: var(--md-sys-color-on-surface-variant);
		text-align: center;
	}

	/* ─── Responsive ───────────────────────────────────── */
	@media (max-width: 839px) {
		.lk-layout {
			flex-direction: column;
		}
		.lk-filters-toggle {
			display: inline-flex;
		}
		.lk-sidebar {
			position: static;
			width: 100%;
			flex: none;
			display: none;
		}
		.lk-sidebar.open {
			display: flex;
		}
	}
</style>
