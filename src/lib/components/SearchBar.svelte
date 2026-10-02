<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { t, i18nConfig, type Lang } from '$i18n';
	import { fetchScriptSuggestions, type ScriptSuggestion } from '$lib/lookup-api';
	import { formatCount } from '$lib/format';
	import Icon from '$components/Icon.svelte';

	interface Props {
		lang: Lang;
		/** 大号（首页 hero）/ 常规（顶栏） */
		size?: 'md' | 'lg';
		placeholder?: string;
		initialQuery?: string;
		autofocus?: boolean;
		/** 同页可能有多个搜索框，用它区分 listbox 的 id */
		id?: string;
		/** 提交时附加到查询串的额外参数（如 site） */
		params?: Record<string, string>;
		/** 自定义提交（列表页自己改 hash 并就地搜索时用；给了就不跳转） */
		onsearch?: (query: string) => void;
	}

	let {
		lang,
		size = 'md',
		placeholder,
		initialQuery = '',
		autofocus = false,
		id = 'searchbar',
		params = {},
		onsearch
	}: Props = $props();

	let value = $state(untrack(() => initialQuery));
	let appliedInitial = $state(untrack(() => initialQuery));
	let suggestions = $state<ScriptSuggestion[]>([]);
	let open = $state(false);
	let active = $state(-1);
	let loading = $state(false);
	let root = $state<HTMLElement | null>(null);
	let input = $state<HTMLInputElement | null>(null);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let abort: AbortController | null = null;

	const listId = $derived(`${id}-listbox`);

	/*
	 * 父级可能在不重挂载组件的情况下改写查询词（hashchange / popstate / 面包屑），
	 * 只在 incoming 与已应用值确实不同时才覆盖，避免抹掉用户正在输入的内容。
	 */
	$effect(() => {
		const incoming = initialQuery;
		untrack(() => {
			if (incoming === appliedInitial) return;
			appliedInitial = incoming;
			value = incoming;
			active = -1;
			if (incoming.trim().length < 2) {
				suggestions = [];
				open = false;
				loading = false;
			}
		});
	});

	function detailHref(scriptId: number): string {
		const locale = i18nConfig.langNames[lang];
		return `/${lang}/info#/${locale}/scripts/${scriptId}/detail`;
	}

	function submit(q: string) {
		const query = q.trim();
		if (!query) return;
		open = false;
		if (onsearch) {
			onsearch(query);
			return;
		}
		// 函数内一次性用完的临时对象，不进 $state，无需 SvelteURLSearchParams
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const search = new URLSearchParams({ q: query });
		for (const [key, value] of Object.entries(params)) {
			const v = value.trim();
			if (v) search.set(key, v);
		}
		goto(`/${lang}/lookup#?${search.toString()}`);
	}

	function openScript(id: number) {
		open = false;
		goto(detailHref(id));
	}

	function onInput() {
		const q = value.trim();
		active = -1;
		clearTimeout(debounceTimer);
		abort?.abort();
		if (q.length < 2) {
			suggestions = [];
			open = false;
			loading = false;
			return;
		}
		loading = true;
		debounceTimer = setTimeout(async () => {
			const controller = new AbortController();
			abort = controller;
			const list = await fetchScriptSuggestions(q, controller.signal, 8);
			if (controller.signal.aborted) return;
			loading = false;
			suggestions = list ?? [];
			open = suggestions.length > 0;
		}, 300);
	}

	function clear() {
		value = '';
		suggestions = [];
		open = false;
		active = -1;
		abort?.abort();
		loading = false;
		input?.focus();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (suggestions.length) {
				active = (active + 1) % suggestions.length;
				open = true;
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (suggestions.length) active = (active - 1 + suggestions.length) % suggestions.length;
		} else if (e.key === 'Enter') {
			if (open && active >= 0 && suggestions[active]) {
				e.preventDefault();
				openScript(suggestions[active].id);
			} else {
				submit(value);
			}
		} else if (e.key === 'Escape') {
			if (open) {
				open = false;
			} else {
				value = '';
			}
		}
	}

	function onPointerDown(e: PointerEvent) {
		if (!open || !root) return;
		if (!root.contains(e.target as Node)) open = false;
	}

	function focusOnMount(node: HTMLInputElement, enabled: boolean) {
		if (!enabled) return;
		const id = requestAnimationFrame(() => node.focus());
		return { destroy: () => cancelAnimationFrame(id) };
	}
</script>

<svelte:window onpointerdown={onPointerDown} />

<div class="searchbar searchbar--{size}" bind:this={root}>
	<form
		class="searchbar__box"
		role="search"
		id={`${id}-form`}
		onsubmit={(e) => {
			e.preventDefault();
			submit(value);
		}}
	>
		<span class="searchbar__lead" aria-hidden="true">
			<Icon name="search" size={20} />
		</span>

		<input
			bind:this={input}
			bind:value
			type="search"
			id={`${id}-input`}
			role="combobox"
			aria-expanded={open}
			aria-controls={listId}
			aria-autocomplete="list"
			aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
			aria-label={t(lang, 'home.search_placeholder')}
			placeholder={placeholder ?? t(lang, 'home.search_placeholder')}
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
			use:focusOnMount={autofocus}
			oninput={onInput}
			onkeydown={onKeydown}
			onfocus={() => (open = suggestions.length > 0)}
		/>

		{#if loading}
			<span class="searchbar__spin" aria-hidden="true">
				<Icon name="refresh" size={18} />
			</span>
		{:else if value}
			<button type="button" class="ui-icon-btn searchbar__clear" onclick={clear}>
				<Icon name="close" size={18} />
				<span class="visually-hidden">{t(lang, 'home.search_clear')}</span>
			</button>
		{/if}

		<button type="submit" class="ui-btn ui-btn--filled searchbar__go">
			<Icon name="search" size={18} />
			<span>{t(lang, 'home.search_action')}</span>
		</button>
	</form>

	{#if open}
		<ul
			class="searchbar__list"
			id={listId}
			role="listbox"
			aria-label={t(lang, 'home.search_placeholder')}
		>
			{#each suggestions as s, i (s.id)}
				<li
					id="{listId}-{i}"
					role="option"
					aria-selected={i === active}
					class:active={i === active}
				>
					<button type="button" class="searchbar__opt" onclick={() => openScript(s.id)}>
						<span class="searchbar__opt-name">{s.name}</span>
						{#if s.installs != null}
							<span class="searchbar__opt-meta">
								<Icon name="install" size={14} />
								{formatCount(s.installs, lang)}
							</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.searchbar {
		position: relative;
		width: 100%;
	}
	.searchbar__box {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 4px 4px 12px;
		background: var(--md-sys-color-surface-container-highest);
		border: 1px solid transparent;
		border-radius: var(--md-sys-shape-corner-full);
		transition: border-color var(--md-sys-motion-duration-short)
			var(--md-sys-motion-easing-standard);
	}
	.searchbar__box:focus-within {
		border-color: var(--md-sys-color-primary);
	}
	.searchbar__lead {
		display: flex;
		color: var(--md-sys-color-on-surface-variant);
	}
	.searchbar input {
		flex: 1;
		min-width: 0;
		min-height: 44px;
		padding: 0 8px;
		background: transparent;
		border: none;
		outline: none;
		color: var(--md-sys-color-on-surface);
		font-size: var(--md-sys-typescale-body-large-size);
	}
	.searchbar input::placeholder {
		color: var(--md-sys-color-on-surface-variant);
	}
	.searchbar input::-webkit-search-cancel-button {
		display: none;
	}
	.searchbar__clear {
		flex: none;
	}
	.searchbar__spin {
		display: flex;
		color: var(--md-sys-color-on-surface-variant);
		animation: spin 1s linear infinite;
	}
	.searchbar__go {
		flex: none;
	}

	.searchbar--lg .searchbar__box {
		padding: 6px 6px 6px 20px;
	}
	.searchbar--lg input {
		min-height: 52px;
		font-size: var(--md-sys-typescale-title-medium-size);
	}
	.searchbar--lg .searchbar__go {
		min-height: 52px;
		padding: 0 28px;
	}
	@media (max-width: 599px) {
		.searchbar__go span {
			display: none;
		}
		.searchbar__go {
			width: 48px;
			padding: 0;
		}
	}

	.searchbar__list {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		z-index: 40;
		max-height: 60vh;
		overflow-y: auto;
		padding: 8px;
		background: var(--md-sys-color-surface-container-high);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-medium);
		list-style: none;
	}
	.searchbar__opt {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		min-height: 44px;
		padding: 6px 12px;
		background: transparent;
		color: var(--md-sys-color-on-surface);
		border: none;
		border-radius: var(--md-sys-shape-corner-small);
		font-size: var(--md-sys-typescale-body-medium-size);
		text-align: left;
		cursor: pointer;
	}
	li.active .searchbar__opt {
		background: var(--md-sys-color-secondary-container);
	}
	.searchbar__opt-name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.searchbar__opt-meta {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		flex: none;
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-label-medium-size);
		font-variant-numeric: tabular-nums;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.searchbar__spin {
			animation: none;
		}
	}
</style>
