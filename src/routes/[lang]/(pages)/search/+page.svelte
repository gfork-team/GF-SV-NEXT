<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { t, type Lang } from '$i18n';
	import { siteConfig } from '$lib/config';
	import Ad from '$components/Ad.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

	// ─── Hash state management ─────────────────────────────────────────
	function hashGet(): Record<string, string> {
		const h = window.location.hash;
		if (!h || !h.startsWith('#?') || h === '#google_vignette') return {};
		const params = new URLSearchParams(h.substring(2));
		const obj: Record<string, string> = {};
		params.forEach((v, k) => { if (v) obj[k] = v; });
		return obj;
	}
	function hashSet(obj: Record<string, string>): void {
		const p = new URLSearchParams();
		for (const [k, v] of Object.entries(obj)) {
			if (v) p.set(k, v);
		}
		const s = p.toString();
		window.location.hash = s ? '#?' + s : '';
	}

	// ─── Basic search form ─────────────────────────────────────────────
	function handleBasicSubmit(e: Event) {
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const qs = new URLSearchParams();
		fd.forEach((v, k) => {
			const val = typeof v === 'string' ? v.trim() : '';
			if (val) qs.set(k, val);
		});
		form.action = `/${lang}/s?${qs.toString()}`;
	}

	let searchQ = $state('');
	let searchSite = $state('');

	function updateTitle() {
		const base = t(lang, 'meta.search_title');
		const q = searchQ.trim();
		const s = searchSite.trim();
		document.title = (q || s) ? [q, s].filter(Boolean).join(' - ') + ' - ' + base : base;
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

	const localeOptions = [
		{ value: '187', label: '简体中文 (zh-CN)' },
		{ value: '188', label: '繁體中文 (zh-TW)' },
		{ value: '40',  label: 'English (en)' },
		{ value: '78',  label: '日本語 (ja)' },
		{ value: '88',  label: '한국어 (ko)' },
		{ value: '42',  label: 'Español (es)' },
		{ value: '51',  label: 'Français (fr)' },
		{ value: '35',  label: 'Deutsch (de)' },
		{ value: '139', label: 'Русский (ru)' },
		{ value: '134', label: 'Português Brasileiro (pt-BR)' },
		{ value: '76',  label: 'Italiano (it)' },
		{ value: '118', label: 'Nederlands (nl)' },
		{ value: '130', label: 'Polski (pl)' },
		{ value: '171', label: 'Türkçe (tr)' },
		{ value: '181', label: 'Tiếng Việt (vi)' },
		{ value: '165', label: 'ไทย (th)' },
		{ value: '71',  label: 'Bahasa Indonesia (id)' }
	];

	function applyFilters() {
		const params = new URLSearchParams();
		if (totalInstalls) { params.set('total_installs_op', totalInstallsOp); params.set('total_installs', totalInstalls); }
		if (dailyInstalls) { params.set('daily_installs_op', dailyInstallsOp); params.set('daily_installs', dailyInstalls); }
		if (ratings) { params.set('ratings_op', ratingsOp); params.set('ratings', ratings); }
		if (created) { params.set('created_op', createdOp); params.set('created', created); }
		if (updated) { params.set('updated_op', updatedOp); params.set('updated', updated); }
		if (tz) params.set('tz', tz);
		hashSet(Object.fromEntries(params));
		alert('Filter conditions applied. Results will reflect when you submit a script search.');
	}

	function clearAdvancedFilters() {
		totalInstallsOp = 'gt'; totalInstalls = '';
		dailyInstallsOp = 'gt'; dailyInstalls = '';
		ratingsOp = 'gt'; ratings = '';
		createdOp = 'after'; created = '';
		updatedOp = 'after'; updated = '';
		tz = '';
		hashSet({});
		alert('All advanced filter conditions cleared.');
	}

	onMount(() => {
		const stored = hashGet();
		if (stored.total_installs_op) totalInstallsOp = stored.total_installs_op;
		if (stored.total_installs) totalInstalls = stored.total_installs;
		if (stored.daily_installs_op) dailyInstallsOp = stored.daily_installs_op;
		if (stored.daily_installs) dailyInstalls = stored.daily_installs;
		if (stored.ratings_op) ratingsOp = stored.ratings_op;
		if (stored.ratings) ratings = stored.ratings;
		if (stored.created_op) createdOp = stored.created_op;
		if (stored.created) created = stored.created;
		if (stored.updated_op) updatedOp = stored.updated_op;
		if (stored.updated) updated = stored.updated;
		if (stored.tz) tz = stored.tz;

		if (!stored.tz && !stored.total_installs && !stored.daily_installs) {
			tick().then(() => {
				try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
			});
		}
	});
</script>

<svelte:head>
<title>{t(lang, 'meta.search_title')}</title>
	<meta name="description" content={t(lang, 'meta.search_desc')} />
	<meta name="keywords" content="userscript search, greasyfork search, script search, browser scripts, user scripts advanced search" />
</svelte:head>

<div class="width-constraint">
	<section class="sr-page">
		<!-- Top Ad -->
		<Ad type="auto" />

		<!-- ── Basic Search ────────────────────────────────────────── -->
		<form class="sr-basic-card" action="/{lang}/s" accept-charset="UTF-8" method="get" target="_blank" onsubmit={handleBasicSubmit}>
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
			<p class="sr-card-desc" style="margin-top:16px">{t(lang, 'search.enter_domain_desc')}</p>
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
				<button type="submit" class="search-icon-btn md3-ripple" aria-label={t(lang, 'search.button')}>
					<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</button>
			</div>
	</form>

		<!-- Below Search Form Ad -->
		<div style="margin:16px 0;width:100%">
			<Ad type="horizontal" />
		</div>

		<!-- Mid Ad (fluid in-feed) -->
		<div style="margin:16px 0">
			<Ad type="fluid" />
		</div>

		<!-- ── Advanced Filters ────────────────────────────────────── -->
		<div class="sr-advanced-card">
			<details open>
				<summary class="sr-advanced-summary">{t(lang, 'search.advanced_options')}</summary>

				<form id="advanced-search-form" class="sr-advanced-form" onsubmit={e => { e.preventDefault(); applyFilters(); }}>
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
							<input type="number" bind:value={ratings} placeholder="4.5" step="0.1" min="0" max="5" />
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

					<!-- Script Language -->
					<div class="sr-filter-group">
						<label for="adv-locales">{t(lang, 'search.filter.locales')}</label>
						<select id="adv-locales" name="entry_locales" multiple size="5">
							{#each localeOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						<small class="sr-filter-hint">{t(lang, 'search.locale_options')}</small>
					</div>

					<!-- Time Zone -->
					<div class="sr-filter-group">
						<label for="adv-tz">{t(lang, 'search.filter.tz')}</label>
						<input id="adv-tz" type="text" bind:value={tz} placeholder="Auto-detect" />
					</div>

					<!-- Actions -->
					<div class="sr-filter-actions">
						<button type="submit" class="md3-button">{t(lang, 'search.filter.apply')}</button>
						<button type="button" onclick={clearAdvancedFilters} class="md3-outlined-button">{t(lang, 'search.filter.clear')}</button>
					</div>
				</form>
			</details>
		</div>

		<!-- Bottom Ad -->
		<div style="margin-top:24px">
			<Ad type="fluid" />
		</div>
	</section>
</div>

<style>
	.sr-page {
		color: var(--md-sys-color-on-surface);
	}

	/* ── Basic search card ─────────────────────────────── */
	.sr-basic-card {
		background: var(--card-bg);
		border-radius: var(--md-sys-shape-corner-medium);
		padding: 24px;
	}

	.sr-card-title {
		margin: 0 0 8px;
		font-size: var(--md-sys-typescale-title-medium);
		font-weight: 500;
	}

	.sr-card-desc {
		margin: 0;
		color: var(--md-sys-color-on-surface-variant);
		font-size: 14px;
	}

	.sr-input {
		display: block;
		width: 100%;
		max-width: 480px;
		padding: 10px 16px;
		border: 1px solid var(--md-sys-color-outline-variant);
		font-family: inherit;
		font-size: 14px;
		background: var(--md-sys-color-surface-container-highest);
		color: var(--md-sys-color-on-surface);
		outline: none;
		transition: border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
	}
	.sr-input:focus {
		border-color: var(--md-sys-color-primary);
	}

	.sr-input--pill {
		margin-top: 12px;
		border-radius: var(--md-sys-shape-corner-full);
	}

	.sr-search-action {
		margin-top: 20px;
	}

	/* ── Advanced filters card ─────────────────────────── */
	.sr-advanced-card {
		background: var(--card-bg);
		border-radius: var(--md-sys-shape-corner-medium);
		padding: 20px 24px;
		margin-top: 24px;
	}

	.sr-advanced-summary {
		font-size: 16px;
		font-weight: 500;
		color: var(--md-sys-color-on-surface);
		cursor: pointer;
		user-select: none;
		padding: 4px 0;
	}

	.sr-advanced-form {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
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
		width: 90px;
		flex-shrink: 0;
		padding: 8px 10px;
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
		font-family: inherit;
		font-size: 13px;
		background: var(--md-sys-color-surface-container-highest);
		color: var(--md-sys-color-on-surface);
	}

	.sr-filter-row input {
		flex: 1;
		padding: 8px 12px;
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
		padding: 8px 12px;
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
		min-height: 120px;
	}

	.sr-filter-hint {
		font-size: 12px;
		color: var(--md-sys-color-on-surface-variant);
	}

	/* ── Actions ───────────────────────────────────────── */
	.sr-filter-actions {
		display: flex;
		gap: 12px;
		padding-top: 16px;
		border-top: 1px solid var(--md-sys-color-outline-variant);
	}
	.sr-filter-actions button {
		flex: 1;
	}

	/* ── Responsive ────────────────────────────────────── */
	@media (max-width: 600px) {
		.sr-filter-row {
			flex-direction: column;
		}
		.sr-filter-row select {
			width: 100%;
		}
	}
</style>
