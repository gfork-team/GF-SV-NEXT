<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { t, type Lang } from '$i18n';
	import { siteConfig } from '$lib/config';
	import Ad from '$components/Ad.svelte';
	import {
		parseSearchParams,
		stringifySearchParams,
		type SearchParams as FilterParams
	} from '$lib/search-params';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

	// ─── Hash state management ─────────────────────────────────────────
	/** `entry_locales[]` 这类以 [] 结尾的键天然多值，序列化规则见 $lib/search-params */
	function hashGet(): FilterParams {
		const h = window.location.hash;
		if (!h || !h.startsWith('#?') || h === '#google_vignette') return {};
		return parseSearchParams(h.substring(2));
	}
	function hashSet(obj: FilterParams): void {
		const s = stringifySearchParams(obj);
		window.location.hash = s ? '#?' + s : '';
	}
	/** 单值读取，避免调用点到处写类型断言 */
	function hashStr(obj: FilterParams, key: string): string {
		const v = obj[key];
		return typeof v === 'string' ? v : '';
	}
	/** 多值读取，滤掉不在选项表里的值（例如手改 hash 塞进来的） */
	function hashList(obj: FilterParams, key: string, allowed: Set<string>): string[] {
		const v = obj[key];
		if (!Array.isArray(v)) return [];
		return v.filter((item) => allowed.has(item));
	}

	// ─── Basic search form ─────────────────────────────────────────────
	/**
	 * GET 表单只会带上查询串，页面 hash 里的高级筛选不会自动跟过去。
	 * 这里把当前 hash 里的筛选合并进 action，否则用户设好筛选再搜索会被静默丢掉。
	 */
	function handleBasicSubmit(e: Event) {
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const params: FilterParams = {};
		// 先放 hash 里的高级筛选，再让表单自身的字段覆盖同名键
		for (const [k, v] of Object.entries(hashGet())) params[k] = v;
		fd.forEach((v, k) => {
			const val = typeof v === 'string' ? v.trim() : '';
			if (val) params[k] = val;
		});
		const qs = stringifySearchParams(params);
		form.action = qs ? `/${lang}/s?${qs}` : `/${lang}/s`;
	}

	let searchQ = $state('');
	let searchSite = $state('');

	function updateTitle() {
		const base = t(lang, 'meta.search_title');
		const q = searchQ.trim();
		const s = searchSite.trim();
		document.title = q || s ? [q, s].filter(Boolean).join(' - ') + ' - ' + base : base;
	}
	function onQInput(e: Event) {
		searchQ = (e.target as HTMLInputElement).value;
		updateTitle();
	}
	function onSiteInput(e: Event) {
		searchSite = (e.target as HTMLInputElement).value;
		updateTitle();
	}

	// ─── Advanced filter state ─────────────────────────────────────────
	let totalInstallsOp = $state('gt');
	let totalInstalls = $state('');
	let dailyInstallsOp = $state('gt');
	let dailyInstalls = $state('');
	let ratingsOp = $state('gt');
	let ratings = $state('');
	let createdOp = $state('after');
	let created = $state('');
	let updatedOp = $state('after');
	let updated = $state('');
	let tz = $state('');
	let entryLocales = $state<string[]>([]);

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
		{ value: '134', label: 'Português Brasileiro (pt-BR)' },
		{ value: '76', label: 'Italiano (it)' },
		{ value: '118', label: 'Nederlands (nl)' },
		{ value: '130', label: 'Polski (pl)' },
		{ value: '171', label: 'Türkçe (tr)' },
		{ value: '181', label: 'Tiếng Việt (vi)' },
		{ value: '165', label: 'ไทย (th)' },
		{ value: '71', label: 'Bahasa Indonesia (id)' }
	];

	const LOCALE_KEY = 'entry_locales[]';
	const localeValues = new Set(localeOptions.map((o) => o.value));

	/** 空串代表「不限制」，不要写进 URL；操作符与数值成对出现 */
	function setNumber(params: FilterParams, opKey: string, valKey: string, op: string, val: string) {
		if (val === '') return;
		params[opKey] = op;
		params[valKey] = val;
	}

	function applyFilters() {
		// 直接构造对象，不要走 Object.fromEntries(URLSearchParams)：
		// 那会把 entry_locales[] 这种重复键塌成只剩最后一个值
		const params: FilterParams = {};
		setNumber(params, 'total_installs_op', 'total_installs', totalInstallsOp, totalInstalls);
		setNumber(params, 'daily_installs_op', 'daily_installs', dailyInstallsOp, dailyInstalls);
		setNumber(params, 'ratings_op', 'ratings', ratingsOp, ratings);
		setNumber(params, 'created_op', 'created', createdOp, created);
		setNumber(params, 'updated_op', 'updated', updatedOp, updated);
		if (tz) params.tz = tz;
		if (entryLocales.length) params[LOCALE_KEY] = entryLocales;
		hashSet(params);
		flash(t(lang, 'search.filter.applied'));
	}

	function clearAdvancedFilters() {
		totalInstallsOp = 'gt';
		totalInstalls = '';
		dailyInstallsOp = 'gt';
		dailyInstalls = '';
		ratingsOp = 'gt';
		ratings = '';
		createdOp = 'after';
		created = '';
		updatedOp = 'after';
		updated = '';
		tz = '';
		entryLocales = [];
		hashSet({});
		flash(t(lang, 'search.filter.cleared'));
	}

	// 原来的 alert() 会阻塞页面且文案写死英文，改为内联提示
	let notice = $state('');
	let noticeTimer: ReturnType<typeof setTimeout> | undefined;
	function flash(message: string) {
		notice = message;
		if (noticeTimer) clearTimeout(noticeTimer);
		noticeTimer = setTimeout(() => {
			notice = '';
		}, 4000);
	}
	$effect(() => () => {
		if (noticeTimer) clearTimeout(noticeTimer);
	});

	onMount(() => {
		const stored = hashGet();
		totalInstallsOp = hashStr(stored, 'total_installs_op') || totalInstallsOp;
		totalInstalls = hashStr(stored, 'total_installs');
		dailyInstallsOp = hashStr(stored, 'daily_installs_op') || dailyInstallsOp;
		dailyInstalls = hashStr(stored, 'daily_installs');
		ratingsOp = hashStr(stored, 'ratings_op') || ratingsOp;
		ratings = hashStr(stored, 'ratings');
		createdOp = hashStr(stored, 'created_op') || createdOp;
		created = hashStr(stored, 'created');
		updatedOp = hashStr(stored, 'updated_op') || updatedOp;
		updated = hashStr(stored, 'updated');
		tz = hashStr(stored, 'tz');
		entryLocales = hashList(stored, LOCALE_KEY, localeValues);

		const hasRangeFilter = !!(totalInstalls || dailyInstalls || created || updated);
		if (!tz && !hasRangeFilter) {
			tick().then(() => {
				try {
					tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
				} catch {
					/* 拿不到时区就留空 */
				}
			});
		}
	});
</script>

<svelte:head>
	<title>{t(lang, 'meta.search_title')}</title>
	<meta name="description" content={t(lang, 'meta.search_desc')} />
	<meta
		name="keywords"
		content="userscript search, greasyfork search, script search, browser scripts, user scripts advanced search"
	/>
</svelte:head>

<div class="width-constraint">
	<section class="sr-page">
		<!-- Top Ad -->
		<Ad type="auto" />

		<!-- ── Basic Search ────────────────────────────────────────── -->
		<form
			class="sr-basic-card"
			action="/{lang}/s"
			accept-charset="UTF-8"
			method="get"
			target="_blank"
			onsubmit={handleBasicSubmit}
		>
			<h3 class="sr-card-title">{t(lang, 'search.script_search_title')}</h3>
			<p class="sr-card-desc">{t(lang, 'search.script_search_desc')}</p>
			<p class="sr-card-desc">{t(lang, 'search.enter_keywords')}</p>
			<input
				type="search"
				name="q"
				class="sr-input sr-input--pill"
				placeholder={t(lang, 'search.placeholder')}
				oninput={onQInput}
			/>
			{#if siteConfig.search.siteFilterEnabled}
				<p class="sr-card-desc">{t(lang, 'search.enter_domain_desc')}</p>
				<input
					type="search"
					name="site"
					id="site-input"
					class="sr-input sr-input--pill"
					placeholder={t(lang, 'search.site.placeholder')}
					oninput={onSiteInput}
				/>
			{/if}
			<input type="hidden" name="sort" value="" />
			<input type="hidden" name="filter_locale" value="0" />
			<div class="sr-search-action">
				<button
					type="submit"
					class="search-icon-btn md3-ripple"
					aria-label={t(lang, 'search.button')}
				>
					<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</button>
			</div>
		</form>

		<!-- Below Search Form Ad -->
		<div class="sr-ad">
			<Ad type="horizontal" />
		</div>

		<!-- ── Advanced Filters ────────────────────────────────────── -->

		<div class="sr-advanced-card">
			<details open>
				<summary class="sr-advanced-summary">{t(lang, 'search.advanced_options')}</summary>

				<form
					id="advanced-search-form"
					class="sr-advanced-form"
					onsubmit={(e) => {
						e.preventDefault();
						applyFilters();
					}}
				>
					<!-- Script Language：跨满整行，放在首位以免在栅格里留下空格 -->
					<div class="sr-filter-group">
						<label for="adv-locales">{t(lang, 'search.filter.locales')}</label>
						<select id="adv-locales" name={LOCALE_KEY} multiple size="5" bind:value={entryLocales}>
							{#each localeOptions as opt (opt.value)}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						<small class="sr-filter-hint">{t(lang, 'search.locale_options')}</small>
					</div>

					<!-- Total Installs -->
					<div class="sr-filter-group">
						<label for="adv-total-op">{t(lang, 'search.filter.total_installs')}</label>
						<div class="sr-filter-row">
							<select id="adv-total-op" bind:value={totalInstallsOp}>
								<option value="gt">{t(lang, 'search.operator.gt')}</option>
								<option value="lt">{t(lang, 'search.operator.lt')}</option>
								<option value="eq">{t(lang, 'search.operator.eq')}</option>
							</select>
							<input type="number" bind:value={totalInstalls} placeholder="1000" min="0" />
						</div>
					</div>

					<!-- Daily Installs -->
					<div class="sr-filter-group">
						<label for="adv-daily-op">{t(lang, 'search.filter.daily_installs')}</label>
						<div class="sr-filter-row">
							<select id="adv-daily-op" bind:value={dailyInstallsOp}>
								<option value="gt">{t(lang, 'search.operator.gt')}</option>
								<option value="lt">{t(lang, 'search.operator.lt')}</option>
								<option value="eq">{t(lang, 'search.operator.eq')}</option>
							</select>
							<input type="number" bind:value={dailyInstalls} placeholder="100" min="0" />
						</div>
					</div>

					<!-- Ratings -->
					<div class="sr-filter-group">
						<label for="adv-ratings-op">{t(lang, 'search.filter.ratings')}</label>
						<div class="sr-filter-row">
							<select id="adv-ratings-op" bind:value={ratingsOp}>
								<option value="gt">{t(lang, 'search.operator.gt')}</option>
								<option value="lt">{t(lang, 'search.operator.lt')}</option>
								<option value="eq">{t(lang, 'search.operator.eq')}</option>
							</select>
							<input
								type="number"
								bind:value={ratings}
								placeholder="4.5"
								step="0.1"
								min="0"
								max="5"
							/>
						</div>
					</div>

					<!-- Created Date -->
					<div class="sr-filter-group">
						<label for="adv-created-op">{t(lang, 'search.filter.created')}</label>
						<div class="sr-filter-row">
							<select id="adv-created-op" bind:value={createdOp}>
								<option value="after">{t(lang, 'search.operator.after')}</option>
								<option value="before">{t(lang, 'search.operator.before')}</option>
							</select>
							<input type="datetime-local" bind:value={created} />
						</div>
					</div>

					<!-- Updated Date -->
					<div class="sr-filter-group">
						<label for="adv-updated-op">{t(lang, 'search.filter.updated')}</label>
						<div class="sr-filter-row">
							<select id="adv-updated-op" bind:value={updatedOp}>
								<option value="after">{t(lang, 'search.operator.after')}</option>
								<option value="before">{t(lang, 'search.operator.before')}</option>
							</select>
							<input type="datetime-local" bind:value={updated} />
						</div>
					</div>

					<!-- Time Zone -->
					<div class="sr-filter-group">
						<label for="adv-tz">{t(lang, 'search.filter.tz')}</label>
						<input
							id="adv-tz"
							type="text"
							bind:value={tz}
							placeholder={t(lang, 'search.tz_placeholder')}
						/>
					</div>

					<!-- Actions -->
					<div class="sr-filter-actions">
						<button type="submit" class="md3-button">{t(lang, 'search.filter.apply')}</button>
						<button type="button" onclick={clearAdvancedFilters} class="md3-outlined-button"
							>{t(lang, 'search.filter.clear')}</button
						>
					</div>

					{#if notice}
						<p class="sr-notice" role="status" aria-live="polite">{notice}</p>
					{/if}
				</form>
			</details>
		</div>

		<!-- Bottom Ad -->
		<div class="sr-ad sr-ad--bottom">
			<Ad type="fluid" />
		</div>
	</section>
</div>

<style>
	.sr-page {
		color: var(--md-sys-color-on-surface);
	}

	.sr-ad {
		margin: 16px 0;
		width: 100%;
	}

	.sr-ad--bottom {
		margin-top: 24px;
	}

	/* ── Basic search card ─────────────────────────────── */
	.sr-basic-card {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		column-gap: 12px;
		background: var(--card-bg);
		border-radius: 14px;
		border: 1px solid var(--md-sys-color-outline-variant);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.03),
			0 8px 24px rgba(0, 0, 0, 0.04);
		padding: 24px;
	}

	/* 标题与说明各自独占一行，输入框和提交按钮才有机会并排 */
	.sr-basic-card > h3,
	.sr-basic-card > p {
		flex: 0 0 100%;
	}

	.sr-basic-card > p {
		margin-top: 16px;
	}

	.sr-card-title {
		margin: 0 0 8px;
		font-size: var(--md-sys-typescale-title-medium-size);
		font-weight: 500;
	}

	.sr-card-desc {
		margin: 0;
		color: var(--md-sys-color-on-surface-variant);
		font-size: 14px;
	}

	.sr-input {
		display: block;
		flex: 1 1 160px;
		min-width: 0;
		width: auto;
		max-width: none;
		height: 48px;
		padding: 0 16px;
		border: 1px solid var(--md-sys-color-outline-variant);
		font-family: inherit;
		font-size: 14px;
		background: var(--md-sys-color-surface-container-highest);
		color: var(--md-sys-color-on-surface);
		outline: none;
		transition: border-color var(--md-sys-motion-duration-short)
			var(--md-sys-motion-easing-standard);
	}
	.sr-input:focus {
		border-color: var(--md-sys-color-primary);
	}

	.sr-input--pill {
		margin-top: 0;
		border-radius: var(--md-sys-shape-corner-full);
	}

	.sr-search-action {
		flex: 0 0 auto;
		margin-top: 0;
	}

	/* 旧类只在本页放大，不改动全局定义 */
	.sr-search-action .search-icon-btn {
		width: 48px;
		height: 48px;
	}

	/* ── Advanced filters card ─────────────────────────── */
	.sr-advanced-card {
		background: var(--card-bg);
		border-radius: 14px;
		border: 1px solid var(--md-sys-color-outline-variant);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.03),
			0 8px 24px rgba(0, 0, 0, 0.04);
		padding: 20px 24px;
		margin-top: 24px;
	}

	.sr-advanced-summary {
		display: flex;
		align-items: center;
		min-height: 44px;
		font-size: 16px;
		font-weight: 500;
		color: var(--md-sys-color-on-surface);
		cursor: pointer;
		user-select: none;
	}

	/*
	 * 7 个筛选组在宽屏下没必要单列铺满 1079px：
	 * ≥600px 两列、≥1080px 三列，各自只占内容高度，align-items:start 防止被拉平。
	 */
	.sr-advanced-form {
		margin-top: 16px;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: start;
		gap: 16px 20px;
	}

	/* ── Filter groups ─────────────────────────────────── */
	.sr-filter-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.sr-filter-group label {
		font-size: 13px;
		font-weight: 500;
		color: var(--md-sys-color-on-surface-variant);
	}

	.sr-filter-row {
		display: flex;
		gap: 8px;
	}

	.sr-filter-row select {
		width: 104px;
		flex-shrink: 0;
		height: 44px;
		padding: 0 10px;
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
		font-family: inherit;
		font-size: 13px;
		background: var(--md-sys-color-surface-container-highest);
		color: var(--md-sys-color-on-surface);
	}

	.sr-filter-row input {
		flex: 1;
		min-width: 0;
		height: 44px;
		padding: 0 12px;
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
		font-family: inherit;
		font-size: 13px;
		background: var(--md-sys-color-surface-container-highest);
		color: var(--md-sys-color-on-surface);
		outline: none;
	}
	.sr-filter-row input:focus,
	.sr-filter-row select:focus {
		border-color: var(--md-sys-color-primary);
	}

	.sr-filter-group > input,
	.sr-filter-group > select {
		width: 100%;
		height: 44px;
		padding: 0 12px;
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
		font-family: inherit;
		font-size: 13px;
		background: var(--md-sys-color-surface-container-highest);
		color: var(--md-sys-color-on-surface);
		outline: none;
	}
	.sr-filter-group > input:focus,
	.sr-filter-group > select:focus {
		border-color: var(--md-sys-color-primary);
	}

	.sr-filter-group select[multiple] {
		height: auto;
		min-height: 132px;
	}

	.sr-filter-hint {
		font-size: 12px;
		color: var(--md-sys-color-on-surface-variant);
	}

	/* ── Actions ───────────────────────────────────────── */
	.sr-filter-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		grid-column: 1 / -1;
		padding-top: 16px;
		border-top: 1px solid var(--md-sys-color-outline-variant);
	}
	.sr-filter-actions button {
		flex: 1 1 0;
		min-width: 0;
		min-height: 44px;
		padding: 0 8px;
	}

	.sr-notice {
		grid-column: 1 / -1;
		margin: 0;
		color: var(--md-sys-color-on-surface-variant);
		font-size: 13px;
		line-height: 1.5;
	}

	/* ── Responsive ────────────────────────────────────── */
	@media (min-width: 600px) {
		.sr-advanced-form {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		/* 语言多选内容多，独占整行比挤在半栏更好操作 */
		.sr-filter-group:has(#adv-locales) {
			grid-column: 1 / -1;
		}
		.sr-filter-actions button {
			flex: 1 1 180px;
			padding: 0 24px;
		}
	}
	@media (min-width: 1080px) {
		.sr-advanced-form {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (max-width: 599px) {
		.sr-filter-row {
			flex-direction: column;
		}
		/*
		 * 竖排后 flex:1 会作用在块轴（高度）上并把 height:44px 顶掉，
		 * 这里必须显式复位，否则同一行里 select 是 44px、input 只剩 18px。
		 */
		.sr-filter-row select,
		.sr-filter-row input {
			flex: none;
			width: 100%;
		}
	}
</style>
