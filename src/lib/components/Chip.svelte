<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** 选中态（用于筛选 chips） */
		selected?: boolean;
		/** 传入 href 渲染为链接，否则渲染为按钮 */
		href?: string;
		/** 站点标签用胶囊形态 */
		site?: boolean;
		title?: string;
		class?: string;
		size?: 'sm' | 'md';
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
	}

	let {
		selected = false,
		href,
		site = false,
		title,
		class: className = '',
		size = 'md',
		onclick,
		children
	}: Props = $props();

	const cls = $derived(
		`ui-chip${size === 'sm' ? ' ui-chip--sm' : ''}${selected ? ' ui-chip--selected' : ''}${site ? ' ui-chip--site' : ''}${className ? ` ${className}` : ''}`
	);
</script>

{#if href}
	<a class={cls} {href} {title}>{@render children?.()}</a>
{:else}
	<button type="button" class={cls} {title} aria-pressed={selected} {onclick}>
		{@render children?.()}
	</button>
{/if}
