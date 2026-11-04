/**
 * 脚本数据模型与链接规则（纯函数，不发请求）
 *
 * 请求在 `$lib/dynamic/` 里：本文件只保留类型、字段归一化与 href 规则，
 * 这样组件（ScriptCard / StatBar）不必依赖任何请求代码。
 *
 * 注意：lookup 节点不支持客户端指定 fields，也不返回 @match / search_site_names，
 * 因此「适用站点」只能来自详情页 DOM，列表里没有就不显示。
 */

import { i18nConfig, type Lang } from '$i18n';

export interface ScriptAuthor {
	id: number;
	name: string;
	created_at?: string;
	url?: string;
}

export interface ScriptSummary {
	id: number;
	name: string;
	description: string;
	daily_installs: number | null;
	total_installs: number | null;
	good_ratings: number | null;
	ok_ratings: number | null;
	bad_ratings: number | null;
	fan_score: number | null;
	created_at: string;
	code_updated_at: string;
	code_url: string;
	users?: ScriptAuthor[];
	url?: string;
	namespace?: string;
	license?: string;
	version?: string;
	locale?: string;
	deleted?: boolean;
	code_size?: number;
}

/**
 * 统计字段保留「缺失」语义：接口没给就给 null，不要补 0。
 * 补 0 会把「无数据」谎报成「真的是 0」，StatBar 也就没法隐藏该指标。
 */
export type StatField =
	| 'daily_installs'
	| 'total_installs'
	| 'good_ratings'
	| 'ok_ratings'
	| 'bad_ratings'
	| 'fan_score';

function statOrNull(item: Record<string, unknown>, key: StatField): number | null {
	const raw = item[key];
	if (raw == null || raw === '') return null;
	const n = Number(raw);
	return Number.isFinite(n) ? n : null;
}

function strOrEmpty(value: unknown): string {
	return value == null ? '' : String(value);
}

/**
 * 列表接口的响应信封，两种形态都要认：
 *
 * - 新版（当前节点线上返回）：**裸数组** `[{ …script }, …]`
 * - 旧版：`{ query?: [...], execute?: [...], total, options: { per_page } }`
 *
 * 还有一类特殊响应：`{ redirect: true, target_url, message }`，
 * 服务端要求离开本站（旧版才有，新版没有）。
 */
export interface ScriptListPage {
	items: unknown[];
	/** 每页条数：旧版读 options.per_page，新版裸数组没有该字段，用本次返回条数推断 */
	perPage: number;
	/** 服务端要求跳转时才有 */
	redirect?: { url: string; message: string };
}

/** 把列表响应统一成 `{ items, perPage, redirect }`，两种信封都支持 */
export function readScriptList(json: unknown, requestedPerPage = 0): ScriptListPage {
	// 新版：直接是数组。裸数组没有分页元信息，用「自己请求的每页条数」，
	// 调用方没给才退化成「本次返回条数」（仅够单页展示用）。
	if (Array.isArray(json)) {
		return { items: json, perPage: requestedPerPage || json.length };
	}

	const data = (json ?? {}) as {
		query?: unknown;
		execute?: unknown;
		options?: { per_page?: unknown };
		redirect?: unknown;
		target_url?: unknown;
		message?: unknown;
	};

	const list = data.query ?? data.execute;
	const items = Array.isArray(list) ? list : [];

	const redirect =
		data.redirect === true && typeof data.target_url === 'string'
			? {
					url: data.target_url,
					message: typeof data.message === 'string' ? data.message : ''
				}
			: undefined;

	const perPage = Number(data.options?.per_page) || requestedPerPage || items.length;

	return { items, perPage, redirect };
}

/** API 原始条目 → 视图模型（缺字段留空 / null，不编造数值） */
export function normalizeScript(item: unknown): ScriptSummary {
	const raw = (item ?? {}) as Record<string, unknown>;
	return {
		id: Number(raw.id) || 0,
		name: strOrEmpty(raw.name),
		description: strOrEmpty(raw.description),
		daily_installs: statOrNull(raw, 'daily_installs'),
		total_installs: statOrNull(raw, 'total_installs'),
		good_ratings: statOrNull(raw, 'good_ratings'),
		ok_ratings: statOrNull(raw, 'ok_ratings'),
		bad_ratings: statOrNull(raw, 'bad_ratings'),
		fan_score: statOrNull(raw, 'fan_score'),
		created_at: strOrEmpty(raw.created_at),
		code_updated_at: strOrEmpty(raw.code_updated_at),
		code_url: strOrEmpty(raw.code_url),
		users: Array.isArray(raw.users) ? (raw.users as ScriptAuthor[]) : undefined,
		url: raw.url ? String(raw.url) : undefined,
		namespace: raw.namespace ? String(raw.namespace) : undefined,
		license: raw.license ? String(raw.license) : undefined,
		version: raw.version ? String(raw.version) : undefined,
		locale: raw.locale ? String(raw.locale) : undefined,
		deleted: raw.deleted === true,
		code_size: Number(raw.code_size) || undefined
	};
}

/** 详情页 hash 路由 */
export function detailHref(lang: Lang, script: ScriptSummary): string {
	const locale = i18nConfig.langNames[lang];
	return `/${lang}/info#/${locale}/scripts/${script.id}/detail`;
}

/** 作者页 hash 路由 */
export function authorHref(lang: Lang, script: ScriptSummary): string | null {
	const userId = script.users?.[0]?.id;
	if (!userId) return null;
	const locale = i18nConfig.langNames[lang];
	return `/${lang}/info#/${locale}/users/${userId}`;
}

/** code_url → 本站 /l 中转路径（保留 .user.js 后缀，脚本管理器才会识别为安装） */
export function installPathFromCodeUrl(codeUrl: string | null | undefined): string | null {
	if (!codeUrl) return null;
	const path = codeUrl.replace('https://update.greasyfork.org/scripts/', '');
	return path || null;
}

/**
 * 安装链接：走本站 /l 中转（自动选最快节点 + 保留 .user.js 后缀，
 * 脚本管理器才会识别为安装）。没有 code_url 时返回 null，调用方隐藏按钮。
 */
export function installHref(lang: Lang, script: ScriptSummary): string | null {
	const path = installPathFromCodeUrl(script.code_url);
	return path ? `/${lang}/l#/${path}` : null;
}
