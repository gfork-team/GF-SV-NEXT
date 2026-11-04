<script lang="ts">
	import { i18nConfig, type Lang } from '$i18n';
	import ScriptInfoBlock from '$lib/dynamic/blocks/ScriptInfoBlock.svelte';
	import type { PageData } from './$types';

	/*
	 * 详情 / 反馈 / 作者三种 hash 路由、取数、sanitize 与链接改写全在区块里，
	 * 页面只负责组合。构建期这里只有骨架 + 默认文案。
	 */
	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);
	let locale: string = $derived(i18nConfig.langNames[lang]);
</script>

<ScriptInfoBlock {lang} {locale} />
