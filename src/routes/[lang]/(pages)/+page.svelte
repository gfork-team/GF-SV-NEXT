<script lang="ts">
	import { t, type Lang, i18nConfig } from '$i18n';
	import { siteConfig } from '$lib/config';
	import { fetchScriptSuggestions, type ScriptSuggestion } from '$lib/lookup-api';
	import Ad from '$components/Ad.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

	let inputUrl = $state('');
	let outputUrl = $state('');
	let urlError = $state('');

	// ─── 搜索联想（gov.uk 式 combobox） ───
	let searchQ = $state('');
	let suggestions = $state<ScriptSuggestion[]>([]);
	let suggestOpen = $state(false);
	let suggestIndex = $state(-1);
	let suggestCtrl: AbortController | null = $state(null);
	let debounceTimer: ReturnType<typeof setTimeout>;

	async function onSearchInput(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const q = el.value.trim();
		suggestCtrl?.abort();
		clearTimeout(debounceTimer);
		suggestOpen = false;
		suggestIndex = -1;
		if (q.length < 2) {
			suggestions = [];
			return;
		}
		debounceTimer = setTimeout(async () => {
			const ctrl = new AbortController();
			suggestCtrl = ctrl;
			const list = await fetchScriptSuggestions(q, ctrl.signal, 8);
			if (ctrl.signal.aborted) return;
			suggestions = list ?? [];
			suggestOpen = list !== null && list.length > 0;
			suggestIndex = -1;
		}, 300);
	}

	function closeSuggest() {
		suggestOpen = false;
		suggestIndex = -1;
	}

	function goScript(id: number) {
		const locale = i18nConfig.langNames[lang];
		window.open(`/${lang}/info#/${locale}/scripts/${id}/detail`, '_blank', 'noopener');
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (!suggestOpen || suggestions.length === 0) {
			if (e.key === 'Escape') closeSuggest();
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			suggestIndex = suggestIndex < suggestions.length - 1 ? suggestIndex + 1 : suggestIndex;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			suggestIndex = suggestIndex > 0 ? suggestIndex - 1 : 0;
		} else if (e.key === 'Enter') {
			if (suggestIndex >= 0 && suggestions[suggestIndex]) {
				e.preventDefault();
				goScript(suggestions[suggestIndex].id);
				closeSuggest();
			}
		} else if (e.key === 'Escape') {
			closeSuggest();
		}
	}

	let isZh = $derived(lang === 'zh-hans' || lang === 'zh-hant');

	const featureKeys = ['about.feature_1', 'about.feature_2', 'about.feature_3'] as const;

	const quickLinks = [
		{ href: '/search', key: 'nav.search', desc: 'home.quick.desc.search' },
		{ href: '/download', key: 'nav.download', desc: 'home.quick.desc.download' },
		{ href: '/lookup', key: 'nav.lookup', desc: 'home.quick.desc.lookup' },
		{ href: '/help', key: 'nav.help', desc: 'home.quick.desc.help' },
		{ href: '/about', key: 'nav.about', desc: 'home.quick.desc.about' },
		{ href: '/feedback', key: 'footer.feedback', desc: 'home.quick.desc.feedback' }
	] as const;

	function splitFeature(text: string): { title: string; desc: string } {
		const idx = text.search(/[—\-–]/);
		if (idx <= 0) return { title: text, desc: '' };
		return {
			title: text.slice(0, idx).trim(),
			desc: text.slice(idx + 1).trim()
		};
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
</script>

<svelte:head>
<title>{t(lang, 'meta.home_title')}</title>
	<meta name="description" content={t(lang, 'meta.home_desc')} />
	<meta name="keywords" content="greasyfork, mirror, proxy, userscript, greasyfork镜像, 油猴脚本, 脚本加速, greasyfork加速, user scripts, tampermonkey" />
</svelte:head>

<div class="zh-home">
	<div class="zh-wrap">

		<!-- ═══ Hero ═══ -->
		<section class="zh-hero" data-reveal>
			<div class="zh-hero-inner">
				<h1 class="zh-hero-title">{t(lang, 'home.super_title')}</h1>

				<form
					class="zh-search"
					action="/{lang}/s"
					accept-charset="UTF-8"
					method="get"
					target="_blank"
					onsubmit={e => { closeSuggest(); const fd = new FormData(e.currentTarget as HTMLFormElement); const qs = new URLSearchParams(); fd.forEach((v, k) => { const val = typeof v === 'string' ? v.trim() : ''; if (val) qs.set(k, val); }); (e.currentTarget as HTMLFormElement).action = `/${lang}/s?${qs.toString()}`; }}
				>
					<div class="zh-search-bar">
						<input
							type="search"
							name="q"
							bind:value={searchQ}
							placeholder={t(lang, 'search.placeholder')}
							required
							role="combobox"
							aria-expanded={suggestOpen}
							aria-controls="zh-suggest-list"
							aria-autocomplete="list"
							aria-activedescendant={suggestOpen && suggestIndex >= 0 ? `zh-suggest-item-${suggestions[suggestIndex].id}` : undefined}
							oninput={onSearchInput}
							onkeydown={onSearchKeydown}
							onblur={() => setTimeout(closeSuggest, 120)}
							onfocus={() => { if (suggestions.length > 0 && !window.getSelection()?.toString()) suggestOpen = true; }}
						/>
						<input type="hidden" name="sort" value="" />
						<input type="hidden" name="filter_locale" value="0" />
						<button type="submit" class="zh-search-btn" aria-label={t(lang, 'search.button')}>
							<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</button>
					</div>
					{#if suggestOpen && suggestions.length > 0}
					<div class="zh-suggest" id="zh-suggest-list" role="listbox" aria-label="Suggestions">
						{#each suggestions as s, i}
							<button
								type="button"
								class="zh-suggest-item"
								class:zh-suggest-item--active={i === suggestIndex}
								id={`zh-suggest-item-${s.id}`}
								role="option"
								aria-selected={i === suggestIndex}
								onmouseenter={() => (suggestIndex = i)}
								onclick={() => { goScript(s.id); closeSuggest(); }}
							>
								<span class="zh-suggest-name">{s.name}</span>
								<span class="zh-suggest-installs">{s.installs.toLocaleString()}</span>
							</button>
						{/each}
					</div>
					{/if}
					{#if siteConfig.search.siteFilterEnabled}
					<div class="zh-search-bar zh-search-bar--site">
						<input type="search" name="site" placeholder={t(lang, 'search.site.placeholder')} />
					</div>
					{/if}
					<div class="zh-hot">
						<span class="zh-hot-label">{t(lang, 'home.hot.title')}</span>
						<a class="zh-hot-link" href="/{lang}/s?q={encodeURIComponent(t(lang, 'home.hot.1'))}" target="_blank" rel="noopener noreferrer">{t(lang, 'home.hot.1')}</a>
						<a class="zh-hot-link" href="/{lang}/s?q={encodeURIComponent(t(lang, 'home.hot.2'))}" target="_blank" rel="noopener noreferrer">{t(lang, 'home.hot.2')}</a>
						<a class="zh-hot-link" href="/{lang}/s?q={encodeURIComponent(t(lang, 'home.hot.3'))}" target="_blank" rel="noopener noreferrer">{t(lang, 'home.hot.3')}</a>
						<a class="zh-hot-link" href="/{lang}/s?q={encodeURIComponent(t(lang, 'home.hot.4'))}" target="_blank" rel="noopener noreferrer">{t(lang, 'home.hot.4')}</a>
						<a class="zh-hot-link" href="/{lang}/s?q={encodeURIComponent(t(lang, 'home.hot.5'))}" target="_blank" rel="noopener noreferrer">{t(lang, 'home.hot.5')}</a>
					</div>
				</form>
			</div>
		</section>

		<!-- ═══ AD: Below search ═══ -->
		<div style="text-align:center;margin:16px 0">
			<Ad type="fluid" />
		</div>

		<!-- ═══ 常用服务（政务式快捷入口） ═══ -->
		<section class="zh-section" data-reveal style="--reveal-delay:120ms">
			<div class="zh-section-head">
				<h2 class="zh-section-title">{t(lang, 'home.quick.title')}</h2>
				<a class="zh-section-more" href="/{lang}/applist">更多 ›</a>
			</div>
			<div class="zh-quick-grid">
				{#each quickLinks as link}
					<a class="zh-quick-card" href="/{lang}{link.href}" data-sveltekit-preload-data="hover">
					<span class="zh-quick-icon" aria-hidden="true">
						{#if link.href === '/search'}
						<span class="material-symbols-outlined">search</span>
						{:else if link.href === '/download'}
						<span class="material-symbols-outlined">download</span>
						{:else if link.href === '/lookup'}
						<span class="material-symbols-outlined">manage_search</span>
						{:else if link.href === '/help'}
						<span class="material-symbols-outlined">help</span>
						{:else if link.href === '/about'}
						<span class="material-symbols-outlined">info</span>
						{:else}
						<span class="material-symbols-outlined">feedback</span>
						{/if}
					</span>
						<span class="zh-quick-body">
							<span class="zh-quick-name">{t(lang, link.key)}</span>
							<span class="zh-quick-desc">{t(lang, link.desc)}</span>
						</span>
						<svg class="zh-quick-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
				{/each}
			</div>
		</section>

		<!-- ═══ AD: After quick services ═══ -->
		<div style="text-align:center;margin:24px 0">
			<Ad type="horizontal" />
		</div>

		<!-- ═══ Features ═══ -->
		<section class="zh-section" data-reveal style="--reveal-delay:120ms">
			<div class="zh-section-head">
				<h2 class="zh-section-title">{t(lang, 'about.features')}</h2>
			</div>
			<div class="zh-features">
				{#each featureKeys as key}
					{@const f = splitFeature(t(lang, key))}
					<div class="zh-card zh-feature">
						<div>
							<h3 class="zh-feature-title">{f.title}</h3>
							{#if f.desc}<p class="zh-feature-desc">{f.desc}</p>{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- ═══ Intro ═══ -->
		<section class="zh-card zh-intro" data-reveal style="--reveal-delay:120ms">
			<p class="zh-intro-text">{t(lang, 'home.intro')}</p>
		</section>

		<!-- ═══ ScriptCat Recommend（中文站展示） ═══ -->
		{#if isZh}
		<section class="zh-card zh-notice" data-reveal style="--reveal-delay:120ms">
			<span class="zh-notice-badge">{t(lang, 'nav.home')}</span>
			<p class="zh-notice-text">
				{t(lang, 'home.recommend')}
				<a href="https://bbs.tampermonkey.net.cn/forum.php" target="_blank" rel="noopener noreferrer" class="zh-notice-link">{t(lang, 'home.recommend.link1')}</a>
				{t(lang, 'home.recommend.link2')}
			</p>
		</section>
		{/if}

		<!-- ═══ URL Tool Section ═══ -->
		<section class="zh-card zh-url-tool" data-reveal style="--reveal-delay:120ms">
			<div class="zh-section-head">
				<h2 class="zh-section-title">{t(lang, 'home.url_tool.title')}</h2>
			</div>
			<div class="zh-url-inputs">
				<input type="search" id="inputUrl" bind:value={inputUrl} placeholder={t(lang, 'home.url_tool.placeholder')} class="zh-input" />
				<button onclick={replaceUrl} class="zh-btn zh-btn--primary">{t(lang, 'home.url_tool.button')}</button>
			</div>
			<p class="zh-url-result">{t(lang, 'home.url_tool.result')}</p>
			{#if outputUrl}
				<p id="outputUrl" class="zh-url-output">{outputUrl}</p>
			{/if}
			{#if urlError}
				<p id="errorMessage" class="zh-url-error">{urlError}</p>
			{/if}
		</section>

		<!-- ═══ AD: After URL tool ═══ -->
		<div style="text-align:center;margin:16px 0">
			<Ad type="auto" />
		</div>

		<!-- ═══ TOS & Installing Links ═══ -->
		<section class="zh-card zh-actions" data-reveal style="--reveal-delay:120ms">
			<div class="zh-actions-row">
				<span>{t(lang, 'home.tos_agree')}</span>
				<a href="/{lang}/tos" class="zh-btn zh-btn--primary" data-sveltekit-preload-data="hover">{t(lang, 'home.tos_link')}</a>
			</div>
			<div class="zh-actions-row">
				<a href="/{lang}/installing" class="zh-btn zh-btn--outline" data-sveltekit-preload-data="hover">{t(lang, 'home.installing_link')}</a>
			</div>
		</section>

		<!-- ═══ AD: Bottom ═══ -->
		<div style="text-align:center;margin:16px 0 32px">
			<Ad type="autorelaxed" />
		</div>

	</div>
</div>

<style>
	:global(:root) {
		--zh-ink: #1f1f1f;
		--zh-ink-deep: #111111;
		--zh-ink-soft: #5f5f5f;
		--zh-azure: #1d5fa8;
		--zh-azure-soft: #6b93c2;
		--zh-seal: #ddaacc;
		--zh-seal-deep: #c86b8a;
		--zh-seal-bright: #eed3e5;
		--zh-seal-soft: #f8edf4;
		--zh-gold: #b98a1e;
		--zh-gold-deep: #9a731a;
		--zh-ivory: #f5f5f5;
		--zh-ivory-bright: #ffffff;
		--zh-paper: #fafafa;
		--zh-line: #e5e5e5;
		--zh-serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", Georgia, "Times New Roman", serif;
	}

	.zh-home {
		background: transparent;
		min-height: 100vh;
	}
	.zh-wrap {
		max-width: 980px;
		margin: 0 auto;
		padding: 0 16px;
	}

	/* ─── Hero（无框，直接落在页面背景上） ── */
	.zh-hero {
		position: relative;
		text-align: center;
		padding: 48px 16px 4px;
	}

	.zh-hero-inner { position: relative; }

	.zh-hero-title {
		font-size: clamp(19px, 3.2vw, 28px);
		font-weight: 700; line-height: 1.4;
		margin: 0 auto 26px;
		white-space: nowrap;
		letter-spacing: -0.005em;
		color: var(--md-sys-color-on-surface);
	}
	:global(:root[data-zh-china="1"]) .zh-hero-title {
		color: var(--zh-ink);
	}

	/* 搜索（gov.uk 式大搜索框） */
	.zh-search { display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; }
	.zh-search-bar {
		display: flex; align-items: center; gap: 8px;
		width: 100%; max-width: 640px;
		background: var(--md-sys-color-surface-container-highest);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: 12px;
		padding: 6px 6px 6px 20px;
		box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 6px 16px rgba(0,0,0,.05);
		transition: box-shadow 160ms ease-out, border-color 160ms ease-out;
	}
	:global(:root[data-zh-china="1"]) .zh-search-bar {
		background: var(--zh-paper);
		border: 1px solid var(--zh-line);
		box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 6px 16px rgba(0,0,0,.05);
	}
	:global(:root[data-zh-china="1"]) .zh-search-bar:focus-within {
		border-color: var(--zh-seal);
		box-shadow: 0 0 0 3px rgba(221,170,204,.14);
	}
	.zh-search-bar input {
		flex: 1; min-width: 0; height: 48px;
		border: none; outline: none; background: transparent;
		font-family: inherit; font-size: 17px;
		color: var(--md-sys-color-on-surface);
	}
	.zh-search-bar--site { max-width: 360px; }
	.zh-search-bar--site input { height: 40px; font-size: 15px; }
	.zh-search-btn {
		display: inline-flex; align-items: center; justify-content: center;
		width: 48px; height: 48px; flex-shrink: 0;
		background: linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary));
		border: none;
		border-radius: 10px;
		color: var(--md-sys-color-on-primary);
		cursor: pointer;
		box-shadow: 0 6px 14px rgba(0,0,0,.12);
		transition: filter 160ms ease-out,
		            transform 160ms ease-out,
		            box-shadow 160ms ease-out;
	}
	:global(:root[data-zh-china="1"]) .zh-search-btn {
		background: linear-gradient(135deg, var(--zh-seal-bright), var(--zh-seal-deep));
		border: none;
		color: #fff;
		box-shadow: 0 6px 16px rgba(221,170,204,.34);
	}
	.zh-search-btn:hover { filter: brightness(1.08); box-shadow: 0 8px 20px rgba(221,170,204,.38); }
	.zh-search-btn:active { transform: scale(.96); box-shadow: 0 3px 8px rgba(0,0,0,.12); }

	/* 搜索建议（gov.uk 式 combobox 下拉） */
	.zh-suggest {
		position: absolute; top: calc(100% - 4px); left: 50%; z-index: 40;
		transform: translateX(-50%);
		width: 100%; max-width: 640px;
		background: var(--md-sys-color-surface-container-low);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: 12px;
		box-shadow: 0 12px 32px rgba(0,0,0,.12);
		padding: 6px;
		overflow-y: auto;
		max-height: 340px;
		text-align: left;
	}
	:global(:root[data-zh-china="1"]) .zh-suggest {
		background: var(--zh-ivory-bright);
		border: 1px solid var(--zh-line);
		box-shadow: 0 12px 32px rgba(0,0,0,.14);
	}
	.zh-suggest-item {
		display: flex; align-items: center; justify-content: space-between; gap: 12px;
		width: 100%; padding: 10px 12px;
		border: none; background: none; border-radius: 7px;
		font-family: inherit; font-size: 14px; cursor: pointer;
		color: var(--md-sys-color-on-surface);
		transition: background 120ms ease-out;
	}
	.zh-suggest-item:hover { background: var(--md-sys-color-surface-variant); }
	:global(:root[data-zh-china="1"]) .zh-suggest-item:hover,
	:global(:root[data-zh-china="1"]) .zh-suggest-item--active {
		background: rgba(221,170,204,.12);
		color: var(--zh-ink-deep);
	}
	.zh-suggest-name {
		min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		font-weight: 500;
	}
	.zh-suggest-installs {
		flex-shrink: 0;
		font-size: 12px;
		color: var(--md-sys-color-on-surface-variant);
	}
	:global(:root[data-zh-china="1"]) .zh-suggest-installs { color: var(--zh-ink-soft); }

	/* 热门搜索 */
	.zh-hot {
		display: flex; align-items: center; justify-content: center;
		gap: 2px; flex-wrap: wrap;
		max-width: 560px;
	}
	.zh-hot-label {
		font-size: 12px; letter-spacing: .5px;
		color: var(--md-sys-color-on-surface-variant);
		margin-right: 4px;
	}
	:global(:root[data-zh-china="1"]) .zh-hot-label { color: var(--zh-ink-soft); }
	.zh-hot-link {
		font-size: 13px; padding: 4px 8px;
		border-radius: 4px;
		color: var(--md-sys-color-primary);
		text-decoration: none;
		transition: color 160ms ease-out, background 160ms ease-out;
	}
	:global(:root[data-zh-china="1"]) .zh-hot-link { color: var(--zh-azure); }
	.zh-hot-link:hover { text-decoration: none; }
	:global(:root[data-zh-china="1"]) .zh-hot-link:hover {
		color: var(--zh-seal);
		background: rgba(221,170,204,.10);
	}
	:global(:root[data-zh-china="1"]) .zh-hot-link:focus-visible { outline: 2px solid var(--zh-seal); outline-offset: 2px; }

	/* ─── 区块标题（红字 + 更多，gov.cn 式） ── */
	.zh-section { margin-top: 28px; }
	.zh-section-head {
		display: flex; align-items: center; justify-content: space-between; gap: 12px;
		margin-bottom: 14px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
	}
	:global(:root[data-zh-china="1"]) .zh-section-head { border-bottom: 1px solid var(--zh-line); }
	.zh-section-title {
		font-size: 18px; font-weight: 700; letter-spacing: -0.005em;
		color: var(--md-sys-color-on-surface);
		margin: 0;
		position: relative;
		padding-left: 12px;
	}
	:global(:root[data-zh-china="1"]) .zh-section-title {
		color: var(--zh-seal);
		padding-left: 12px;
	}
	.zh-section-title:before {
		content: ''; position: absolute; left: 0; top: 50%;
		width: 3px; height: 16px;
		background: var(--md-sys-color-primary);
		border-radius: 2px;
		transform: translateY(-50%);
	}
	:global(:root[data-zh-china="1"]) .zh-section-title:before { background: var(--zh-seal); }
	.zh-section-more {
		font-size: 13px;
		color: var(--md-sys-color-on-surface-variant);
		text-decoration: none;
		transition: color 160ms ease-out;
	}
	:global(:root[data-zh-china="1"]) .zh-section-more { color: var(--zh-ink-soft); }
	:global(:root[data-zh-china="1"]) .zh-section-more:hover { color: var(--zh-seal); }

	/* ─── 卡片（白底，Cloudflare 式） ─────── */
	.zh-card {
		background: var(--md-sys-color-surface-container-low);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: 14px;
		padding: 24px;
		box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 8px 24px rgba(0,0,0,.04);
		transition: transform .2s ease-out, box-shadow .2s ease-out, border-color .2s ease-out;
	}
	:global(:root[data-zh-china="1"]) .zh-card {
		background: var(--zh-ivory-bright);
		border: 1px solid var(--zh-line);
		box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 8px 24px rgba(0,0,0,.04);
	}
	@media (hover: hover) {
		.zh-card:hover {
			transform: translateY(-3px);
			box-shadow: 0 2px 4px rgba(0,0,0,.04), 0 16px 40px rgba(0,0,0,.08);
		}
	}

	/* ─── 常用服务网格 ─────────────────── */
	.zh-quick-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 14px;
	}
	.zh-quick-card {
		display: flex; align-items: flex-start; gap: 12px;
		padding: 18px 16px;
		background: var(--md-sys-color-surface-container-low);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: 12px;
		box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 4px 12px rgba(0,0,0,.03);
		text-decoration: none;
		transition: transform 160ms ease-out,
		            box-shadow 160ms ease-out,
		            border-color 160ms ease-out;
	}
	:global(:root[data-zh-china="1"]) .zh-quick-card {
		background: var(--zh-ivory-bright);
		border: 1px solid var(--zh-line);
	}
	.zh-quick-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 20px rgba(0,0,0,.08);
	}
	:global(:root[data-zh-china="1"]) .zh-quick-card:hover {
		border-color: var(--zh-seal);
		box-shadow: 0 12px 28px rgba(0,0,0,.10);
	}
	.zh-quick-card:active { transform: scale(.98); }
	.zh-quick-icon {
		display: inline-flex; align-items: center; justify-content: center;
		width: 40px; height: 40px; flex-shrink: 0;
		font-size: 22px; line-height: 1;
		border-radius: 10px;
		background: var(--md-sys-color-secondary-container);
		color: var(--md-sys-color-on-secondary-container);
		box-shadow: inset 0 0 0 1px rgba(0,0,0,.05);
		transition: background 160ms ease-out, color 160ms ease-out;
	}
	:global(:root[data-zh-china="1"]) .zh-quick-icon {
		background: var(--zh-ivory);
		color: var(--zh-azure);
		border: 1px solid var(--zh-line);
	}
	:global(:root[data-zh-china="1"]) .zh-quick-card:hover .zh-quick-icon {
		background: var(--zh-seal);
		color: #fff;
		border-color: var(--zh-seal);
	}
	.zh-quick-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
	.zh-quick-name {
		font-size: 15px; font-weight: 600; letter-spacing: 0;
		color: var(--md-sys-color-on-surface);
	}
	:global(:root[data-zh-china="1"]) .zh-quick-name { color: var(--zh-ink-deep); }
	.zh-quick-desc {
		font-size: 12px; line-height: 1.6;
		color: var(--md-sys-color-on-surface-variant);
	}
	:global(:root[data-zh-china="1"]) .zh-quick-desc { color: var(--zh-ink-soft); }
	.zh-quick-arrow {
		margin-left: auto; flex-shrink: 0;
		color: var(--md-sys-color-outline-variant);
		opacity: 0;
		transform: translateX(-4px);
		transition: opacity 160ms ease-out, transform 160ms ease-out;
	}
	:global(:root[data-zh-china="1"]) .zh-quick-arrow { color: var(--zh-seal); }
	.zh-quick-card:hover .zh-quick-arrow { opacity: 1; transform: translateX(0); }
	.zh-quick-card:focus-visible { outline: 2px solid var(--zh-seal); outline-offset: 2px; }

	/* ─── Features ─────────────────────── */
	.zh-features {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}
	.zh-feature { display: block; }
	/* feature 区块：红字 + 浅红底（政务风） */
	:global(:root[data-zh-china="1"]) .zh-feature {
		background: var(--zh-seal-soft);
		border: 1px solid color-mix(in srgb, var(--zh-seal) 16%, transparent);
		border-radius: 10px;
		padding: 18px 20px;
	}
	.zh-feature-title {
		font-size: 16px; font-weight: 600;
		color: var(--md-sys-color-on-surface);
		margin: 2px 0 6px;
		letter-spacing: -0.005em;
	}
	:global(:root[data-zh-china="1"]) .zh-feature-title { color: var(--zh-seal); }
	.zh-feature-desc {
		font-size: 13px; line-height: 1.6;
		color: var(--md-sys-color-on-surface-variant);
		margin: 0;
	}
	:global(:root[data-zh-china="1"]) .zh-feature-desc { color: var(--zh-ink-soft); }

	/* ─── Intro ────────────────────────── */
	.zh-intro { margin-top: 28px; text-align: center; padding: 32px 28px; }
	.zh-intro-text {
		max-width: 760px; margin: 0 auto;
		font-size: 14px; line-height: 1.9;
		color: var(--md-sys-color-on-surface-variant);
		text-align: center;
	}
	:global(:root[data-zh-china="1"]) .zh-intro-text { color: var(--zh-ink-soft); }

	/* ─── Notice ───────────────────────── */
	.zh-notice {
		margin-top: 16px;
		position: relative;
		padding-left: 20px;
		background: var(--md-sys-color-surface-container-low);
		border-left: 4px solid var(--md-sys-color-primary);
		border-radius: 0 14px 14px 0;
	}
	:global(:root[data-zh-china="1"]) .zh-notice {
		background: var(--zh-paper);
		border-left: 4px solid var(--zh-seal);
	}
	.zh-notice-badge {
		display: inline-block;
		font-size: 12px; font-weight: 600; letter-spacing: 1px;
		padding: 2px 10px;
		border-radius: 4px;
		margin-bottom: 8px;
		background: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
	}
	:global(:root[data-zh-china="1"]) .zh-notice-badge {
		background: linear-gradient(135deg, var(--zh-gold), var(--zh-gold-deep));
		color: #fff;
		box-shadow: 0 2px 6px rgba(185,138,30,.25);
	}
	.zh-notice-text {
		font-size: 13px; line-height: 1.8;
		color: var(--md-sys-color-on-surface-variant);
		margin: 0;
	}
	:global(:root[data-zh-china="1"]) .zh-notice-text { color: var(--zh-ink-soft); }
	.zh-notice-link { color: var(--md-sys-color-primary); font-weight: 600; text-decoration: none; }
	:global(:root[data-zh-china="1"]) .zh-notice-link { color: var(--zh-azure); }
	.zh-notice-link:hover { text-decoration: underline; }

	/* ─── URL Tool ─────────────────────── */
	.zh-url-tool { margin-top: 16px; }
	.zh-url-tool .zh-section-head { margin-bottom: 18px; }
	.zh-url-inputs {
		display: flex; gap: 10px;
		max-width: 560px; margin: 0 auto;
	}
	.zh-input {
		flex: 1; min-width: 0;
		padding: 11px 16px;
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: 8px;
		font-family: inherit; font-size: 14px;
		background: var(--md-sys-color-surface-container-highest);
		outline: none;
		color: var(--md-sys-color-on-surface);
		transition: border-color 160ms ease-out, box-shadow 160ms ease-out;
	}
	:global(:root[data-zh-china="1"]) .zh-input { border: 1px solid var(--zh-line); background: var(--zh-paper); }
	.zh-input:focus { border-color: var(--md-sys-color-primary); }
	:global(:root[data-zh-china="1"]) .zh-input:focus {
		border-color: var(--zh-seal);
		box-shadow: 0 0 0 3px rgba(221,170,204,.14);
	}
	.zh-url-result { text-align: center; margin: 14px 0 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant); }
	.zh-url-output {
		word-break: break-all; font-family: monospace;
		background: var(--md-sys-color-surface-container-highest);
		padding: 10px 16px; border-radius: 8px; margin-top: 8px; font-size: 13px;
		color: var(--md-sys-color-on-surface);
		border: 1px dashed var(--md-sys-color-outline-variant);
	}
	:global(:root[data-zh-china="1"]) .zh-url-output { border: 1px dashed var(--zh-line); }
	.zh-url-error { color: var(--md-sys-color-error); margin-top: 8px; font-size: 13px; text-align: center; }

	/* ─── 按钮 ─────────────────────────── */
	.zh-btn {
		display: inline-flex; align-items: center; justify-content: center;
		padding: 10px 24px;
		border-radius: 10px;
		font-size: 14px; font-weight: 600; letter-spacing: .5px;
		text-decoration: none;
		cursor: pointer;
		transition: filter 160ms ease-out,
		            transform 160ms ease-out,
		            background 160ms ease-out,
		            border-color 160ms ease-out,
		            box-shadow 160ms ease-out;
		white-space: nowrap;
	}
	.zh-btn:hover { filter: brightness(1.08); }
	.zh-btn:active { transform: scale(.97); }
	.zh-btn--primary {
		background: linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary));
		color: var(--md-sys-color-on-primary);
		border: none;
		box-shadow: 0 6px 14px rgba(0,0,0,.14);
	}
	:global(:root[data-zh-china="1"]) .zh-btn--primary {
		background: var(--zh-seal);
		color: #fff;
		border: none;
		box-shadow: 0 6px 16px rgba(221,170,204,.30);
	}
	.zh-btn--outline {
		background: transparent;
		color: var(--md-sys-color-primary);
		border: 1.5px solid var(--md-sys-color-primary);
	}
	:global(:root[data-zh-china="1"]) .zh-btn--outline {
		color: var(--zh-azure);
		border: 1.5px solid var(--zh-azure);
	}
	:global(:root[data-zh-china="1"]) .zh-btn--outline:hover {
		background: rgba(29,95,168,.06);
		filter: none;
	}
	:global(:root[data-zh-china="1"]) .zh-btn:focus-visible { outline: 2px solid var(--zh-seal); outline-offset: 2px; }

	/* ─── Actions ──────────────────────── */
	.zh-actions { margin-top: 16px; text-align: center; }
	.zh-actions-row {
		display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap;
		font-size: 14px; color: var(--md-sys-color-on-surface-variant);
	}
	.zh-actions-row + .zh-actions-row { margin-top: 14px; }

	/* ─── 减少动态（无障碍） ────────────── */
	@media (prefers-reduced-motion: reduce) {
		.zh-quick-card, .zh-search-bar, .zh-input, .zh-btn, .zh-search-btn, .zh-hot-link, .zh-quick-arrow {
			transition: none !important;
		}
		.zh-quick-card:hover, .zh-quick-card:active {
			transform: none !important;
		}
		.zh-btn:active, .zh-search-btn:active { transform: none !important; }
	}

	/* ─── Responsive ───────────────────── */
	@media (max-width: 720px) {
		.zh-hero { padding: 32px 18px 26px; }
		.zh-hero-title { white-space: pre-line; max-width: 720px; }
		.zh-quick-grid { grid-template-columns: 1fr 1fr; }
		.zh-features { grid-template-columns: 1fr; }
		.zh-url-inputs { flex-direction: column; }
		.zh-intro { padding: 24px 18px; }
		.zh-actions-row .zh-btn { white-space: normal; max-width: 100%; }
	}
	@media (max-width: 440px) {
		.zh-quick-grid { grid-template-columns: 1fr; }
	}
</style>
