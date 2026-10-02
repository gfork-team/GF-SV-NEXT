<script lang="ts">
	import type { IconName } from '$lib/icons';
	import Icon from '$components/Icon.svelte';

	export interface SegmentedOption {
		value: string;
		label: string;
		icon?: IconName;
	}

	interface Props {
		options: SegmentedOption[];
		value: string;
		label: string;
		onchange: (value: string) => void;
	}

	let { options, value, label, onchange }: Props = $props();
</script>

<div class="ui-segmented" role="tablist" aria-label={label}>
	{#each options as opt (opt.value)}
		<button
			type="button"
			class="ui-segmented__item"
			role="tab"
			aria-selected={opt.value === value}
			tabindex={opt.value === value ? 0 : -1}
			onclick={() => onchange(opt.value)}
			onkeydown={(e) => {
				const i = options.findIndex((o) => o.value === value);
				if (e.key === 'ArrowRight') onchange(options[(i + 1) % options.length].value);
				if (e.key === 'ArrowLeft')
					onchange(options[(i - 1 + options.length) % options.length].value);
			}}
		>
			{#if opt.icon}<Icon name={opt.icon} size={18} />{/if}
			<span>{opt.label}</span>
		</button>
	{/each}
</div>
