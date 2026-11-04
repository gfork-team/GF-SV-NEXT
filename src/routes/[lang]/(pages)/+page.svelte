<script lang="ts">
	import { t, type Lang } from '$i18n';
	import { siteConfig } from '$lib/config';
	import Ad from '$components/Ad.svelte';
	import Chip from '$components/Chip.svelte';
	import Icon from '$components/Icon.svelte';
	import MirrorStatusBlock from '$lib/dynamic/blocks/MirrorStatusBlock.svelte';
	import Onboarding from '$components/Onboarding.svelte';
	import SearchBar from '$components/SearchBar.svelte';
	import { goto } from '$app/navigation';
	import { stringifySearchParams, type SearchParams } from '$lib/search-params';
	import { LOCALE_OPTIONS } from '$lib/locale-options';
	import type { IconName } from '$lib/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);
	let isZh = $derived(lang === 'zh-hans' || lang === 'zh-hant');

	let site = $state('');

	let inputUrl = $state('');
	let outputUrl = $state('');
	let urlError = $state('');

	const hotWords = $derived([1, 2, 3, 4, 5].map((n) => t(lang, `home.hot.${n}`)));

	/* 核心功能：i18n 里用「标题 — 描述」合成，这里拆开。
	 * 只认全角破折号 / en dash —— ASCII 连字符会误伤 "Multi-CDN" 这类词。 */
	const features = $derived.by(() =>
		(['about.feature_1', 'about.feature_2', 'about.feature_3'] as const).map((key) => {
			const raw = t(lang, key);
			const idx = raw.search(/[—–]/);
			return {
				key,
				title: idx > 0 ? raw.slice(0, idx).trim() : raw,
				desc: idx > 0 ? raw.slice(idx + 1).trim() : ''
			};
		})
	);

	const featureIcons: IconName[] = ['shield', 'filter', 'download'];

	const quickLinks: { href: string; key: string; desc: string; icon: IconName }[] = [
		{ href: '/download', key: 'nav.download', desc: 'home.quick.desc.download', icon: 'download' },
		{ href: '/applist', key: 'nav.applist', desc: 'home.quick.desc.applist', icon: 'grid' },
		{ href: '/help', key: 'nav.help', desc: 'home.quick.desc.help', icon: 'help-circle' },
		{ href: '/about', key: 'nav.about', desc: 'home.quick.desc.about', icon: 'info' },
		{
			href: '/installing',
			key: 'nav.installing',
			desc: 'home.quick.desc.installing',
			icon: 'book'
		},
		{ href: '/feedback', key: 'footer.feedback', desc: 'home.quick.desc.feedback', icon: 'message' }
	];

	// ─── 高级搜索面板（折叠在 hero 下；提交后把参数拼进 lookup 的 hash） ───
	const advNumeric = [
		{ key: 'total_installs', labelKey: 'lookup.total_installs', step: '' },
		{ key: 'daily_installs', labelKey: 'lookup.daily_installs', step: '' },
		{ key: 'ratings', labelKey: 'lookup.ratings', step: '0.1' }
	];
	const advDates = [
		{ key: 'created', labelKey: 'lookup.created' },
		{ key: 'updated', labelKey: 'lookup.updated' }
	];

	/** 表单字段 → SearchParams：`[]` 结尾的多值键单独用 getAll 收 */
	function submitAdvanced(e: SubmitEvent & { currentTarget: HTMLFormElement }): void {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const params: SearchParams = {};
		for (const [key, value] of fd.entries()) {
			if (typeof value !== 'string' || value === '' || key.endsWith('[]')) continue;
			params[key] = value;
		}
		const locales = fd
			.getAll('entry_locales[]')
			.filter((v): v is string => typeof v === 'string' && v !== '');
		if (locales.length) params['entry_locales[]'] = locales;

		const qs = stringifySearchParams(params);
		goto(qs ? `/${lang}/lookup#?${qs}` : `/${lang}/lookup`);
	}

	function replaceUrl() {
		const url = inputUrl.trim();
		urlError = '';
		outputUrl = '';

		if (!/greasyfork\.org|sleazyfork\.org/.test(url)) {
			urlError = t(lang, 'home.url_tool.error');
			return;
		}

		let result = url;
		siteConfig.urlRewriteRules.forEach(({ from, to }) => {
			result = result.replace(from, to);
		});
		outputUrl = result;
	}

	function submitSite(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		e.preventDefault();
		(document.getElementById('hero-form') as HTMLFormElement | null)?.requestSubmit();
	}
</script>

<svelte:head>
	<title>{t(lang, 'meta.home_title')}</title>
	<meta name="description" content={t(lang, 'meta.home_desc')} />
	<meta name="keywords" content={t(lang, 'meta.home_keywords')} />
</svelte:head>

<!-- ═══ 一级：Hero ═══ -->
<section class="hero">
	<h1 class="hero__title">{t(lang, 'home.super_title')}</h1>

	<div class="hero__search">
		<SearchBar id="hero" {lang} size="lg" autofocus params={{ site }} />
	</div>

	{#if siteConfig.search.siteFilterEnabled}
		<input
			class="hero__site"
			type="search"
			aria-label={t(lang, 'search.site.placeholder')}
			placeholder={t(lang, 'search.site.placeholder')}
			bind:value={site}
			onkeydown={submitSite}
		/>
	{/if}

	<div class="hero__hot">
		<span class="hero__hot-label">{t(lang, 'home.hot.title')}</span>
		{#each hotWords as word (word)}
			<Chip href={`/${lang}/lookup#?q=${encodeURIComponent(word)}`} size="sm">{word}</Chip>
		{/each}
	</div>

	<div class="hero__status"><MirrorStatusBlock {lang} /></div>

	<!-- 高级搜索：折叠在 hero 里，提交后跳到 /lookup 的 hash 参数 -->
	<details class="hero__adv">
		<summary class="hero__adv-summary">
			<Icon name="filter" size={16} />
			{t(lang, 'lookup.sidebar_advanced')}
		</summary>
		<form class="hero__adv-form" onsubmit={submitAdvanced}>
			<div class="hero__adv-row">
				<label class="hero__adv-label" for="adv-site"
					>{t(lang, 'lookup.filter_site_placeholder')}</label
				>
				<input class="hero__adv-input" id="adv-site" name="site" />
			</div>

			{#each advNumeric as f (f.key)}
				<div class="hero__adv-row">
					<label class="hero__adv-label" for="adv-{f.key}">{t(lang, f.labelKey)}</label>
					<div class="hero__adv-pair">
						<select
							class="hero__adv-input"
							name="{f.key}_operator"
							aria-label={t(lang, f.labelKey)}
						>
							<option value="gt">{t(lang, 'lookup.operator.gt')}</option>
							<option value="lt">{t(lang, 'lookup.operator.lt')}</option>
							<option value="eq">{t(lang, 'lookup.operator.eq')}</option>
						</select>
						<input
							class="hero__adv-input"
							id="adv-{f.key}"
							type="number"
							step={f.step}
							name={f.key}
							placeholder={t(lang, 'lookup.filter_value_placeholder')}
						/>
					</div>
				</div>
			{/each}

			{#each advDates as f (f.key)}
				<div class="hero__adv-row">
					<label class="hero__adv-label" for="adv-{f.key}">{t(lang, f.labelKey)}</label>
					<div class="hero__adv-pair">
						<select
							class="hero__adv-input"
							name="{f.key}_operator"
							aria-label={t(lang, f.labelKey)}
						>
							<option value="gt">{t(lang, 'lookup.operator.after')}</option>
							<option value="lt">{t(lang, 'lookup.operator.before')}</option>
						</select>
						<input class="hero__adv-input" id="adv-{f.key}" type="datetime-local" name={f.key} />
					</div>
				</div>
			{/each}

			<div class="hero__adv-row">
				<label class="hero__adv-label" for="adv-locales"
					>{t(lang, 'lookup.filter_script_lang')}</label
				>
				<select class="hero__adv-input" id="adv-locales" name="entry_locales[]" multiple size="4">
					{#each LOCALE_OPTIONS as loc (loc.value)}
						<option value={loc.value}>{loc.label}</option>
					{/each}
				</select>
				<small class="hero__adv-hint">{t(lang, 'lookup.filter_multi_hint')}</small>
			</div>

			<input type="hidden" name="tz" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />

			<div class="hero__adv-actions">
				<button type="submit" class="ui-btn ui-btn--filled ui-btn--sm">
					{t(lang, 'lookup.filter_apply')}
				</button>
			</div>
		</form>
	</details>
</section>

<div class="ad-slot"><Ad type="fluid" /></div>

<!-- 三步装上脚本：安装路径是首页第二重要的事，放在核心功能之前 -->
<Onboarding {lang} />

<!-- ═══ 一级：核心特色 ═══ -->
<section class="section">
	<div class="section__head">
		<h2 class="section__title">{t(lang, 'home.features_title')}</h2>
	</div>

	<div class="feature-grid">
		{#each features as f, i (f.key)}
			<article class="feature-card ui-card">
				<span class="feature-card__icon" aria-hidden="true">
					<Icon name={featureIcons[i] ?? 'star'} size={20} />
				</span>
				<h3 class="feature-card__title">{f.title}</h3>
				{#if f.desc}<p class="feature-card__desc">{f.desc}</p>{/if}
			</article>
		{/each}
	</div>
</section>

<div class="ad-slot"><Ad type="horizontal" /></div>

<!-- ═══ 一级：常用服务 ═══ -->
<section class="section">
	<div class="section__head">
		<h2 class="section__title">{t(lang, 'home.quick.title')}</h2>
		<a class="section__more" href="/{lang}/applist">
			{t(lang, 'home.quick.more')}
			<Icon name="chevron-right" size={16} />
		</a>
	</div>

	<div class="quick-grid">
		{#each quickLinks as link (link.href)}
			<a class="quick-card ui-card" href="/{lang}{link.href}" data-sveltekit-preload-data="hover">
				<span class="quick-card__icon" aria-hidden="true">
					<Icon name={link.icon} size={20} />
				</span>
				<span class="quick-card__body">
					<span class="quick-card__name">{t(lang, link.key)}</span>
					<span class="quick-card__desc">{t(lang, link.desc)}</span>
				</span>
			</a>
		{/each}
	</div>
</section>

<div class="ad-slot"><Ad type="auto" /></div>

<!-- ═══ 二级：简介 + 推荐 ═══ -->
<div class="section section--split">
	<section class="intro ui-card">
		<p class="intro__text">{t(lang, 'home.intro')}</p>
	</section>

	{#if isZh}
		<section class="notice">
			<span class="notice__badge"><Icon name="star" size={14} /> ScriptCat</span>
			<p class="notice__text">
				{t(lang, 'home.recommend')}
				<a
					href="https://bbs.tampermonkey.net.cn/forum.php"
					target="_blank"
					rel="noopener noreferrer">{t(lang, 'home.recommend.link1')}</a
				>
				{t(lang, 'home.recommend.link2')}
			</p>
		</section>
	{/if}
</div>

<!-- ═══ 二级：URL 工具 ═══ -->
<section class="url-tool ui-card">
	<h2 class="section__title">{t(lang, 'home.url_tool.title')}</h2>
	<div class="url-tool__row">
		<input
			class="url-tool__input"
			type="search"
			bind:value={inputUrl}
			placeholder={t(lang, 'home.url_tool.placeholder')}
			aria-label={t(lang, 'home.url_tool.placeholder')}
		/>
		<button class="ui-btn ui-btn--filled" onclick={replaceUrl}>
			<Icon name="sparkle" size={18} />
			{t(lang, 'home.url_tool.button')}
		</button>
	</div>
	{#if outputUrl}
		<p class="url-tool__output">{outputUrl}</p>
	{:else if urlError}
		<p class="url-tool__error">{urlError}</p>
	{:else}
		<p class="url-tool__hint">{t(lang, 'home.url_tool.result')}</p>
	{/if}
</section>

<!-- ═══ 二级：条款与安装 ═══ -->
<section class="actions">
	<p class="actions__text">
		{t(lang, 'home.tos_agree')}
		<a class="actions__link" href="/{lang}/tos" data-sveltekit-preload-data="hover">
			{t(lang, 'home.tos_link')}
		</a>
	</p>
	<div class="actions__row">
		<a
			class="ui-btn ui-btn--outlined"
			href="/{lang}/installing"
			data-sveltekit-preload-data="hover"
		>
			<Icon name="book" size={18} />
			{t(lang, 'home.installing_link')}
		</a>
	</div>
</section>

<div class="ad-slot ad-slot--bottom"><Ad type="autorelaxed" /></div>

<style>
	/*
	 * 宽度不再由本页自己控制：外层 .layout-body 已限宽 1160px 并带 side-margin，
	 * 各区块只负责自己的左右内边距。之前这里额外写 1128 / 860 两套宽度，
	 * 导致桌面端左边缘在 71px 和 205px 之间来回跳。
	 */

	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 32px 0 4px;
		text-align: center;
	}
	.hero__title {
		max-width: 720px;
		margin: 0;
		font-size: clamp(24px, 4.4vw, 40px);
		font-weight: 600;
		line-height: 1.25;
		letter-spacing: -0.01em;
		color: var(--md-sys-color-on-surface);
		text-wrap: balance;
	}
	.hero__search {
		width: 100%;
		max-width: 640px;
		margin-top: 4px;
	}
	.hero__site {
		width: 100%;
		max-width: 640px;
		height: 44px;
		padding: 0 20px;
		font: inherit;
		font-size: var(--md-sys-typescale-body-large-size);
		color: var(--md-sys-color-on-surface);
		background: var(--md-sys-color-surface-container-highest);
		/* 与主搜索框一致：默认可见描边，focus 再用 box-shadow 加粗 */
		border: 1px solid var(--md-sys-color-outline);
		border-radius: var(--md-sys-shape-corner-full);
		transition:
			border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard),
			box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
	}
	.hero__site::placeholder {
		color: var(--md-sys-color-on-surface-variant);
	}
	.hero__site:focus-visible {
		outline: none;
		border-color: var(--md-sys-color-primary);
		box-shadow: 0 0 0 1px var(--md-sys-color-primary);
	}
	.hero__hot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 6px;
		max-width: 640px;
	}
	.hero__hot-label {
		font-size: var(--md-sys-typescale-label-medium-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.hero__status:not(:empty) {
		display: flex;
		justify-content: center;
		padding-top: 4px;
	}

	/* ─── 高级搜索（折叠） ─── */
	.hero__adv {
		width: 100%;
		max-width: 640px;
		margin-top: 4px;
		text-align: left;
		background: var(--md-sys-color-surface-container-low);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-medium);
	}
	.hero__adv-summary {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 14px;
		cursor: pointer;
		list-style: none;
		font-size: var(--md-sys-typescale-label-large-size);
		font-weight: 500;
		color: var(--md-sys-color-on-surface);
	}
	.hero__adv-summary::-webkit-details-marker {
		display: none;
	}
	.hero__adv[open] .hero__adv-summary {
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
	}
	.hero__adv-form {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px;
	}
	.hero__adv-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.hero__adv-label {
		font-size: var(--md-sys-typescale-label-medium-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.hero__adv-input {
		width: 100%;
		min-width: 0;
		height: 38px;
		padding: 0 12px;
		font: inherit;
		font-size: var(--md-sys-typescale-body-small-size);
		color: var(--md-sys-color-on-surface);
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-outline);
		border-radius: var(--md-sys-shape-corner-small);
	}
	.hero__adv-input:focus-visible {
		outline: none;
		border-color: var(--md-sys-color-primary);
		box-shadow: 0 0 0 1px var(--md-sys-color-primary);
	}
	select.hero__adv-input[multiple] {
		height: auto;
		padding: 6px;
	}
	.hero__adv-pair {
		display: flex;
		gap: 8px;
	}
	.hero__adv-pair .hero__adv-input:first-child {
		flex: 0 0 96px;
	}
	.hero__adv-hint {
		font-size: var(--md-sys-typescale-label-small-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.hero__adv-actions {
		display: flex;
		justify-content: flex-end;
	}
	@media (min-width: 600px) {
		.hero__adv-form {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: flex-end;
			gap: 12px;
		}
		.hero__adv-row {
			flex: 1 1 160px;
		}
		.hero__adv-row:has(select[multiple]) {
			flex: 1 1 100%;
		}
		.hero__adv-actions {
			flex: 0 0 auto;
		}
	}

	.ad-slot--bottom {
		margin-bottom: 8px;
	}

	.section {
		margin-top: var(--space-section);
	}
	.section__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 16px;
	}
	.section__title {
		margin: 0;
		font-size: var(--md-sys-typescale-title-large-size);
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}
	.section__more {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		min-height: 32px;
		font-size: var(--md-sys-typescale-label-large-size);
		color: var(--md-sys-color-primary);
		text-decoration: none;
	}
	.section__more:hover {
		text-decoration: underline;
	}

	/* 核心功能：图标在上、标题次之、描述最后，卡片高度由内容决定 */
	.feature-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
	}
	.feature-card {
		gap: 8px;
		padding: 18px 20px;
	}
	.feature-card__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--md-sys-shape-corner-medium);
		background: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
	}
	.feature-card__title {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		line-height: 1.4;
		letter-spacing: -0.01em;
		color: var(--md-sys-color-on-surface);
	}
	.feature-card__desc {
		margin: 0;
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.6;
		color: var(--md-sys-color-on-surface-variant);
	}

	/* 常用服务：移动端 2 列，避免 8 张卡单列堆出 1000px */
	.quick-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}
	.quick-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		min-height: 96px;
		padding: 14px;
		text-decoration: none;
		color: inherit;
	}
	.quick-card__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		flex-shrink: 0;
		border-radius: var(--md-sys-shape-corner-medium);
		background: var(--md-sys-color-secondary-container);
		color: var(--md-sys-color-on-secondary-container);
	}
	.quick-card__body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.quick-card__name {
		font-size: var(--md-sys-typescale-body-medium-size);
		font-weight: 500;
		line-height: 1.35;
		color: var(--md-sys-color-on-surface);
	}
	/* 描述最多两行；窄屏允许降为一行，宁可少字也不要半句被切 */
	.quick-card__desc {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		font-size: var(--md-sys-typescale-body-small-size);
		line-height: 1.4;
		color: var(--md-sys-color-on-surface-variant);
	}
	/*
	 * ≤479px 退回单列横排。
	 * 两列时每列只有 122–169px，英文描述几乎每张都被 line-clamp 切掉；
	 * 单列横排每张约 72–80px，8 张共 ~680px，只比两列多 ~130px，
	 * 换来的是描述完整显示，可读性明显更好。
	 */
	@media (max-width: 479px) {
		.quick-grid {
			grid-template-columns: minmax(0, 1fr);
		}
		.quick-card {
			flex-direction: row;
			align-items: center;
			min-height: 72px;
			gap: 12px;
			padding: 12px 14px;
		}
		.quick-card__desc {
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}
	}

	/* 二级区：简介与推荐并排，只在没有中文推荐时才单列 */
	.section--split {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
	}
	.intro {
		margin: 0;
		padding: 20px 24px;
		justify-content: center;
	}
	.intro__text {
		margin: 0;
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.85;
		color: var(--md-sys-color-on-surface-variant);
	}
	.notice {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 12px;
		margin: 0;
		padding: 14px 16px;
		background: var(--md-sys-color-tertiary-container);
		color: var(--md-sys-color-on-tertiary-container);
		border-radius: var(--md-sys-shape-corner-large);
	}
	.notice__badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 10px;
		border-radius: var(--md-sys-shape-corner-full);
		background: var(--md-sys-color-tertiary);
		color: var(--md-sys-color-on-tertiary);
		font-size: var(--md-sys-typescale-label-medium-size);
		font-weight: 600;
	}
	.notice__text {
		flex: 1;
		min-width: 200px;
		margin: 0;
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.7;
	}
	.notice__text a {
		color: inherit;
		font-weight: 600;
	}

	.url-tool {
		margin: var(--space-section) 0 0;
		padding: 16px 20px;
	}
	.url-tool__row {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 14px;
	}
	.url-tool__input {
		flex: none;
		width: 100%;
		min-width: 0;
		height: 48px;
		padding: 0 16px;
		font: inherit;
		font-size: var(--md-sys-typescale-body-large-size);
		color: var(--md-sys-color-on-surface);
		background: var(--md-sys-color-surface-container-high);
		border: 1px solid transparent;
		border-radius: var(--md-sys-shape-corner-small);
	}
	.url-tool__input:focus-visible {
		outline: none;
		border-color: var(--md-sys-color-primary);
	}
	.url-tool__hint,
	.url-tool__error {
		margin: 12px 0 0;
		font-size: var(--md-sys-typescale-body-small-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.url-tool__error {
		color: var(--md-sys-color-error);
	}
	.url-tool__output {
		margin: 12px 0 0;
		padding: 10px 14px;
		word-break: break-all;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: var(--md-sys-typescale-body-small-size);
		background: var(--md-sys-color-surface-container-high);
		border-radius: var(--md-sys-shape-corner-small);
		color: var(--md-sys-color-on-surface);
	}

	.actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		margin-top: var(--space-section);
		text-align: center;
	}
	.actions__row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}
	.actions__text {
		margin: 0;
		font-size: var(--md-sys-typescale-body-medium-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	/* 条款入口是普通超链接：它是"知情同意"的补充说明，不该抢按钮的视觉权重 */
	.actions__link {
		color: var(--md-sys-color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.actions__link:hover {
		text-decoration-thickness: 2px;
	}

	@media (min-width: 600px) {
		/*
		 * 600–839 保持 2 列而不是 3 列：这一段每列只有 ~180px，
		 * 横排布局下描述文字会被挤到第 3 行然后被 line-clamp 截断。
		 */
		.quick-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.feature-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.quick-card {
			flex-direction: row;
			align-items: center;
			min-height: 72px;
			gap: 12px;
		}
		.url-tool__row {
			flex-direction: row;
		}
		.url-tool__input {
			flex: 1;
			width: auto;
		}
	}
	@media (min-width: 840px) {
		.hero {
			padding: 52px 0 8px;
		}
		.section--split {
			grid-template-columns: 1fr 1fr;
			align-items: stretch;
		}
	}
	/*
	 * 4 列需要每列至少 ~250px 才装得下两行描述。
	 * 840–1079px 每列只有 183–229px，英文描述会被截断，所以这段用 3 列。
	 */
	@media (min-width: 840px) and (max-width: 1079px) {
		.quick-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (min-width: 1080px) {
		.quick-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	@media (max-width: 599px) {
		.intro {
			padding: 16px 18px;
		}
	}
</style>
