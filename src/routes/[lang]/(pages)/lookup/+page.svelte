<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { t, type Lang } from '$i18n';
	import { siteConfig, getPrimaryLookupNodes, getBackupLookupNodes } from '$lib/config';
	import Ad from '$components/Ad.svelte';
	import { sendAudit } from '$lib/audit';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);
	import Chip from '$components/Chip.svelte';
	import Icon from '$components/Icon.svelte';
	import ScriptCard from '$components/ScriptCard.svelte';
	import SearchBar from '$components/SearchBar.svelte';
	import Skeleton from '$components/Skeleton.svelte';
	import type { ScriptSummary } from '$lib/scripts-api';
	import { stringifySearchParams } from '$lib/search-params';
	const PRIMARY_NODES = getPrimaryLookupNodes();
	const BACKUP_NODES = getBackupLookupNodes();

	type ApiNode = { id: string; endpoint: string; method: string };

	interface SearchParams {
		q?: string;
		site?: string;
		sort?: string;
		filter_locale?: string;
		page?: string;
		total_installs?: string;
		total_installs_operator?: string;
		daily_installs?: string;
		daily_installs_operator?: string;
		ratings?: string;
		ratings_operator?: string;
		created?: string;
		created_operator?: string;
		updated?: string;
		updated_operator?: string;
		'entry_locales[]'?: string[];
		tz?: string;
		[key: string]: string | string[] | undefined;
	}

	let lastValidHash = $state('');

	function isHashValid(hash: string): boolean {
		return !!hash && hash !== '#' && hash !== '#?' && hash !== '#google_vignette';
	}

	function parseHashParams(hash: string): SearchParams {
		let raw = '';
		if (hash.startsWith('#?')) raw = hash.substring(2);
		else if (hash.startsWith('#')) raw = hash.substring(1);

		const params = new URLSearchParams(raw);
		const result: SearchParams = {};
		for (const [key, value] of params.entries()) {
			if (key.endsWith('[]')) {
				if (!result[key as keyof SearchParams]) (result as Record<string, unknown>)[key] = [];
				((result as Record<string, unknown>)[key] as string[]).push(value);
			} else {
				(result as Record<string, unknown>)[key] = value;
			}
		}
		return result;
	}

	function getSearchParams(): SearchParams {
		const hash = window.location.hash;
		if (!isHashValid(hash)) {
			return isHashValid(lastValidHash) ? parseHashParams(lastValidHash) : {};
		}
		lastValidHash = hash;
		return parseHashParams(hash);
	}

	function setHashParams(params: SearchParams): void {
		// 临时查询串构造器，序列化后立即丢弃
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const search = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value == null || value === '') continue;
			if (Array.isArray(value)) {
				for (const v of value) if (v) search.append(key, v);
			} else {
				search.append(key, value);
			}
		}
		const qs = search.toString();
		// 仅用于拼 hash 后交给 history.pushState，函数结束即丢弃
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const url = new URL(window.location.href);
		url.hash = qs ? `#?${qs}` : '#';
		window.history.pushState({}, '', url);
		// pushState 不触发 hashchange，但 ownHash 必须跟着走，否则下次外部 hashchange 会被误判成自身改动而跳过
		ownHash = url.hash;
	}

	type ScriptResult = ScriptSummary;

	interface SearchApiResponse {
		model: string;
		term: string;
		options: {
			fields?: string[];
			boost_by?: string[];
			where?: Record<string, unknown>;
			order?: Record<string, string>;
			page: number;
			per_page: number;
			includes?: string[];
		};
		query?: ScriptResult[];
		execute?: ScriptResult[];
	}

	let results = $state<ScriptResult[]>([]);
	let loading = $state(false);
	let error = $state('');
	let placeholderMode = $state(false);
	let filtersOpen = $state(false);
	let query = $state('');
	let sortBy = $state('');
	let filterLocale = $state('0');
	let currentPage = $state('1');
	let advancedParams = $state<SearchParams>({});
	let responsePerPage = $state(100);
	let abortController: AbortController | null = $state(null);

	async function generateSS(): Promise<string> {
		const timestamp = Math.floor(Date.now() / 1000).toString();
		const input = timestamp.substring(0, 8);
		const data = new TextEncoder().encode(input);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('')
			.substring(0, siteConfig.lookupSignature.ssLength);
	}

	async function fetchFromNode(
		node: ApiNode,
		signal: AbortSignal,
		timeoutMs = 15000
	): Promise<{ success: boolean; data?: SearchApiResponse; node?: ApiNode; error?: string }> {
		try {
			const params = { ...getSearchParams() };
			const ss = await generateSS();

			let url: string;
			let options: RequestInit;

			if (node.method === 'POST') {
				const body = stringifySearchParams(params);
				url = `${node.endpoint}/${ss}`;
				options = {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/x-www-form-urlencoded'
					},
					body,
					mode: 'cors' as RequestMode,
					signal
				};
			} else {
				params.ss = ss;
				const qs = stringifySearchParams(params);
				url = qs ? `${node.endpoint}?${qs}` : node.endpoint;
				options = {
					method: 'GET',
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					mode: 'cors' as RequestMode,
					signal
				};
			}

			const timeout = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Timeout')), timeoutMs)
			);
			const res = await Promise.race([fetch(url, options), timeout]);

			if (!(res instanceof Response) || !res.ok) {
				throw new Error(`HTTP ${(res as Response).status || 'network error'}`);
			}

			let json: unknown;
			const encoding = (res as Response).headers.get('X-Content-Encoding');
			if (encoding === 'base64') {
				const text = await (res as Response).text();
				const decoded = atob(text);
				const bytes = new Uint8Array(decoded.length);
				for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
				json = JSON.parse(new TextDecoder('utf-8').decode(bytes));
			} else {
				json = await (res as Response).json();
			}

			return { success: true, data: json as SearchApiResponse, node };
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error', node };
		}
	}

	async function raceNodes(
		nodes: ApiNode[],
		signal: AbortSignal
	): Promise<{
		success: boolean;
		data?: SearchApiResponse;
		node?: ApiNode;
		failedNodes?: string[];
		message?: string;
	}> {
		return new Promise((resolve) => {
			let resolved = false;
			let completed = 0;
			const failed: string[] = [];

			nodes.forEach(async (node) => {
				const result = await fetchFromNode(node, signal);
				if (resolved) return;
				completed++;

				if (result.success) {
					resolved = true;
					resolve({ success: true, data: result.data, node: result.node });
				} else {
					failed.push(node.id);
					if (completed === nodes.length) {
						resolved = true;
						resolve({
							success: false,
							failedNodes: failed,
							message: `所有节点请求失败: ${failed.join(', ')}`
						});
					}
				}
			});
		});
	}

	async function doSearch(): Promise<void> {
		const params = getSearchParams();
		if (!params.q && !params.site && !params.page) {
			placeholderMode = true;
			error = '';
			return;
		}

		placeholderMode = false;
		abortController?.abort();
		abortController = new AbortController();
		const signal = abortController.signal;

		loading = true;
		error = '';

		const allNodes = [...PRIMARY_NODES, ...BACKUP_NODES];

		const result = await raceNodes(allNodes, signal);
		if (result.success && result.data) {
			abortController.abort();
			handleResults(result.data);
			return;
		}

		const maxRetries = 6;
		for (let attempt = 0; attempt < maxRetries; attempt++) {
			await new Promise((r) => setTimeout(r, 500));
			if (signal.aborted) return;
			const randomNode = allNodes[Math.floor(Math.random() * allNodes.length)];
			const retryResult = await fetchFromNode(randomNode, signal);
			if (retryResult.success && retryResult.data) {
				abortController.abort();
				handleResults(retryResult.data);
				return;
			}
		}

		error = result.message || 'All API requests failed';
		loading = false;
	}

	function handleResults(data: SearchApiResponse): void {
		if (
			(data as unknown as { redirect?: boolean; target_url?: string; message?: string }).redirect
		) {
			const r = data as unknown as { target_url: string; message: string };
			alert(r.message || 'Redirecting to Greasyfork Official Site');
			window.location.href = r.target_url;
			return;
		}

		const resultList = data.query ?? data.execute;
		if (resultList && Array.isArray(resultList)) {
			results = resultList.map((item) => ({
				...item,
				fan_score:
					typeof item.fan_score === 'string' ? parseFloat(item.fan_score) || 0 : item.fan_score
			})) as ScriptResult[];
			responsePerPage = data.options?.per_page || 100;

			if (siteConfig.audit.enabled) {
				const sp = getSearchParams();
				sendAudit('search', {
					path: page.url.pathname,
					lang,
					payload: {
						q: sp.q || '',
						site: sp.site || '',
						sort: sp.sort || '',
						filter_locale: sp.filter_locale || '',
						page: sp.page || '1',
						hit_count: resultList.length
					}
				});
			}
		} else {
			results = [];
		}
		loading = false;
	}

	let pageTitle = $derived.by(() => {
		const parts: string[] = [];
		if (query) parts.push(query);
		if (advancedParams.site) parts.push(`@${advancedParams.site}`);
		return parts.length > 0 ? `${parts.join(' ')} - ZGF` : `${t(lang, 'lookup.title')} - ZGF`;
	});

	function syncFromHash(): SearchParams {
		const p = getSearchParams();
		query = p.q || '';
		sortBy = p.sort || '';
		filterLocale = p.filter_locale || '0';
		currentPage = p.page || '1';
		advancedParams = p;
		return p;
	}

	function applyFilter(e: Event): void {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const newParams: SearchParams = { ...getSearchParams() };

		// 同步用完的 key 集合，不存进 $state
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const formKeys = new Set<string>(['site', 'tz', 'entry_locales[]']);
		for (const f of [...numericFilters, ...dateFilters]) {
			formKeys.add(f.key);
			formKeys.add(`${f.key}_operator`);
		}
		for (const key of formKeys) delete (newParams as Record<string, unknown>)[key];
		delete (newParams as Record<string, unknown>).page;

		for (const [key, value] of fd.entries()) {
			if (key.endsWith('[]')) {
				if (!newParams[key as keyof SearchParams]) (newParams as Record<string, unknown>)[key] = [];
				if (value) ((newParams as Record<string, unknown>)[key] as string[]).push(value as string);
			} else {
				if (value) (newParams as Record<string, unknown>)[key] = value;
			}
		}

		setHashParams(newParams);
		syncFromHash();
		doSearch();
	}

	function clearFilters(): void {
		const p = { q: query, page: currentPage !== '1' ? currentPage : undefined };
		setHashParams(p);
		syncFromHash();
		doSearch();
	}

	function handleSearch(q: string): void {
		const p = getSearchParams();
		const next: SearchParams = { ...p, q };
		delete next.page;
		setHashParams(next);
		syncFromHash();
		doSearch();
	}

	function handleSort(value: string): void {
		const newParams = { ...getSearchParams(), sort: value };
		setHashParams(newParams);
		syncFromHash();
		doSearch();
	}

	function handleLangFilter(value: string): void {
		const newParams = { ...getSearchParams(), filter_locale: value };
		setHashParams(newParams);
		syncFromHash();
		doSearch();
	}

	function goToPage(next: string): void {
		const p = { ...getSearchParams(), page: next };
		setHashParams(p);
		syncFromHash();
		doSearch();
	}

	// ─── Sort / filter option definitions (keys resolved at render time) ───
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

	const localeOptions = [
		{ value: '187', label: '简体中文 (zh-CN)' },
		{ value: '188', label: '繁體中文 (zh-TW)' },
		{ value: '40', label: 'English (en)' },
		{ value: '78', label: '日本語 (ja)' },
		{ value: '88', label: '한국어 (ko)' },
		{ value: '42', label: 'Español (es)' },
		{ value: '51', label: 'Français (fr)' },
		{ value: '35', label: 'Deutsch (de)' },
		{ value: '139', label: 'Русский (ru)' },
		{ value: '134', label: 'Português do Brasil (pt-BR)' },
		{ value: '76', label: 'Italiano (it)' },
		{ value: '118', label: 'Nederlands (nl)' },
		{ value: '130', label: 'Polski (pl)' },
		{ value: '171', label: 'Türkçe (tr)' },
		{ value: '181', label: 'Tiếng Việt (vi)' },
		{ value: '165', label: 'ไทย (th)' },
		{ value: '71', label: 'Bahasa Indonesia (id)' }
	];

	// ─── Lifecycle ──────────────────────────────────────────────────
	let hashTimer: ReturnType<typeof setTimeout>;
	let popstateTimer: ReturnType<typeof setTimeout>;

	/*
	 * 站内 setHashParams 会先改 hash 再自己 sync+search，所以 hashchange 必须去重，
	 * 否则每次翻页/改筛选都会重复请求一次。这里比对 hash，相同就直接跳过。
	 */
	let ownHash = '';

	function scheduleFromLocation() {
		clearTimeout(hashTimer);
		hashTimer = setTimeout(() => {
			if (window.location.hash === '#google_vignette') return;
			const hash = window.location.hash;
			if (hash === ownHash) return;
			ownHash = hash;
			if (isHashValid(hash)) lastValidHash = hash;
			syncFromHash();
			doSearch();
		}, 100);
	}

	function onHashChanged() {
		scheduleFromLocation();
	}

	onMount(() => {
		if (window.location.hash === '#google_vignette') return;

		ownHash = window.location.hash;
		window.addEventListener('hashchange', onHashChanged);

		const debouncedPop = () => {
			clearTimeout(popstateTimer);
			popstateTimer = setTimeout(() => {
				if (window.location.hash === '#google_vignette') return;
				ownHash = window.location.hash;
				syncFromHash();
				doSearch();
			}, 100);
		};
		window.addEventListener('popstate', debouncedPop);

		const onVisibility = () => {
			if (document.hidden && abortController) abortController.abort();
		};
		document.addEventListener('visibilitychange', onVisibility);

		const params = syncFromHash();
		if (params.q || params.site || params.page) {
			doSearch();
		} else {
			placeholderMode = true;
			error = '';
		}

		return () => {
			window.removeEventListener('hashchange', onHashChanged);
			window.removeEventListener('popstate', debouncedPop);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});
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
						<input class="lk-input" id="lk-site" name="site" value={advancedParams.site || ''} />
					</div>

					{#each numericFilters as filter (filter.key)}
						<div class="lk-field">
							<label class="lk-label" for="{filter.key}_operator">{t(lang, filter.labelKey)}</label>
							<div class="lk-field__row">
								<select
									class="lk-input lk-select"
									id="{filter.key}_operator"
									name="{filter.key}_operator"
									value={advancedParams[filter.key + '_operator'] || 'gt'}
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
									value={advancedParams[filter.key] || ''}
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
									value={advancedParams[filter.key + '_operator'] || 'gt'}
								>
									<option value="gt">{t(lang, 'lookup.operator.after')}</option>
									<option value="lt">{t(lang, 'lookup.operator.before')}</option>
								</select>
								<input
									class="lk-input"
									type="datetime-local"
									name={filter.key}
									value={advancedParams[filter.key] || ''}
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
							value={advancedParams['entry_locales[]'] || []}
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

			{#if loading}
				<div class="lk-skeletons" aria-busy="true">
					{#each Array(4) as _, i (i)}
						<div class="ui-card lk-skeleton-card">
							<Skeleton height="18px" width="65%" />
							<Skeleton height="12px" />
							<Skeleton height="12px" width="80%" />
							<Skeleton height="32px" />
						</div>
					{/each}
				</div>
			{:else if placeholderMode}
				<div class="ui-card lk-center-box">
					<span class="ui-badge ui-badge--primary lk-placeholder-badge"
						>{t(lang, 'lookup.placeholder_badge')}</span
					>
					<h2 class="lk-center-box__title">{t(lang, 'lookup.placeholder_title')}</h2>
					<p class="lk-center-box__text">{t(lang, 'lookup.placeholder_desc')}</p>
					<p class="lk-placeholder-example">
						<Icon name="link" size={16} />
						<code>{t(lang, 'lookup.placeholder_example')}</code>
					</p>
				</div>
			{:else if error}
				<div class="ui-card lk-center-box">
					<span class="lk-center-box__icon"><Icon name="alert" size={32} /></span>
					<h2 class="lk-center-box__title">{t(lang, 'lookup.load_failed')}</h2>
					<p class="lk-center-box__text">{error}</p>
					{#if !query}
						<p class="lk-center-box__text">{t(lang, 'lookup.search_prompt')}</p>
					{/if}
					<button class="ui-btn ui-btn--outlined" onclick={doSearch}>
						<Icon name="refresh" size={18} />
						{t(lang, 'lookup.filter_apply')}
					</button>
				</div>
			{:else if results.length === 0 && query}
				<div class="ui-card lk-center-box">
					<p class="lk-center-box__text">{t(lang, 'lookup.no_results')}</p>
				</div>
			{:else if results.length > 0}
				{@const pageNum = parseInt(currentPage) || 1}
				<ul class="lk-results">
					{#each results as script (script.id)}
						<li><ScriptCard {lang} {script} variant="list" /></li>
					{/each}
				</ul>

				<nav class="lk-pagination" aria-label="pagination">
					<button
						class="ui-btn ui-btn--outlined"
						disabled={pageNum === 1}
						onclick={() => goToPage('1')}
					>
						{t(lang, 'lookup.pagination.first')}
					</button>
					<button
						class="ui-btn ui-btn--outlined"
						disabled={pageNum === 1}
						onclick={() => goToPage(String(Math.max(pageNum - 1, 1)))}
					>
						{t(lang, 'lookup.pagination.prev')}
					</button>
					<span class="lk-pagination__page">{pageNum}</span>
					<button
						class="ui-btn ui-btn--outlined"
						disabled={results.length < responsePerPage}
						onclick={() => goToPage(String(pageNum + 1))}
					>
						{t(lang, 'lookup.pagination.next')}
					</button>
				</nav>
			{/if}

			<p class="lk-warning">
				<Icon name="info" size={16} />
				{t(lang, 'lookup.warning')}
			</p>

			<div class="lk-ad"><Ad type="fluid" /></div>
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

	.lk-skeletons {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.lk-skeleton-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.lk-center-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 40px 24px;
		text-align: center;
	}
	.lk-center-box__icon {
		color: var(--md-sys-color-error);
	}
	.lk-center-box__title {
		margin: 0;
		font-size: var(--md-sys-typescale-title-medium-size);
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}
	.lk-center-box__text {
		margin: 0;
		max-width: 48ch;
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.7;
		color: var(--md-sys-color-on-surface-variant);
	}
	.lk-placeholder-badge {
		margin-bottom: 4px;
	}
	.lk-placeholder-example {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin: 4px 0 0;
		padding: 8px 12px;
		background: var(--md-sys-color-surface-container-high);
		border-radius: var(--md-sys-shape-corner-small);
		color: var(--md-sys-color-on-surface-variant);
	}
	.lk-placeholder-example code {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: var(--md-sys-typescale-body-small-size);
		word-break: break-all;
	}

	.lk-results {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
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
