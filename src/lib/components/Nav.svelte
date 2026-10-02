<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { i18nConfig, t, type Lang } from '$i18n';
	import { getTheme, setTheme } from '$lib/theme.svelte';
	import SearchBar from '$components/SearchBar.svelte';
	import Icon from '$components/Icon.svelte';
	import type { IconName } from '$lib/icons';

	let { lang }: { lang: Lang } = $props();

	let menuOpen = $state(false);
	let searchOpen = $state(false);
	let themeOpen = $state(false);
	let langOpen = $state(false);
	let menuRef = $state<HTMLElement | null>(null);
	let menuBtn = $state<HTMLButtonElement | null>(null);
	let theme = $derived(getTheme());

	const navItems = $derived([
		{ href: `/${lang}`, label: t(lang, 'nav.home') },
		{ href: `/${lang}/lookup`, label: t(lang, 'nav.lookup') },
		{ href: `/${lang}/help`, label: t(lang, 'nav.help') },
		{ href: `/${lang}/about`, label: t(lang, 'nav.about') }
	]);

	const langItems = i18nConfig.supportedLangs.map((l) => ({
		lang: l,
		label: i18nConfig.langDisplayNames[l]
	}));

	const themeOptions: { value: 'light' | 'dark' | 'system'; icon: IconName }[] = [
		{ value: 'light', icon: 'sun' },
		{ value: 'dark', icon: 'moon' },
		{ value: 'system', icon: 'globe' }
	];

	const themeIcon = $derived(themeOptions.find((o) => o.value === theme)?.icon ?? 'globe');

	function isActive(href: string) {
		const path = page.url.pathname;
		return path === href || (href !== `/${lang}` && path.startsWith(href));
	}

	function switchLang(newLang: Lang) {
		langOpen = false;
		menuOpen = false;
		goto(page.url.pathname.replace(/^\/[^/]+/, `/${newLang}`));
	}

	function closeAll() {
		menuOpen = false;
		themeOpen = false;
		langOpen = false;
	}

	onMount(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			closeAll();
			if (searchOpen) searchOpen = false;
		};
		const onPointer = (e: PointerEvent) => {
			const target = e.target as HTMLElement;
			if (menuOpen && menuRef && !menuRef.contains(target) && !menuBtn?.contains(target))
				menuOpen = false;
			if (themeOpen && !(target.closest('.appbar__theme') ?? false)) themeOpen = false;
			if (langOpen && !(target.closest('.appbar__lang') ?? false)) langOpen = false;
		};
		document.addEventListener('keydown', onKey);
		document.addEventListener('pointerdown', onPointer);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('pointerdown', onPointer);
		};
	});

	$effect(() => {
		// 路由变化后收起所有浮层
		void page.url.pathname;
		closeAll();
	});
</script>

<a class="skip-link" href="#main">{t(lang, 'nav.skip_to_content')}</a>

<header class="appbar">
	<div class="appbar__row ui-container">
		<a
			class="appbar__brand"
			href="/{lang}"
			aria-label="GFork Proxy"
			data-sveltekit-preload-data="hover"
		>
			GFork<span class="appbar__brand-accent">Proxy</span>
		</a>

		<nav class="appbar__links" aria-label={t(lang, 'nav.menu')}>
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					class="appbar__link"
					class:appbar__link--active={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
					data-sveltekit-preload-data="hover"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="appbar__search">
			<SearchBar id="appbar" {lang} />
		</div>

		<div class="appbar__actions">
			<button
				type="button"
				class="ui-icon-btn appbar__search-toggle"
				aria-expanded={searchOpen}
				aria-controls="appbar-search-row"
				aria-label={t(lang, 'nav.search_open')}
				onclick={() => (searchOpen = !searchOpen)}
			>
				<Icon name={searchOpen ? 'close' : 'search'} size={22} />
			</button>

			<div class="appbar__theme">
				<button
					type="button"
					class="ui-icon-btn"
					aria-haspopup="menu"
					aria-expanded={themeOpen}
					aria-label={t(lang, 'theme.theme')}
					onclick={() => {
						themeOpen = !themeOpen;
						langOpen = false;
					}}
				>
					<Icon name={themeIcon} size={22} />
				</button>
				{#if themeOpen}
					<div class="menu" role="menu" aria-label={t(lang, 'theme.theme')}>
						{#each themeOptions as opt (opt.value)}
							<button
								type="button"
								class="menu__item"
								role="menuitemradio"
								aria-checked={theme === opt.value}
								onclick={() => {
									setTheme(opt.value);
									themeOpen = false;
								}}
							>
								<Icon name={opt.icon} size={18} />
								<span>{t(lang, `theme.${opt.value}`)}</span>
								{#if theme === opt.value}
									<Icon name="check" size={18} class="menu__check" />
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="appbar__lang">
				<button
					type="button"
					class="appbar__lang-btn"
					aria-haspopup="menu"
					aria-expanded={langOpen}
					aria-label={t(lang, 'nav.language')}
					onclick={() => {
						langOpen = !langOpen;
						themeOpen = false;
					}}
				>
					<Icon name="globe" size={20} />
					<span class="appbar__lang-code"
						>{lang === 'zh-hans'
							? '简'
							: lang === 'zh-hant'
								? '繁'
								: lang === 'en'
									? 'EN'
									: 'JA'}</span
					>
					<Icon name="chevron-down" size={16} />
				</button>
				{#if langOpen}
					<div class="menu" role="menu" aria-label={t(lang, 'nav.language')}>
						{#each langItems as item (item.lang)}
							<button
								type="button"
								class="menu__item"
								role="menuitemradio"
								aria-checked={item.lang === lang}
								onclick={() => switchLang(item.lang)}
							>
								<span>{item.label}</span>
								{#if item.lang === lang}
									<Icon name="check" size={18} class="menu__check" />
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<button
				type="button"
				class="ui-icon-btn appbar__menu-btn"
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				aria-label={t(lang, 'nav.menu')}
				bind:this={menuBtn}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<Icon name={menuOpen ? 'close' : 'list'} size={22} />
			</button>
		</div>
	</div>

	{#if searchOpen}
		<div class="appbar__search-row ui-container" id="appbar-search-row">
			<SearchBar id="appbar-mobile" {lang} />
		</div>
	{/if}

	{#if menuOpen}
		<nav class="sheet" bind:this={menuRef} aria-label={t(lang, 'nav.menu')}>
			<ul class="sheet__list">
				{#each navItems as item (item.href)}
					<li>
						<a
							href={item.href}
							class="sheet__item"
							class:sheet__item--active={isActive(item.href)}
							onclick={() => (menuOpen = false)}
						>
							{item.label}
							{#if isActive(item.href)}<Icon name="check" size={18} />{/if}
						</a>
					</li>
				{/each}
			</ul>
			<div class="sheet__divider ui-divider"></div>
			<div class="sheet__group">
				<span class="sheet__label">{t(lang, 'nav.language')}</span>
				<div class="sheet__langs">
					{#each langItems as item (item.lang)}
						<button
							type="button"
							class="ui-chip"
							class:ui-chip--selected={item.lang === lang}
							onclick={() => switchLang(item.lang)}
						>
							{item.label}
						</button>
					{/each}
				</div>
			</div>
			<div class="sheet__group">
				<span class="sheet__label">{t(lang, 'theme.theme')}</span>
				<div class="sheet__themes">
					{#each themeOptions as opt (opt.value)}
						<button
							type="button"
							class="ui-btn ui-btn--outlined ui-btn--sm"
							aria-pressed={theme === opt.value}
							onclick={() => setTheme(opt.value)}
						>
							<Icon name={opt.icon} size={16} />
							{t(lang, `theme.${opt.value}`)}
						</button>
					{/each}
				</div>
			</div>
		</nav>
	{/if}
</header>

<style>
	.appbar {
		position: sticky;
		top: 0;
		z-index: 60;
		background: var(--md-sys-color-surface);
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
	}
	.appbar__row {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 60px;
	}
	.appbar__brand {
		flex: none;
		font-size: var(--md-sys-typescale-title-medium-size);
		font-weight: 700;
		color: var(--md-sys-color-on-surface);
		letter-spacing: 0.2px;
	}
	.appbar__brand-accent {
		color: var(--md-sys-color-primary);
	}
	.appbar__links {
		display: none;
		flex: none;
		gap: 2px;
	}
	.appbar__link {
		display: inline-flex;
		align-items: center;
		height: 40px;
		padding: 0 12px;
		border-radius: var(--md-sys-shape-corner-full);
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-label-large-size);
	}
	.appbar__link:hover {
		background: var(--md-sys-color-surface-container-high);
		color: var(--md-sys-color-on-surface);
	}
	.appbar__link--active {
		background: var(--md-sys-color-secondary-container);
		color: var(--md-sys-color-on-secondary-container);
		font-weight: 500;
	}
	.appbar__search {
		display: none;
		flex: 1;
		min-width: 0;
		max-width: 420px;
		margin-left: auto;
	}
	.appbar__actions {
		display: flex;
		align-items: center;
		gap: 2px;
		margin-left: auto;
	}
	.appbar__theme,
	.appbar__lang {
		position: relative;
	}
	.appbar__lang-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		height: 40px;
		padding: 0 8px;
		background: transparent;
		color: var(--md-sys-color-on-surface-variant);
		border: none;
		border-radius: var(--md-sys-shape-corner-full);
		font-size: var(--md-sys-typescale-label-large-size);
		cursor: pointer;
	}
	.appbar__lang-btn:hover {
		background: var(--md-sys-color-surface-container-high);
		color: var(--md-sys-color-on-surface);
	}
	.appbar__lang-code {
		font-weight: 600;
	}

	.menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: 40;
		min-width: 176px;
		padding: 8px;
		background: var(--md-sys-color-surface-container-high);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
	}
	.menu__item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		min-height: 40px;
		padding: 0 12px;
		background: transparent;
		color: var(--md-sys-color-on-surface);
		border: none;
		border-radius: var(--md-sys-shape-corner-extra-small);
		font-size: var(--md-sys-typescale-body-medium-size);
		text-align: left;
		cursor: pointer;
	}
	.menu__item:hover {
		background: var(--md-sys-color-surface-container-highest);
	}
	:global(.menu__check) {
		margin-left: auto;
		color: var(--md-sys-color-primary);
	}

	.appbar__search-row {
		display: flex;
		padding-top: 4px;
		padding-bottom: 12px;
	}

	.sheet {
		position: absolute;
		left: 0;
		right: 0;
		top: 100%;
		z-index: 50;
		padding: 12px var(--md-sys-layout-side-margin) 20px;
		background: var(--md-sys-color-surface-container-low);
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
	}
	.sheet__list {
		list-style: none;
		padding: 0;
	}
	.sheet__item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 48px;
		padding: 0 12px;
		border-radius: var(--md-sys-shape-corner-full);
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-body-large-size);
	}
	.sheet__item:hover {
		background: var(--md-sys-color-surface-container-high);
		color: var(--md-sys-color-on-surface);
	}
	.sheet__item--active {
		background: var(--md-sys-color-secondary-container);
		color: var(--md-sys-color-on-secondary-container);
		font-weight: 500;
	}
	.sheet__divider {
		margin: 12px 0;
	}
	.sheet__group {
		padding: 8px 12px;
	}
	.sheet__label {
		display: block;
		margin-bottom: 8px;
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-label-medium-size);
	}
	.sheet__langs,
	.sheet__themes {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	@media (min-width: 600px) {
		.appbar__row {
			height: 64px;
		}
	}
	@media (min-width: 840px) {
		.appbar__links {
			display: flex;
		}
		.appbar__search {
			display: block;
		}
		.appbar__actions {
			margin-left: 12px;
		}
		.appbar__search-toggle,
		.appbar__menu-btn {
			display: none;
		}
		.appbar__search-row {
			display: none;
		}
		.sheet {
			display: none;
		}
	}
</style>
