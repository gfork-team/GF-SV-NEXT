<script lang="ts">
	import { t, type Lang } from '$i18n';
	import { showSnackbar, openInstallGuide } from '$lib/ui-state.svelte';
	import Icon from '$components/Icon.svelte';

	interface Props {
		lang: Lang;
		/** 本站中转安装链接：/{lang}/l#/{id}/{name}.user.js（保留 .user.js 后缀） */
		installHref: string;
		/** Greasy Fork 源站页面（有则菜单里给「打开源站」） */
		sourceUrl?: string | null;
		scriptName?: string;
		size?: 'sm' | 'md' | 'lg';
		/** 移动端底部固定栏用大号 */
		block?: boolean;
	}

	let {
		lang,
		installHref,
		sourceUrl = null,
		scriptName = '',
		size = 'md',
		block = false
	}: Props = $props();

	let menuOpen = $state(false);
	let root = $state<HTMLElement | null>(null);

	const label = $derived(
		scriptName ? `${t(lang, 'install.label')} ${scriptName}` : t(lang, 'install.label')
	);

	function onDocumentPointerDown(e: PointerEvent) {
		if (!menuOpen || !root) return;
		if (!root.contains(e.target as Node)) menuOpen = false;
	}

	function afterInstall() {
		// 不做任何脚本管理器检测，只提示 + 给教程入口
		showSnackbar(
			`${t(lang, 'install.started', { name: scriptName })} · ${t(lang, 'install.not_popped')}`,
			{
				label: t(lang, 'install.guide'),
				onAction: () => openInstallGuide({ scriptName, installHref })
			},
			7000
		);
	}

	async function copyLink() {
		menuOpen = false;
		const absolute = new URL(installHref, window.location.origin).href;
		try {
			await navigator.clipboard.writeText(absolute);
			showSnackbar(t(lang, 'install.copied'));
		} catch {
			showSnackbar(t(lang, 'install.copy_failed'));
		}
	}

	function openGuide() {
		menuOpen = false;
		openInstallGuide({ scriptName, installHref });
	}
</script>

<svelte:window
	onpointerdown={onDocumentPointerDown}
	onkeydown={(e) => e.key === 'Escape' && (menuOpen = false)}
/>

<div class="install" class:install--block={block} bind:this={root}>
	<a
		class="ui-btn ui-btn--filled {size === 'sm' ? 'ui-btn--sm' : size === 'lg' ? 'ui-btn--lg' : ''}"
		href={installHref}
		data-sveltekit-noscroll
		onclick={afterInstall}
	>
		<Icon name="install" size={18} />
		<span>{t(lang, 'install.label')}</span>
	</a>

	<button
		type="button"
		class="ui-icon-btn install__menu-btn {size === 'sm' ? 'ui-icon-btn--sm' : ''}"
		style="--_h:{size === 'sm' ? '32px' : size === 'lg' ? '48px' : '40px'};"
		aria-haspopup="menu"
		aria-expanded={menuOpen}
		aria-label={t(lang, 'install.more')}
		onclick={() => (menuOpen = !menuOpen)}
	>
		<Icon name="more-vert" size={18} />
	</button>

	{#if menuOpen}
		<div class="menu" role="menu" aria-label={t(lang, 'install.more')}>
			<button type="button" class="menu__item" role="menuitem" onclick={copyLink}>
				<Icon name="link" size={18} />
				<span>{t(lang, 'install.menu_copy')}</span>
			</button>
			{#if sourceUrl}
				<a
					class="menu__item"
					role="menuitem"
					href={sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Icon name="external" size={18} />
					<span>{t(lang, 'install.menu_source')}</span>
				</a>
			{/if}
			<button type="button" class="menu__item" role="menuitem" onclick={openGuide}>
				<Icon name="help-circle" size={18} />
				<span>{t(lang, 'install.menu_help')}</span>
			</button>
		</div>
	{/if}

	<span class="visually-hidden">{label}</span>
</div>

<style>
	.install {
		position: relative;
		display: inline-flex;
		align-items: stretch;
	}
	.install--block {
		display: flex;
		width: 100%;
	}
	.install--block > :global(a) {
		flex: 1;
	}
	.install__menu-btn {
		height: var(--_h, 40px);
		margin-left: 2px;
		background: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
	}
	.install__menu-btn:hover {
		background: var(--md-sys-color-secondary);
		color: var(--md-sys-color-on-secondary);
	}

	.menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: 30;
		min-width: 200px;
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
		text-decoration: none;
		cursor: pointer;
	}
	.menu__item:hover {
		background: var(--md-sys-color-surface-container-highest);
		color: var(--md-sys-color-primary);
	}
</style>
