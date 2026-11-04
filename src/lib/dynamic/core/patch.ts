/**
 * 字段 → 文字 / 属性的映射，以及三类特殊处理：
 *
 * 1. 列表：构建期用同一行模板渲染固定数量的占位行，ready 后按真实数量增减；
 *    行高由 CSS 的 `--dyn-row-h` 固定，行数变少时容器 min-height 撑住版面。
 * 2. HTML 片段：统一经 sanitize 后再注入（info 页的 4 个远端片段）。
 * 3. 属性（href / src / title）：与文字走同一套覆盖逻辑，缺值保留构建期默认值。
 *
 * 这里只放纯函数，不碰响应式状态、不发请求。
 */

import DOMPurify, { type Config } from 'dompurify';

/** 接口字段可能出现的形态 */
export type PatchValue = string | number | null | undefined;

/** 缺失标记：与 `$lib/format` 的约定一致（缺字段不编造 0） */
export const MISSING = '—';

/**
 * 单字段文字：API 缺值 → 回落到构建期默认文案，而不是显示空白。
 * `fallback` 一律来自区块的 i18n key，保证冷加载与失败态都可读。
 */
export function text(value: PatchValue, fallback: string): string {
	if (value == null) return fallback;
	const s = String(value).trim();
	return s === '' ? fallback : s;
}

/** 可选文字：缺值返回空串，交给模板决定整块显示与否 */
export function optionalText(value: PatchValue): string {
	if (value == null) return '';
	return String(value).trim();
}

/**
 * 属性覆盖：缺值返回 undefined —— 模板里 `href={undefined}` 会保留元素本身，
 * 不会渲染成字面量 "undefined"。
 */
export function attr(value: PatchValue): string | undefined {
	if (value == null) return undefined;
	const s = String(value).trim();
	return s === '' ? undefined : s;
}

/** 占位行：同一行模板重复 count 次（构建期写进 HTML 的默认列表内容） */
export function placeholderRows<T>(count: number, row: T): T[] {
	return Array.from({ length: Math.max(0, count) }, () => row);
}

/** 真实行数可能少于占位行数：用最小高度撑住，避免整页跳动 */
export function rowsMinHeight(rows: number, rowHeightPx: number): string {
	return `${Math.max(0, rows) * rowHeightPx}px`;
}

// ─── HTML 片段 ───────────────────────────────────────────────────────────

/**
 * 白名单与 info 页实际会出现的 Greasy Fork 富文本对齐：
 * 保留描述性标签与图片，禁止一切可执行 / 可提交 / 可嵌入的标签，
 * 属性里去掉 style 与事件处理器（DOMPurify 默认已剥事件）。
 */
const PURIFY_CONFIG: Config = {
	ALLOWED_TAGS: [
		'a',
		'abbr',
		'b',
		'blockquote',
		'br',
		'caption',
		'cite',
		'code',
		'col',
		'colgroup',
		'dd',
		'del',
		'details',
		'div',
		'dl',
		'dt',
		'em',
		'figcaption',
		'figure',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'hr',
		'i',
		'img',
		'ins',
		'kbd',
		'li',
		'mark',
		'ol',
		'p',
		'pre',
		'q',
		's',
		'samp',
		'small',
		'span',
		'strong',
		'sub',
		'summary',
		'sup',
		'table',
		'tbody',
		'td',
		'tfoot',
		'th',
		'thead',
		'tr',
		'u',
		'ul',
		'var'
	],
	ALLOWED_ATTR: [
		'alt',
		'class',
		'cite',
		'colspan',
		'datetime',
		'dir',
		'height',
		'href',
		'id',
		'lang',
		'rel',
		'rowspan',
		'src',
		'target',
		'title',
		'width'
	],
	FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link'],
	FORBID_ATTR: ['style', 'srcset', 'formaction', 'ping', 'onerror', 'onload'],
	ALLOW_DATA_ATTR: true,
	ALLOW_UNKNOWN_PROTOCOLS: false
};

/**
 * HTML 片段消毒。注入前必须过这里：
 * - 浏览器内返回白名单过滤后的 HTML；
 * - SSR / prerender 阶段（DOMPurify 无 DOM 支持）直接返回空串，
 *   于是构建期只会渲染区块自己的默认骨架，不会把远端 HTML 写进静态产物。
 */
export function sanitize(html: PatchValue): string {
	if (html == null) return '';
	const raw = String(html);
	if (raw.trim() === '') return '';
	if (typeof window === 'undefined' || !DOMPurify.isSupported) return '';
	return String(DOMPurify.sanitize(raw, PURIFY_CONFIG));
}

/** 文档标题覆盖（详情页 / 反馈页用）；SSR 阶段是空操作 */
export function setDocumentTitle(title: string): void {
	if (typeof document === 'undefined') return;
	if (title) document.title = title;
}
