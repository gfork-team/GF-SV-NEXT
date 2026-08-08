<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { t, type Lang, i18nConfig } from '$i18n';
	import { siteConfig, getPrimaryLookupNodes, getBackupLookupNodes } from '$lib/config';
	import Ad from '$components/Ad.svelte';
	import { sendAudit } from '$lib/audit';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

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
		const url = new URL(window.location.href);
		url.hash = qs ? `#?${qs}` : '#';
		window.history.pushState({}, '', url);
	}

	interface ScriptResult {
		id: number;
		name: string;
		description: string;
		daily_installs: number;
		total_installs: number;
		good_ratings: number;
		ok_ratings: number;
		bad_ratings: number;
		fan_score: number | string;
		created_at: string;
		code_updated_at: string;
		code_url: string;
		users?: { id: number; name: string; created_at?: string; url?: string }[];
		url?: string;
		namespace?: string;
		support_url?: string | null;
		contribution_url?: string | null;
		contribution_amount?: string | null;
		license?: string;
		version?: string;
		locale?: string;
		deleted?: boolean;
		code_size?: number;
	}

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
	let sidebarOpen = $state(false);
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
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, siteConfig.lookupSignature.ssLength);
	}

	async function fetchFromNode(
		node: ApiNode,
		signal: AbortSignal,
		timeoutMs = 15000
	): Promise<{ success: boolean; data?: SearchApiResponse; node?: ApiNode; error?: string }> {
		console.log(`[${node.id}] 开始请求`);
		try {
			const params = { ...getSearchParams() };
			const ss = await generateSS();

			let url: string;
			let options: RequestInit;

			if (node.method === 'POST') {
				const body = new URLSearchParams(params as Record<string, string>).toString();
				url = `${node.endpoint}/${ss}`;
				options = {
					method: 'POST',
					headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
					body,
					mode: 'cors' as RequestMode,
					signal
				};
			} else {
				(params as Record<string, string>).ss = ss;
				const qs = new URLSearchParams(params as Record<string, string>).toString();
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
				const status = (res as Response).status || 'network error';
				console.log(`[${node.id}] ❌ HTTP ${status}`);
				throw new Error(`HTTP ${status}`);
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

			const data = json as SearchApiResponse;

			console.log(`[${node.id}] ✅ 200 | ${(data.query ?? data.execute)?.length ?? 0}条结果`);
			return { success: true, data: data, node };
		} catch (e) {
			console.log(`[${node.id}] ❌ ${e instanceof Error ? e.message : 'Unknown error'}`);
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error', node };
		}
	}

	async function raceNodes(nodes: ApiNode[], signal: AbortSignal): Promise<{ success: boolean; data?: SearchApiResponse; node?: ApiNode; failedNodes?: string[]; message?: string }> {
		console.log(`竞速开始，共${nodes.length}个节点: ${nodes.map(n => n.id).join(', ')}`);
		return new Promise((resolve) => {
			let resolved = false;
			let completed = 0;
			const failed: string[] = [];

			nodes.forEach(async (node) => {
				const result = await fetchFromNode(node, signal);
				if (resolved) {
					console.log(`[${node.id}] 已被忽略（已有节点胜出）`);
					return;
				}
				completed++;

				if (result.success) {
					resolved = true;
					console.log(`🏆 竞速胜出: ${node.id}`);
					resolve({ success: true, data: result.data, node: result.node });
				} else {
					failed.push(node.id);
					if (completed === nodes.length) {
						resolved = true;
						console.log(`竞速全部失败: ${failed.join(', ')}`);
						resolve({ success: false, failedNodes: failed, message: `所有节点请求失败: ${failed.join(', ')}` });
					}
				}
			});
		});
	}

	async function doSearch(): Promise<void> {
		const params = getSearchParams();
		console.log('=== 搜索开始 ===', { q: params.q, site: params.site, page: params.page });
		if (!params.q && !params.site && !params.page) {
			error = t(lang, 'lookup.no_search_content');
			return;
		}

		abortController?.abort();
		abortController = new AbortController();
		const signal = abortController.signal;

		loading = true;
		error = '';

		const allNodes = [...PRIMARY_NODES, ...BACKUP_NODES];

		console.log('--- 第1轮竞速 ---');
		const result = await raceNodes(allNodes, signal);
		if (result.success && result.data) {
			abortController.abort();
			handleResults(result.data);
			return;
		}

		const maxRetries = 6;
		for (let attempt = 0; attempt < maxRetries; attempt++) {
			await new Promise(r => setTimeout(r, 500));
			if (signal.aborted) return;
			const randomNode = allNodes[Math.floor(Math.random() * allNodes.length)];
			console.log(`--- 重试${attempt + 1}/${maxRetries}: 随机节点 ${randomNode.id} ---`);
			const retryResult = await fetchFromNode(randomNode, signal);
			if (retryResult.success && retryResult.data) {
				abortController.abort();
				handleResults(retryResult.data);
				return;
			}
		}

		error = result.message || 'All API requests failed';
		loading = false;
		console.log('=== 搜索结束: 全部失败 ===', result.message);
	}

	function handleResults(data: SearchApiResponse): void {
		if ((data as unknown as { redirect?: boolean; target_url?: string; message?: string }).redirect) {
			const r = data as unknown as { target_url: string; message: string };
			alert(r.message || 'Redirecting to Greasyfork Official Site');
			window.location.href = r.target_url;
			return;
		}

		const resultList = data.query ?? data.execute;
		if (resultList && Array.isArray(resultList)) {
			results = resultList.map((item) => ({
				...item,
				fan_score: typeof item.fan_score === 'string' ? parseFloat(item.fan_score) || 0 : item.fan_score,
			}));
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
						hit_count: resultList.length,
					},
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

	function updateTitle() {
		document.title = pageTitle;
	}

	function syncFromHash(): SearchParams {
		const p = getSearchParams();
		query = p.q || '';
		sortBy = p.sort || '';
		filterLocale = p.filter_locale || '0';
		currentPage = p.page || '1';
		advancedParams = p;
		updateTitle();
		return p;
	}

	function applyFilter(e: Event): void {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const newParams: SearchParams = {};

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

	function handleSearch(e: Event): void {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const q = (form.querySelector('input[name="q"]') as HTMLInputElement)?.value?.trim();
		if (!q) return;
		const p = getSearchParams();
		const ps = new URLSearchParams({ q, sort: p.sort || '', filter_locale: p.filter_locale || '0' });
		if (p.site) ps.set('site', p.site);
		form.action = `/${lang}/lookup#?${ps.toString()}`;
		form.submit();
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

	function formatDateTime(raw: string): string {
		if (!raw) return '—';
		const d = new Date(raw);
		const locale = i18nConfig.langNames[lang];
		return d.toLocaleString(locale, {
			year: 'numeric', month: '2-digit', day: '2-digit',
			hour: '2-digit', minute: '2-digit', hour12: false
		}).replace(/\//g, '-');
	}

	function escapeHtml(text: string): string {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	function getScriptInfoUrl(script: ScriptResult): string {
		const locale = i18nConfig.langNames[lang];
		return `/${lang}/info#/${locale}/scripts/${script.id}/detail`;
	}

	function getDownloadUrl(script: ScriptResult): string {
		if (script.code_url) {
			const path = script.code_url.replace('https://update.greasyfork.org/scripts/', '');
			return `/${lang}/l#/${path}`;
		}
		return '#';
	}

	function getAuthorUrl(script: ScriptResult): string {
		const userId = script.users?.[0]?.id;
		if (!userId) return '#';
		const locale = i18nConfig.langNames[lang];
		return `/${lang}/info#/${locale}/users/${userId}`;
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
	let popstateTimer: ReturnType<typeof setTimeout>;

	function onHashChanged() {
		const hash = window.location.hash;
		if (hash === '#google_vignette') return;
		if (isHashValid(hash)) lastValidHash = hash;
	}

onMount(() => {
		if (window.location.hash === '#google_vignette') return;

		window.addEventListener('hashchange', onHashChanged);

		const debouncedPop = () => {
			clearTimeout(popstateTimer);
			popstateTimer = setTimeout(() => {
				if (window.location.hash === '#google_vignette') return;
				syncFromHash();
				doSearch();
			}, 100);
		};
		window.addEventListener('popstate', debouncedPop);

		document.addEventListener('visibilitychange', () => {
			if (document.hidden && abortController) abortController.abort();
		});

		const params = syncFromHash();
		if (params.q || params.site || params.page) {
			doSearch();
		} else {
			error = t(lang, 'lookup.no_search_content');
		}

		return () => {
			window.removeEventListener('hashchange', onHashChanged);
			window.removeEventListener('popstate', debouncedPop);
		};
	});
</script>

<svelte:head>
<title>{pageTitle}</title>
	<meta name="description" content={t(lang, 'lookup.description')} />
	<meta name="keywords" content="userscript search, greasyfork lookup, script search, browser scripts, greasyfork scripts, user scripts" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
</svelte:head>

<section class="lk-page">
	<button class="lk-sidebar-toggle" class:open={sidebarOpen} onclick={() => (sidebarOpen = !sidebarOpen)}>
		{sidebarOpen ? '✕' : '☰'}
	</button>

	<div class="width-constraint">
		<div class="lk-layout" class:sidebar-open={sidebarOpen}>
			<!-- Sidebar — first in DOM for higher rendering priority -->
			<aside class="lk-sidebar" class:open={sidebarOpen}>
				<div class="lk-sidebar-title">{t(lang, 'lookup.sidebar_title')}</div>

				<form class="lk-sidebar-search" target="_blank" onsubmit={handleSearch}>
					<input
						type="search"
						name="q"
						bind:value={query}
						placeholder={t(lang, 'lookup.sidebar_search')}
					/>
					<button type="submit" class="search-icon-btn" aria-label={t(lang, 'lookup.sidebar_search')}>
						<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</button>
				</form>

				<!-- Sort options -->
				<div class="lk-option-group">
					<div class="lk-option-label">{t(lang, 'lookup.sidebar_sort')}</div>
					<div class="lk-chip-row">
						{#each sortOptions as opt}
							<button
								class="md3-chip"
								class:md3-chip--selected={sortBy === opt.value}
								onclick={e => { e.preventDefault(); handleSort(opt.value); }}
							>
								{t(lang, opt.key)}
							</button>
						{/each}
					</div>
				</div>

				<!-- Language filter -->
				<div class="lk-option-group">
					<div class="lk-option-label">{t(lang, 'lookup.sidebar_lang')}</div>
					<div class="lk-chip-row">
						<button class="md3-chip" class:md3-chip--selected={filterLocale === '0'} onclick={e => { e.preventDefault(); handleLangFilter('0'); }}>
							{t(lang, 'lookup.lang_all')}
						</button>
						<button class="md3-chip" class:md3-chip--selected={filterLocale === '1'} onclick={e => { e.preventDefault(); handleLangFilter('1'); }}>
							{t(lang, 'lookup.lang_zh')}
						</button>
					</div>
				</div>

				<!-- Advanced filters -->
				<div class="lk-option-group">
					<details>
						<summary class="lk-advanced-summary">{t(lang, 'lookup.sidebar_advanced')}</summary>
						<form class="lk-advanced-form" onsubmit={applyFilter}>
							<div class="lk-filter-group">
								<input name="site" placeholder={t(lang, 'lookup.filter_site_placeholder')} value={advancedParams.site || ''} />
							</div>

							{#each numericFilters as filter}
								<div class="lk-filter-group">
									<label for="{filter.key}_operator">{t(lang, filter.labelKey)}:</label>
									<div class="lk-filter-row">
										<select id="{filter.key}_operator" name="{filter.key}_operator" value={advancedParams[filter.key + '_operator'] || 'gt'}>
											<option value="gt">{t(lang, 'lookup.operator.gt')}</option>
											<option value="lt">{t(lang, 'lookup.operator.lt')}</option>
											<option value="eq">{t(lang, 'lookup.operator.eq')}</option>
										</select>
										<input type={filter.type} name={filter.key} placeholder={t(lang, 'lookup.filter_value_placeholder')} step={filter.step || ''} value={advancedParams[filter.key] || ''} />
									</div>
								</div>
							{/each}

							{#each dateFilters as filter}
								<div class="lk-filter-group">
									<label for="{filter.key}_operator">{t(lang, filter.labelKey)}:</label>
									<div class="lk-filter-row">
										<select id="{filter.key}_operator" name="{filter.key}_operator" value={advancedParams[filter.key + '_operator'] || 'gt'}>
											<option value="gt">{t(lang, 'lookup.operator.after')}</option>
											<option value="lt">{t(lang, 'lookup.operator.before')}</option>
										</select>
										<input type="datetime-local" name={filter.key} value={advancedParams[filter.key] || ''} />
									</div>
								</div>
							{/each}

							<div class="lk-filter-group">
								<label for="entry_locales">{t(lang, 'lookup.filter_script_lang')}:</label>
								<select name="entry_locales[]" multiple size="5" id="entry_locales" value={advancedParams['entry_locales[]'] || []}>
									{#each localeOptions as loc}
										<option value={loc.value}>{loc.label}</option>
									{/each}
								</select>
								<small class="lk-filter-hint">{t(lang, 'lookup.filter_multi_hint')}</small>
							</div>

							<input type="hidden" name="tz" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />

							<div class="lk-filter-actions">
								<button type="submit" class="md3-button lk-filter-btn">{t(lang, 'lookup.filter_apply')}</button>
								<button type="button" class="md3-outlined-button lk-filter-btn" onclick={clearFilters}>{t(lang, 'lookup.filter_clear')}</button>
							</div>
						</form>
					</details>
				</div>

				<div style="margin-top:16px;text-align:center">
					<Ad type="sidebar" />
				</div>
			</aside>

			<!-- Main content -->
			<div class="lk-main">
				<div style="margin-bottom:16px"><Ad type="fluid" /></div>
				<div style="margin-bottom:16px"><Ad type="fluid" /></div>
				{#if loading}
					<div class="md3-card lk-center-box">
						<span class="material-icons lk-spinner">autorenew</span>
						<div class="lk-loading-tip">
							{t(lang, 'lookup.loading')}<br />
							<small>{t(lang, 'lookup.warning')}</small>
						</div>
					</div>
				{:else if error}
					<div class="md3-card lk-center-box">
						<h3 class="title-large" style="margin-bottom:12px">{t(lang, 'lookup.load_failed')}</h3>
						<p style="color:var(--md-sys-color-on-surface-variant)">{error}</p>
						{#if !query}
							<p style="margin-top:16px;color:var(--md-sys-color-on-surface-variant)">{t(lang, 'lookup.search_prompt')}</p>
						{/if}
					</div>
				{:else if results.length === 0 && query}
					<div class="md3-card lk-center-box">
						<p style="color:var(--md-sys-color-on-surface-variant)">{t(lang, 'lookup.no_results')}</p>
					</div>
				{:else if results.length > 0}
<ol class="lk-script-list">
						{#each results as script (script.id)}
							<li class="lk-result-item" style="">
								<article>
									<h2>
										<a class="lk-script-link" href={getScriptInfoUrl(script)} target="_blank" rel="noopener noreferrer">
											{script.name || t(lang, 'lookup.unnamed')}
										</a>
										<span class="lk-badge-js" title="User Script">JS</span>
										<span class="lk-sep">-</span>
										<span class="lk-script-desc">{escapeHtml(script.description || t(lang, 'lookup.no_description'))}</span>
									</h2>
									<div class="lk-script-meta">
										<dl class="lk-stats">
											<dt>{t(lang, 'lookup.author')}</dt>
											<dd><a href={getAuthorUrl(script)} target="_blank" rel="noopener noreferrer">{escapeHtml(script.users?.[0]?.name || t(lang, 'lookup.unknown_author'))}</a></dd>
											<dt>{t(lang, 'lookup.daily_installs')}</dt>
											<dd>{script.daily_installs || 0}</dd>
											<dt>{t(lang, 'lookup.total_installs')}</dt>
											<dd>{script.total_installs || 0}</dd>
											<dt>{t(lang, 'lookup.ratings')}</dt>
											<dd class="lk-ratings-cell" data-rating-score={script.fan_score || 0}>
												<span class="lk-good" title={t(lang, 'lookup.ratings_good')}>{script.good_ratings || 0}</span>
												<span class="lk-ok" title={t(lang, 'lookup.ratings_ok')}>{script.ok_ratings || 0}</span>
												<span class="lk-bad" title={t(lang, 'lookup.ratings_bad')}>{script.bad_ratings || 0}</span>
												{#if (script.good_ratings || 0) + (script.ok_ratings || 0) + (script.bad_ratings || 0) > 0}
													{@const g = script.good_ratings || 0}
													{@const o = script.ok_ratings || 0}
													{@const b = script.bad_ratings || 0}
													{@const total = g + o + b}
													<span class="lk-rating-bar">
														<span class="lk-rating-bar-good" style="width:{(g / total * 100).toFixed(1)}%"></span>
														<span class="lk-rating-bar-ok" style="width:{(o / total * 100).toFixed(1)}%"></span>
														<span class="lk-rating-bar-bad" style="width:{(b / total * 100).toFixed(1)}%"></span>
													</span>
												{/if}
											</dd>
											<dt>{t(lang, 'lookup.created')}</dt>
											<dd>{formatDateTime(script.created_at)}</dd>
											<dt>{t(lang, 'lookup.updated')}</dt>
											<dd>{formatDateTime(script.code_updated_at)}</dd>
										</dl>
										<div class="lk-install-area">
											<a href={getDownloadUrl(script)} class="md3-button" target="_blank" rel="noopener noreferrer">
												{t(lang, 'lookup.install')}
											</a>
										</div>
									</div>
								</article>
							</li>
						{/each}
</ol>

					<!-- Pagination -->
					{@const pageNum = parseInt(currentPage) || 1}
					<div class="lk-pagination">
						<button class="md3-outlined-button" disabled={pageNum === 1} style="opacity:{pageNum === 1 ? '0.4' : '1'}" onclick={() => { const p = { ...getSearchParams(), page: '1' }; setHashParams(p); syncFromHash(); doSearch(); }}>{t(lang, 'lookup.pagination.first')}</button>
						<button class="md3-outlined-button" disabled={pageNum === 1} style="opacity:{pageNum === 1 ? '0.4' : '1'}" onclick={() => { const p = { ...getSearchParams(), page: String(Math.max(pageNum - 1, 1)) }; setHashParams(p); syncFromHash(); doSearch(); }}>{t(lang, 'lookup.pagination.prev')}</button>
						<span class="lk-current-page">{pageNum}</span>
						<button class="md3-outlined-button" disabled={results.length < responsePerPage} style="opacity:{results.length < responsePerPage ? '0.4' : '1'}" onclick={() => { const p = { ...getSearchParams(), page: String(pageNum + 1) }; setHashParams(p); syncFromHash(); doSearch(); }}>{t(lang, 'lookup.pagination.next')}</button>
					</div>
				{/if}

				<div class="lk-warning-bar">
					{t(lang, 'lookup.warning')}
				</div>

				<div style="margin:16px 0">
					<Ad type="auto" />
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.lk-page {
		background: var(--md-sys-color-surface);
		min-height: 100vh;
		color: var(--md-sys-color-on-surface);
	}

	.lk-page :global(.width-constraint) {
		max-width: none;
		padding: 16px 0;
	}

	.lk-layout {
		display: flex;
		gap: 24px;
	}

	.lk-main { flex: 1; min-width: 0; }

	/* ─── Sidebar ──────────────────────────────────────── */
	.lk-sidebar {
		width: 280px; flex-shrink: 0;
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur));
		-webkit-backdrop-filter: blur(var(--glass-blur));
		border: 1px solid var(--glass-border);
		border-radius: var(--md-sys-shape-corner-medium);
		padding: 20px;
		box-shadow: var(--glass-shadow);
		position: sticky; top: 16px;
		max-height: calc(100vh - 32px);
		overflow-y: auto;
		contain: layout style;
	}

	.lk-sidebar-title {
		font-size: var(--md-sys-typescale-title-medium);
		font-weight: 500;
		color: var(--md-sys-color-on-surface);
		margin-bottom: 16px;
	}

	.lk-sidebar-toggle {
		display: none;
		position: fixed; top: 12px; left: 12px;
		width: 40px; height: 40px;
		background: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
		border: none; border-radius: var(--md-sys-shape-corner-small);
		font-size: 20px; cursor: pointer;
		z-index: 100;
		box-shadow: var(--md-sys-elevation-3);
	}

	.lk-sidebar-search {
		display: flex; gap: 6px;
		margin-bottom: 16px;
	}

	.lk-sidebar-search input {
		flex: 1; padding: 8px 12px;
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
		font-size: 14px; font-family: inherit;
		background: var(--md-sys-color-surface);
		color: var(--md-sys-color-on-surface);
		outline: none;
	}

	.lk-option-group {
		margin-bottom: 20px;
	}

	.lk-option-label {
		font-size: 13px; font-weight: 600;
		color: var(--md-sys-color-on-surface);
		margin-bottom: 8px;
	}

	.lk-chip-row {
		display: flex; flex-wrap: wrap; gap: 6px;
	}

	.lk-advanced-summary {
		font-size: 13px; font-weight: 600;
		color: var(--md-sys-color-on-surface);
		cursor: pointer; margin-bottom: 12px;
	}

	.lk-filter-group { margin-bottom: 12px; }
	.lk-filter-group label { display: block; margin-bottom: 4px; font-size: 13px; font-weight: 500; color: var(--md-sys-color-on-surface-variant); }
	.lk-filter-group input,
	.lk-filter-group select {
		width: 100%; padding: 6px 8px;
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
		font-size: 13px; font-family: inherit;
		background: var(--md-sys-color-surface);
		color: var(--md-sys-color-on-surface);
	}

	.lk-filter-row {
		display: flex; gap: 4px;
	}
	.lk-filter-row select { width: 60px; flex-shrink: 0; }
	.lk-filter-row input { flex: 1; }

	.lk-filter-hint {
		display: block; margin-top: 4px;
		color: var(--md-sys-color-on-surface-variant);
		font-size: 12px;
	}

	.lk-filter-actions {
		display: flex; gap: 8px; margin-top: 12px;
	}

	.lk-filter-btn {
		flex: 1; height: 36px; padding: 0 16px; font-size: 13px;
	}

	/* ─── Center box (loading / error / empty) ────────── */
	.lk-center-box {
		display: flex; flex-direction: column;
		align-items: center; justify-content: center;
		padding: 60px 20px; min-height: 400px;
		text-align: center;
	}

	.lk-spinner {
		font-size: 48px;
		animation: lk-spin 0.5s linear infinite;
		display: inline-block;
		color: var(--md-sys-color-primary);
	}

	.lk-loading-tip {
		text-align: center; line-height: 1.6;
		max-width: 500px; margin-top: 20px;
		color: var(--md-sys-color-on-surface-variant);
	}
	.lk-loading-tip small { font-size: 0.9em; opacity: 0.7; }

/* ─── Script list ─────────────────────────────────── */
	.lk-script-list {
		list-style: none; padding: 0; margin: 0;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.lk-result-item {
		background: var(--glass-bg);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid var(--glass-border);
		border-radius: var(--md-sys-shape-corner-medium);
		padding: 20px;
		box-shadow: var(--glass-shadow);
		opacity: 1;
		contain: layout style;
		transition: box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
	}
	.lk-result-item:hover {
		background: var(--glass-bg-hover);
		box-shadow: 0 12px 40px rgba(0,0,0,0.09);
		transform: translateY(-2px);
	}

	.lk-result-item h2 {
		margin: 0 0 10px; font-size: 16px;
		display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;
	}

	.lk-script-link {
		color: var(--md-sys-color-primary);
		text-decoration: none; font-weight: 600;
	}
	.lk-script-link:hover { text-decoration: underline; }

	.lk-badge-js {
		background: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
		padding: 1px 6px; border-radius: 3px;
		font-size: 11px; font-weight: 600;
	}

	.lk-sep { color: var(--md-sys-color-outline-variant); }
	.lk-script-desc { color: var(--md-sys-color-on-surface-variant); font-size: 14px; font-weight: normal; }
	.lk-script-meta { margin-top: 8px; }

	.lk-stats {
		display: flex; flex-wrap: wrap; gap: 4px 16px;
		font-size: 13px; margin: 0 0 10px; padding: 0;
	}
	.lk-stats dt { color: var(--md-sys-color-on-surface-variant); }
	.lk-stats dd { margin: 0 12px 0 4px; }
	.lk-stats a { color: var(--md-sys-color-primary); text-decoration: none; }

	.lk-ratings-cell .lk-good { color: #4caf50; }
	.lk-ratings-cell .lk-ok { color: #ff9800; margin: 0 4px; }
	.lk-ratings-cell .lk-bad { color: var(--md-sys-color-error); }

	.lk-rating-bar {
		display: inline-flex;
		width: 80px;
		height: 6px;
		border-radius: 3px;
		overflow: hidden;
		margin-left: 8px;
		vertical-align: middle;
	}

	.lk-rating-bar-good { background: #4caf50; height: 100%; display: inline-block; }
	.lk-rating-bar-ok   { background: #ff9800; height: 100%; display: inline-block; }
	.lk-rating-bar-bad  { background: var(--md-sys-color-error); height: 100%; display: inline-block; }

	.lk-install-area { margin-top: 12px; }

	/* ─── Pagination ──────────────────────────────────── */
	.lk-pagination {
		display: flex; justify-content: center; align-items: center;
		gap: 8px; margin-top: 20px; padding: 12px 0;
		font-size: 13px;
	}
	.lk-pagination button:disabled { pointer-events: none; opacity: 0.4; }
	.lk-current-page {
		padding: 6px 14px; font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}

	.lk-warning-bar {
		margin-top: 16px; padding: 10px 16px;
		background: var(--md-sys-color-surface-container-highest);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
		font-size: 13px;
		color: var(--md-sys-color-on-surface-variant);
	}

/* ─── Mobile ──────────────────────────────────────── */
	@media (max-width: 768px) {
		.lk-sidebar-toggle { display: flex; align-items:center; justify-content:center; }
		.lk-layout { flex-direction: column; }
		.lk-sidebar {
			display: none; position: fixed;
			top: 0; left: 0;
			width: 280px; height: 100vh;
			z-index: 99; border-radius: 0;
			box-shadow: var(--md-sys-elevation-4);
		}
		.lk-sidebar.open { display: block; }

		.lk-script-list { grid-template-columns: 1fr; }
	}
</style>
