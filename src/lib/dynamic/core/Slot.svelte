<script lang="ts" generics="T">
	/**
	 * 动态内容槽：渲染默认内容，ready 后覆盖。
	 *
	 * 关键约定：
	 * - 这里 **不** 用 `{#if loading}` 换掉整棵子树 —— 子树结构在构建期就固定，
	 *   `data` 变了只改文字 / 属性，因此不产生布局跳动。
	 * - 请求由 `$effect` 在浏览器里触发；prerender / SSR 不执行 effect，不发请求。
	 * - 状态通过 `data-state="idle|loading|ready|error"` 暴露给 CSS。
	 * - 包裹元素是 `display: contents`（见 app.css 的静态默认层），不生成盒子，
	 *   对 grid / flex 子项没有影响。
	 */
	import { untrack, type Snippet } from 'svelte';
	import type { Resource } from './resource.svelte';

	interface Props {
		resource: Resource<T>;
		children: Snippet<[T]>;
	}

	let { resource, children }: Props = $props();

	$effect(() => {
		// 依赖 resource 身份：区块换了 resource（例如 hash 路由变化）也会重新取数
		const current = resource;
		untrack(() => current.load());
	});
</script>

<div class="dyn-slot" data-block={resource.id} data-state={resource.state}>
	{@render children(resource.data)}
</div>
