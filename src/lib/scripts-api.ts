/**
 * 脚本列表数据源（首页榜单 / 列表页共用）
 *
 * 走既有 lookup 节点（primary → backup 顺序回退，签名 ss = sha256(时间戳前 8 位)
 * 截断到 config.lookupSignature.ssLength），响应可能是 base64 编码。
 *
 * 注意：节点不支持客户端指定 fields，也不返回 @match / search_site_names，
 * 因此「适用站点」只能来自详情页 DOM，列表里没有就不显示。
 */

import { siteConfig, getPrimaryLookupNodes, getBackupLookupNodes } from '$lib/config';
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

export interface ScriptListResponse {
	items: ScriptSummary[];
	total: number;
	/** 命中结果的节点 id，失败时为 undefined */
	nodeId?: string;
}

interface RawNode {
	id: string;
	endpoint: string;
	method: string;
}

export interface FetchListOptions {
	sort?: string;
	page?: number;
	perPage?: number;
	q?: string;
	site?: string;
	filterLocale?: string;
	signal?: AbortSignal;
	timeoutMs?: number;
}

async function generateSS(): Promise<string> {
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const data = new TextEncoder().encode(timestamp.substring(0, 8));
	const hash = await crypto.subtle.digest('SHA-256', data);
	const hex = Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return hex.substring(0, siteConfig.lookupSignature.ssLength);
}

async function readJson(res: Response): Promise<unknown> {
	if (res.headers.get('X-Content-Encoding') === 'base64') {
		const text = await res.text();
		const binary = atob(text);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		return JSON.parse(new TextDecoder('utf-8').decode(bytes));
	}
	return res.json();
}

/**
 * 统计字段保留「缺失」语义：接口没给就给 null，不要补 0。
 * 补 0 会把「无数据」谎报成「真的是 0」，StatBar 也就没法隐藏该指标。
 * 展示层的约定见 $lib/format。
 */
type StatField =
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

function normalize(item: Record<string, unknown>): ScriptSummary {
	return {
		id: Number(item.id) || 0,
		name: String(item.name ?? ''),
		description: String(item.description ?? ''),
		daily_installs: statOrNull(item, 'daily_installs'),
		total_installs: statOrNull(item, 'total_installs'),
		good_ratings: statOrNull(item, 'good_ratings'),
		ok_ratings: statOrNull(item, 'ok_ratings'),
		bad_ratings: statOrNull(item, 'bad_ratings'),
		fan_score: statOrNull(item, 'fan_score'),
		created_at: String(item.created_at ?? ''),
		code_updated_at: String(item.code_updated_at ?? ''),
		code_url: String(item.code_url ?? ''),
		users: Array.isArray(item.users) ? (item.users as ScriptAuthor[]) : undefined,
		url: item.url ? String(item.url) : undefined,
		namespace: item.namespace ? String(item.namespace) : undefined,
		license: item.license ? String(item.license) : undefined,
		version: item.version ? String(item.version) : undefined,
		locale: item.locale ? String(item.locale) : undefined,
		deleted: item.deleted === true,
		code_size: Number(item.code_size) || undefined
	};
}

async function fetchNode(
	node: RawNode,
	body: URLSearchParams,
	signal: AbortSignal,
	timeoutMs: number
): Promise<ScriptListResponse> {
	const controller = new AbortController();
	const onAbort = () => controller.abort();
	signal.addEventListener('abort', onAbort, { once: true });
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const ss = await generateSS();
		const url = `${node.endpoint}/${ss}`;
		const res =
			node.method === 'POST'
				? await fetch(url, {
						method: 'POST',
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/x-www-form-urlencoded'
						},
						body: body.toString(),
						mode: 'cors',
						signal: controller.signal
					})
				: await fetch(`${url}?${body.toString()}`, {
						method: 'GET',
						headers: { Accept: 'application/json' },
						mode: 'cors',
						signal: controller.signal
					});

		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json = (await readJson(res)) as {
			query?: Record<string, unknown>[];
			execute?: Record<string, unknown>[];
			total?: number;
		};
		const raw = json.query ?? json.execute ?? [];
		return {
			items: raw.map(normalize),
			total: Number(json.total) || raw.length,
			nodeId: node.id
		};
	} finally {
		clearTimeout(timer);
		signal.removeEventListener('abort', onAbort);
	}
}

/** 顺序回退拉取列表：primary → backup，第一个成功的节点胜出。 */
export async function fetchScriptList(options: FetchListOptions = {}): Promise<ScriptListResponse> {
	const {
		sort = 'daily_installs',
		page = 1,
		perPage = 12,
		q = '',
		site = '',
		filterLocale = '0',
		signal,
		timeoutMs = 12000
	} = options;

	const body = new URLSearchParams();
	body.set('sort', sort);
	body.set('page', String(page));
	body.set('per_page', String(perPage));
	if (q) body.set('q', q);
	if (site) body.set('site', site);
	body.set('filter_locale', filterLocale);

	const nodes: RawNode[] = [...getPrimaryLookupNodes(), ...getBackupLookupNodes()];
	const ac = new AbortController();
	const onAbort = () => ac.abort();
	signal?.addEventListener('abort', onAbort, { once: true });

	try {
		let lastError: unknown = null;
		for (const node of nodes) {
			if (ac.signal.aborted) throw new DOMException('Aborted', 'AbortError');
			try {
				return await fetchNode(node, body, ac.signal, timeoutMs);
			} catch (e) {
				lastError = e;
			}
		}
		throw lastError instanceof Error ? lastError : new Error('all lookup nodes failed');
	} finally {
		signal?.removeEventListener('abort', onAbort);
	}
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

/**
 * 安装链接：走本站 /l 中转（自动选最快节点 + 保留 .user.js 后缀，
 * 脚本管理器才会识别为安装）。没有 code_url 时返回 null，调用方隐藏按钮。
 */
export function installHref(lang: Lang, script: ScriptSummary): string | null {
	if (!script.code_url) return null;
	const path = script.code_url.replace('https://update.greasyfork.org/scripts/', '');
	if (!path) return null;
	return `/${lang}/l#/${path}`;
}
