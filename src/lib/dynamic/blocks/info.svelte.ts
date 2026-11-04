/**
 * 区块 script-info · 类型 text + html（详情 / 反馈 / 作者三种 hash 路由）
 *
 * hash 页面（`#/zh-CN/scripts/123/detail`）的真实数据无法预构建：
 * 构建期只产出骨架 + 字段级默认文案，水合后读 `window.location.hash` 取数，
 * 并监听 `hashchange` / `popstate`。
 *
 * HTML 片段（c1/c2/c3、反馈列表）一律经 `core/patch.sanitize` 消毒后再注入，
 * 页面容器结构保持不变，只是内容被覆盖。
 */

import { dynamicConfig, siteConfig } from '$config';
import { t, type Lang } from '$i18n';
import { installPathFromCodeUrl, normalizeScript, type ScriptSummary } from '$lib/scripts';
import { showSnackbar } from '$lib/ui-state.svelte';
import { createResource, type Resource } from '../core/resource.svelte';
import { request } from '../core/request';
import { optionalText, sanitize } from '../core/patch';

export const INFO_BLOCK_ID = 'script-info';

export type InfoPageType = 'detail' | 'feedback' | 'redirect' | 'users';

export interface InfoRoute {
	locale: string;
	scriptId: string | null;
	userId: string | null;
	pageType: InfoPageType;
	fullPath: string;
}

export interface GithubIdentity {
	name: string;
	url?: string;
}

export interface DetailView {
	title: string;
	header: string;
	meta: string;
	additional: string;
	install: string;
	installPath: string;
}

export interface FeedbackView {
	title: string;
	list: string;
	page: number;
	totalPages: number;
}

export interface UserView {
	name: string;
	bio: string;
	github: GithubIdentity[];
	scripts: ScriptSummary[];
	totalInstalls: number | null;
	goodRatings: number | null;
	okRatings: number | null;
	badRatings: number | null;
}

// ─── 默认内容（构建期写进 HTML 的空值，视图按字段回落 i18n） ──────────────

export function emptyDetail(): DetailView {
	return { title: '', header: '', meta: '', additional: '', install: '', installPath: '' };
}

export function emptyFeedback(): FeedbackView {
	return { title: '', list: '', page: 1, totalPages: 1 };
}

export function emptyUser(): UserView {
	return {
		name: '',
		bio: '',
		github: [],
		scripts: [],
		totalInstalls: null,
		goodRatings: null,
		okRatings: null,
		badRatings: null
	};
}

// ─── 基础工具 ─────────────────────────────────────────────────────────────

function decodeBase64(input: string | undefined): string {
	if (!input) return '';
	try {
		const raw = atob(input);
		const bytes = new Uint8Array(raw.length);
		for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
		return new TextDecoder('utf-8').decode(bytes);
	} catch {
		return input;
	}
}

function infoUrl(path: string): string {
	return `${siteConfig.infoApi.primary}${path}`;
}

/** 空闲资源：不发请求，只提供 fallback（用于路由未解析时的默认内容） */
function idle<T>(key: string, fallback: T): Resource<T> {
	return createResource<T>({
		key,
		fallback,
		ttlSec: 0,
		fetcher: async () => ({ ok: true, data: fallback })
	});
}

// ─── mapper：API 原始 JSON → 视图数据 ─────────────────────────────────────

function toDetail(json: unknown): DetailView {
	const raw = (json ?? {}) as {
		title?: string;
		c1?: string;
		c2?: string;
		c3?: string;
		install?: string;
	};
	const install = optionalText(raw.install);
	return {
		title: optionalText(raw.title),
		header: sanitize(decodeBase64(raw.c1)),
		meta: sanitize(decodeBase64(raw.c2)),
		additional: sanitize(decodeBase64(raw.c3)),
		install,
		installPath: installPathFromCodeUrl(install) ?? ''
	};
}

function toFeedback(json: unknown): FeedbackView {
	const raw = (json ?? {}) as {
		title?: string;
		c1?: string;
		page?: number;
		totalPages?: number;
	};
	return {
		title: optionalText(raw.title),
		list: sanitize(decodeBase64(raw.c1)),
		page: Number(raw.page) || 1,
		totalPages: Number(raw.totalPages) || 1
	};
}

/** 作者维度汇总：只在「所有脚本都缺该字段」时返回 null，缺字段的脚本不参与累加 */
function sumKnown(
	scripts: {
		deleted?: boolean;
		total_installs?: number | null;
		good_ratings?: number | null;
		ok_ratings?: number | null;
		bad_ratings?: number | null;
	}[],
	key: 'total_installs' | 'good_ratings' | 'ok_ratings' | 'bad_ratings'
): number | null {
	let sum = 0;
	let seen = false;
	for (const s of scripts) {
		if (s.deleted) continue;
		const v = s[key];
		if (v == null) continue;
		sum += v;
		seen = true;
	}
	return seen ? sum : null;
}

function toUser(json: unknown): UserView {
	const raw = (json ?? {}) as {
		user?: Record<string, unknown>;
		name?: string;
		bio?: string;
		github_identities?: GithubIdentity[];
		scripts?: unknown[];
	};
	const user = (raw.user && typeof raw.user === 'object' ? raw.user : raw) as {
		name?: string;
		bio?: string;
		github_identities?: GithubIdentity[];
		scripts?: unknown[];
	};

	const scripts = (user.scripts ?? []).map(normalizeScript).filter((s) => !s.deleted && s.id > 0);

	return {
		name: optionalText(user.name),
		bio: optionalText(user.bio),
		github: Array.isArray(user.github_identities) ? user.github_identities : [],
		scripts,
		totalInstalls: sumKnown(scripts, 'total_installs'),
		goodRatings: sumKnown(scripts, 'good_ratings'),
		okRatings: sumKnown(scripts, 'ok_ratings'),
		badRatings: sumKnown(scripts, 'bad_ratings')
	};
}

// ─── 资源工厂 ─────────────────────────────────────────────────────────────

export function detailResource(locale: string, scriptId: string): Resource<DetailView> {
	const key = `${INFO_BLOCK_ID}:detail:${locale}:${scriptId}`;
	return createResource<DetailView>({
		key,
		fallback: emptyDetail(),
		fetcher: async (signal) => {
			const res = await request<unknown>({
				key,
				url: infoUrl(`/${locale}/scripts/${scriptId}/detail.json`),
				init: { headers: { Accept: 'application/json' } },
				timeoutMs: dynamicConfig.timeout.info,
				signal
			});
			if (!res.ok) return { ok: false, reason: res.reason };
			return { ok: true, data: toDetail(res.data) };
		}
	});
}

export function feedbackResource(
	locale: string,
	scriptId: string,
	page: number
): Resource<FeedbackView> {
	const key = `${INFO_BLOCK_ID}:feedback:${locale}:${scriptId}:${page}`;
	return createResource<FeedbackView>({
		key,
		fallback: emptyFeedback(),
		fetcher: async (signal) => {
			const res = await request<unknown>({
				key,
				url: infoUrl(`/${locale}/scripts/${scriptId}/feedback.json?page=${page}`),
				init: { headers: { Accept: 'application/json' } },
				timeoutMs: dynamicConfig.timeout.info,
				signal
			});
			if (!res.ok) return { ok: false, reason: res.reason };
			return { ok: true, data: toFeedback(res.data) };
		}
	});
}

export function userResource(locale: string, userId: string): Resource<UserView> {
	const key = `${INFO_BLOCK_ID}:user:${locale}:${userId}`;
	return createResource<UserView>({
		key,
		fallback: emptyUser(),
		fetcher: async (signal) => {
			const res = await request<unknown>({
				key,
				url: infoUrl(`/${locale}/users/${userId}.json`),
				init: { headers: { Accept: 'application/json' } },
				timeoutMs: dynamicConfig.timeout.info,
				signal
			});
			if (!res.ok) return { ok: false, reason: res.reason };
			return { ok: true, data: toUser(res.data) };
		}
	});
}

// ─── hash 路由解析 ────────────────────────────────────────────────────────

const ROUTE_PATTERNS: { regex: RegExp; pageType: InfoPageType }[] = [
	{
		regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?\/detail$/,
		pageType: 'detail'
	},
	{
		regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?\/feedback$/,
		pageType: 'feedback'
	},
	{
		regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?\/(code|versions|stats)$/,
		pageType: 'redirect'
	},
	{ regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?$/, pageType: 'redirect' },
	{ regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/users\/(.+)$/, pageType: 'users' }
];

export function isHashValid(hash: string): boolean {
	return !!hash && hash !== '#' && hash !== '#google_vignette' && hash.length > 1;
}

export function parseHash(hashStr: string): InfoRoute | null {
	if (!hashStr) return null;
	const raw = hashStr.startsWith('#') ? hashStr.substring(1) : hashStr;
	if (!raw) return null;
	const path = raw.trim().replace(/^\/+|\/+$/g, '');
	if (!path) return null;

	for (const { regex, pageType } of ROUTE_PATTERNS) {
		const m = path.match(regex);
		if (!m) continue;
		const locale = (m[1] || '').toLowerCase();
		const normLocale =
			locale === 'zh-cn' || locale === 'zh-hans'
				? 'zh-CN'
				: locale === 'zh-tw' || locale === 'zh-hant'
					? 'zh-TW'
					: m[1]!;
		const rest = path.slice(m[1]!.length);
		return {
			locale: normLocale,
			scriptId: pageType !== 'users' ? m[2]! : null,
			userId: pageType === 'users' ? m[2]! : null,
			pageType,
			fullPath: '/' + normLocale + rest
		};
	}
	return null;
}

/** 与 t('info.placeholder_example') 配套：把 {locale} 换成当前语言 */
export function placeholderExample(lang: Lang, locale: string): string {
	return t(lang, 'info.placeholder_example').replace('{locale}', locale);
}

// ─── 路由控制器 ───────────────────────────────────────────────────────────

/**
 * hash 路由 → 资源。页面只把它交给 ScriptInfoBlock 渲染，
 * 控制器负责读 hash、挂监听、按路由换资源，视图负责展示。
 */
export class ScriptInfo {
	readonly lang: Lang;
	/** Greasy Fork 侧 locale（zh-CN / zh-TW / en / ja） */
	readonly locale: string;

	route = $state<InfoRoute | null>(null);
	tab = $state<'info' | 'feedback'>('info');
	/** 地址栏 hash 非法（历史记录里的坏链接）时置 true，用于提示 */
	invalidHash = $state(false);

	#detail = $state.raw<Resource<DetailView>>(idle(`${INFO_BLOCK_ID}:detail:idle`, emptyDetail()));
	#feedback = $state.raw<Resource<FeedbackView>>(
		idle(`${INFO_BLOCK_ID}:feedback:idle`, emptyFeedback())
	);
	#user = $state.raw<Resource<UserView>>(idle(`${INFO_BLOCK_ID}:user:idle`, emptyUser()));

	#timer: ReturnType<typeof setTimeout> | undefined;
	#lastHash = '';
	#inited = false;
	#warned = false;

	constructor(lang: Lang, locale: string) {
		this.lang = lang;
		this.locale = locale;
	}

	get detail(): Resource<DetailView> {
		return this.#detail;
	}
	get feedback(): Resource<FeedbackView> {
		return this.#feedback;
	}
	get user(): Resource<UserView> {
		return this.#user;
	}

	/** 水合后调用一次：读 hash、挂监听、首次取数（prerender 不执行） */
	init(): void {
		if (this.#inited || typeof window === 'undefined') return;
		this.#inited = true;
		if (window.location.hash === '#google_vignette') return;

		window.addEventListener('hashchange', this.#onLocation);
		window.addEventListener('popstate', this.#onLocation);
		document.addEventListener('visibilitychange', this.#onVisibility);
		this.#load();
	}

	destroy(): void {
		clearTimeout(this.#timer);
		this.#detail.abort();
		this.#feedback.abort();
		this.#user.abort();
		if (typeof window === 'undefined') return;
		window.removeEventListener('hashchange', this.#onLocation);
		window.removeEventListener('popstate', this.#onLocation);
		document.removeEventListener('visibilitychange', this.#onVisibility);
	}

	/** 错误态「重试」：重建当前路由的资源 */
	reload(): void {
		if (this.route) this.#fetchRoute(this.route);
		else this.#load();
	}

	/** 切换 info / feedback 标签（同时改 hash，保持可直接分享） */
	switchTab(tab: 'info' | 'feedback'): void {
		const route = this.route;
		if (!route?.scriptId) {
			this.tab = tab;
			return;
		}
		const next: InfoRoute = {
			...route,
			pageType: tab === 'info' ? 'detail' : 'feedback'
		};
		if (typeof window !== 'undefined') {
			// 一次性 URL 拼装，用完即交给 history.pushState
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const url = new URL(window.location.href);
			url.hash = `#/${this.locale}/scripts/${route.scriptId}/${tab === 'info' ? 'detail' : 'feedback'}`;
			url.search = '';
			window.history.pushState({}, '', url);
			this.#lastHash = url.hash;
		}
		this.route = next;
		this.#fetchRoute(next);
	}

	/** 反馈翻页：只换反馈资源，不动路由 */
	goToFeedbackPage(page: number): void {
		const route = this.route;
		if (!route?.scriptId) return;
		if (page < 1 || page > this.feedback.data.totalPages) return;
		const next = feedbackResource(route.locale, route.scriptId, page);
		this.#feedback.abort();
		this.#feedback = next;
		void next.load();
		if (typeof document !== 'undefined') {
			document.getElementById('feedback-list')?.scrollIntoView({ behavior: 'smooth' });
		}
	}

	// ─── 内部 ─────────────────────────────────────────────────────────────

	#onLocation = (): void => {
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => this.#load(), dynamicConfig.debounceMs.hash);
	};

	#onVisibility = (): void => {
		if (!document.hidden) return;
		this.#detail.abort();
		this.#feedback.abort();
		this.#user.abort();
	};

	#load(): void {
		if (typeof window === 'undefined') return;
		const hash = window.location.hash;
		if (hash === '#google_vignette') return;

		if (isHashValid(hash)) this.#lastHash = hash;
		const route = parseHash(isHashValid(hash) ? hash : this.#lastHash);

		// 历史记录里的坏链接：有有效上一条 hash 时提示一次
		if (!this.#warned && !isHashValid(hash) && isHashValid(this.#lastHash)) {
			this.#warned = true;
			this.invalidHash = true;
			showSnackbar(t(this.lang, 'info.history_invalid_toast'), undefined, 5000);
		}

		if (!route) {
			this.route = null;
			this.#reset();
			return;
		}

		this.route = route;
		this.#fetchRoute(route);
	}

	#fetchRoute(route: InfoRoute): void {
		if (route.pageType === 'users' && route.userId) {
			const next = userResource(route.locale, route.userId);
			this.#user.abort();
			this.#user = next;
			void next.load();
			return;
		}

		if (route.pageType === 'feedback' && route.scriptId) {
			this.tab = 'feedback';
			const next = feedbackResource(route.locale, route.scriptId, 1);
			this.#feedback.abort();
			this.#feedback = next;
			void next.load();
			return;
		}

		if (route.pageType === 'redirect' && route.scriptId) {
			// /code、/versions、/stats、只有 id 的路径一律回落到 /detail
			if (typeof window === 'undefined') return;
			// 同上，一次性 URL 拼装
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const url = new URL(window.location.href);
			url.hash = `#/${this.locale}/scripts/${route.scriptId}/detail`;
			url.search = '';
			window.history.replaceState({}, '', url);
			this.#lastHash = url.hash;
			this.#load();
			return;
		}

		this.tab = 'info';
		if (route.scriptId) {
			const next = detailResource(route.locale, route.scriptId);
			this.#detail.abort();
			this.#detail = next;
			void next.load();
		}
	}

	#reset(): void {
		this.#detail = idle(`${INFO_BLOCK_ID}:detail:idle`, emptyDetail());
		this.#feedback = idle(`${INFO_BLOCK_ID}:feedback:idle`, emptyFeedback());
		this.#user = idle(`${INFO_BLOCK_ID}:user:idle`, emptyUser());
	}
}

export function createScriptInfo(lang: Lang, locale: string): ScriptInfo {
	return new ScriptInfo(lang, locale);
}
