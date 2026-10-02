<script lang="ts">
	import { ICONS, type IconName } from '$lib/icons';

	interface Props {
		name: IconName;
		size?: number | string;
		class?: string;
		label?: string;
	}

	let { name, size = 20, class: className = '', label }: Props = $props();
</script>

<svg
	class={className}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden={label ? undefined : 'true'}
	role={label ? 'img' : undefined}
	aria-label={label}
	focusable="false"
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- 实为本文件内 ICONS 常量表里的静态 SVG path，无外部输入 -->
	{@html ICONS[name] ?? ''}
</svg>

<style>
	svg {
		display: block;
		flex: none;
	}
</style>
