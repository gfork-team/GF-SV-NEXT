<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		radius?: string;
		class?: string;
	}

	let { width = '100%', height = '14px', radius, class: className = '' }: Props = $props();
</script>

<span
	class={`ui-skeleton${className ? ` ${className}` : ''}`}
	style={`width:${width};height:${height};${radius ? `border-radius:${radius};` : ''}`}
	aria-hidden="true"
></span>
