/**
 * 动态内容统一模块（`$lib/dynamic`）
 *
 * 结构：
 * - `core/request.ts`   全站唯一的请求出口（超时 / 竞速 / 回退 / 去重 / TTL）
 * - `core/resource.svelte.ts`  资源状态机（data 初值 = fallback）
 * - `core/Slot.svelte`  默认内容 → 覆盖的渲染槽（data-state 暴露给 CSS）
 * - `core/patch.ts`     字段 → 文字 / 属性、列表补齐、HTML sanitize
 * - `blocks/*`          每个动态区块：id + resource + mapper + fallback 的 i18n key
 *
 * 页面只组合 blocks；请求只出现在 core/request.ts。
 */

// ─── core ────────────────────────────────────────────────────────────────
export { request, probe, lookupRequest, resetRequestCache } from './core/request';
export type { Result, Success, Failure, LookupNode } from './core/request';
export { createResource } from './core/resource.svelte';
export type { Resource, ResourceState, ResourceOptions } from './core/resource.svelte';
export {
	attr,
	optionalText,
	placeholderRows,
	rowsMinHeight,
	sanitize,
	setDocumentTitle,
	text,
	MISSING
} from './core/patch';
export { default as Slot } from './core/Slot.svelte';

// ─── blocks（每页按需引入，未用到的区块不会进包） ────────────────────────
export { MIRROR_BLOCK_ID, mirrorResource } from './blocks/mirror';
export { LOOKUP_BLOCK_ID, createLookupSearch } from './blocks/lookup.svelte';
export { INFO_BLOCK_ID, createScriptInfo } from './blocks/info.svelte';
export { DOWNLOAD_BLOCK_ID, createDownloadProbe } from './blocks/download.svelte';
export { createCountdown } from './blocks/countdown.svelte';
export { SUGGESTIONS_BLOCK_ID, fetchSuggestions } from './blocks/suggestions';
