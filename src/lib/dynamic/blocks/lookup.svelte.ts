/**
 * 区块 lookup-results · 类型 race + list
 *
 * - race：primary + backup 全部并发，首个成功的节点胜出（搜索页要快）。
 * - list：构建期用同一行模板渲染 `dynamicConfig.list.placeholderRows` 行占位，
 *   ready 后按真实数量增减；行高由 ScriptCard 的 min-height 固定。
 * - hash：真实参数无法预构建，水合后读 `window.location.hash` 并监听 `hashchange`。
 *
 * 控制器放在 `.svelte.ts` 里：它持有 runes 状态（params / 当前 resource），
 * 页面只拿它做组合与筛选器绑定，不参与取数。
 */

import { dynamicConfig, siteConfig } from '$config';
import { t, type Lang } from '$i18n';
import { sendAudit } from '$lib/audit';
import { normalizeScript, readScriptList, type ScriptSummary } from '$lib/scripts';
import { parseSearchParams, stringifySearchParams, type SearchParams } from '$lib/search-params';
import { createResource, type Resource } from '../core/resource.svelte';
import { lookupRequest } from '../core/request';
import { placeholderRows } from '../core/patch';

export const LOOKUP_BLOCK_ID = 'lookup-results';

export type LookupStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export interface LookupData {
	rows: ScriptSummary[];
	perPage: number;
	/** 是否还有下一页（由接口原始条数推断，不依赖过滤后的行数） */
	hasMore: boolean;
}

function isHashValid(hash: string): boolean {
	return !!hash && hash !== '#' && hash !== '#?' && hash !== '#google_vignette';
}

/** 占位行：与真实行共用同一个 ScriptCard 模板，只是 id 为负、不可点击 */
export function lookupPlaceholderRow(lang: Lang): ScriptSummary {
	return {
		id: -1,
		name: t(lang, 'lookup.row_placeholder_title'),
		description: t(lang, 'lookup.row_placeholder_desc'),
		daily_installs: null,
		total_installs: null,
		good_ratings: null,
		ok_ratings: null,
		bad_ratings: null,
		fan_score: null,
		created_at: '',
		code_updated_at: '',
		code_url: ''
	};
}

function fallbackData(lang: Lang): LookupData {
	const template = lookupPlaceholderRow(lang);
	return {
		rows: placeholderRows(dynamicConfig.list.placeholderRows, template).map((row, i) => ({
			...row,
			id: -(i + 1)
		})),
		perPage: 0,
		hasMore: false
	};
}

/**
 * API 原始 JSON → 视图数据。
 *
 * 响应信封有两种（见 `$lib/scripts` 的 `readScriptList`）：
 * 新版是裸数组，旧版是 `{ query|execute, options.per_page }`。
 * 服务端要求跳转时按原逻辑弹出提示并离开。
 *
 * `hasMore` 用「接口返回的原始条数」判断，而不是过滤后的行数：
 * 新版没有 `options.per_page`，只能拿返回条数当每页条数，
 * 一旦某行被判为脏行被过滤掉，用行数判断会误关「下一页」。
 */
function readList(json: unknown, perPage: number): LookupData {
	const page = readScriptList(json, perPage);

	if (page.redirect) {
		// 与旧实现一致：先提示再跳回官方站，避免被当成静默劫持
		window.alert(page.redirect.message || 'Redirecting to Greasyfork Official Site');
		window.location.href = page.redirect.url;
		throw new Error('redirect');
	}

	// id 为 0 的脏行不渲染：id < 0 是占位行的约定，不能被真实数据撞上
	const rows = page.items.map(normalizeScript).filter((row) => row.id > 0);
	return {
		rows,
		perPage: page.perPage,
		hasMore: page.perPage > 0 && page.items.length >= page.perPage
	};
}

export class LookupSearch {
	readonly lang: Lang;
	/** 当前搜索参数（页面筛选器读它来高亮选中项） */
	params = $state<SearchParams>({});

	#resource = $state.raw<Resource<LookupData> | undefined>(undefined);
	#timer: ReturnType<typeof setTimeout> | undefined;
	#ownHash = '';
	#ownSearch = '';
	#lastHash = '';
	#inited = false;

	constructor(lang: Lang) {
		this.lang = lang;
		this.#resource = this.#idleResource();
	}

	get resource(): Resource<LookupData> {
		const current = this.#resource;
		if (current) return current;
		const created = this.#idleResource();
		this.#resource = created;
		return created;
	}

	/** 没有 q / site / page 时不算一次搜索，保持「示例」状态 */
	get hasQuery(): boolean {
		const p = this.params;
		return !!(p.q || p.site || p.page);
	}

	/** 水合后调用一次：读 hash、挂监听、跑首次搜索 */
	init(): void {
		if (this.#inited || typeof window === 'undefined') return;
		this.#inited = true;
		if (window.location.hash === '#google_vignette') return;

		this.#ownHash = window.location.hash;
		this.#ownSearch = window.location.search;
		window.addEventListener('hashchange', this.#onLocationChange);
		window.addEventListener('popstate', this.#onLocationChange);
		document.addEventListener('visibilitychange', this.#onVisibility);

		this.params = this.#readLocation();
		this.search();
	}

	destroy(): void {
		clearTimeout(this.#timer);
		this.#resource?.abort();
		if (typeof window === 'undefined') return;
		window.removeEventListener('hashchange', this.#onLocationChange);
		window.removeEventListener('popstate', this.#onLocationChange);
		document.removeEventListener('visibilitychange', this.#onVisibility);
	}

	/** 用新的完整参数集替换 hash 并重新搜索（页面筛选器只调这一个方法） */
	apply(next: SearchParams): void {
		if (typeof window === 'undefined') return;
		this.#writeHash(next, 'push');
		this.params = this.#readLocation();
		this.search();
	}

	/** 重新拉一次当前参数（错误态的重试按钮） */
	reload(): void {
		this.search(true);
	}

	search(force = false): void {
		const current = this.#resource;
		if (!this.hasQuery) {
			this.#swap(this.#idleResource());
			return;
		}
		if (current && !force && current.id === this.#key()) return;

		const key = this.#key();
		const params = this.params;
		// per_page 只进请求参数，不进 hash：URL 格式必须保持不变
		const perPage = dynamicConfig.list.perPage;
		const requestParams: SearchParams = { ...params, per_page: String(perPage) };
		const resource = createResource<LookupData>({
			key,
			fallback: fallbackData(this.lang),
			fetcher: (signal) =>
				lookupRequest<LookupData>({
					key,
					params: requestParams,
					strategy: 'race',
					signal,
					read: (json) => readList(json, perPage)
				})
		});
		this.#swap(resource);
		resource.load().then(() => this.#audit(resource, params));
	}

	/** 搜索命中上报（audit.enabled=false 时是空操作） */
	#audit(resource: Resource<LookupData>, params: SearchParams): void {
		if (!siteConfig.audit.enabled || resource.state !== 'ready') return;
		sendAudit('search', {
			path: window.location.pathname,
			lang: this.lang,
			payload: {
				q: params.q || '',
				site: params.site || '',
				sort: params.sort || '',
				filter_locale: params.filter_locale || '',
				page: params.page || '1',
				hit_count: resource.data.rows.length
			}
		});
	}

	#key(): string {
		return `${LOOKUP_BLOCK_ID}:${this.lang}:${stringifySearchParams(this.params)}`;
	}

	/** idle 资源不发请求：它的 fetcher 只返回自己的 fallback */
	#idleResource(): Resource<LookupData> {
		const data = fallbackData(this.lang);
		return createResource<LookupData>({
			key: `${LOOKUP_BLOCK_ID}:${this.lang}:idle`,
			fallback: data,
			fetcher: async () => ({ ok: true, data })
		});
	}

	#swap(next: Resource<LookupData>): void {
		if (this.#resource && this.#resource !== next) this.#resource.abort();
		this.#resource = next;
	}

	#onLocationChange = (): void => {
		clearTimeout(this.#timer);
		// 站内 apply() 会先改 hash 再自己 search，这里必须去重，
		// 否则每次翻页 / 改筛选都会重复请求一次
		this.#timer = setTimeout(() => {
			if (window.location.hash === '#google_vignette') return;
			const hash = window.location.hash;
			if (hash === this.#ownHash && window.location.search === this.#ownSearch) return;
			this.#ownHash = hash;
			this.#ownSearch = window.location.search;
			this.params = this.#readLocation();
			this.search();
		}, dynamicConfig.debounceMs.hash);
	};

	#onVisibility = (): void => {
		if (document.hidden) this.#resource?.abort();
	};

	#readLocation(): SearchParams {
		const hash = window.location.hash;
		const search = window.location.search;

		if (isHashValid(hash)) {
			this.#lastHash = hash;
			return parseSearchParams(hash.startsWith('#?') ? hash.substring(2) : hash.substring(1));
		}

		// 没有 hash 但有查询串：按既有规范转换成 #? 形式
		if (search && search.length > 1) {
			const raw = search.substring(1);
			this.#writeHash(parseSearchParams(raw), 'replace');
			return parseSearchParams(raw);
		}

		if (isHashValid(this.#lastHash)) {
			return parseSearchParams(
				this.#lastHash.startsWith('#?') ? this.#lastHash.substring(2) : this.#lastHash.substring(1)
			);
		}

		return {};
	}

	#writeHash(params: SearchParams, mode: 'push' | 'replace'): void {
		const qs = stringifySearchParams(params);
		// 仅用于拼 hash 后交给 history，函数结束即丢弃，不需要响应式包装
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const url = new URL(window.location.href);
		url.search = '';
		url.hash = qs ? `#?${qs}` : '#';
		this.#ownHash = url.hash;
		this.#ownSearch = url.search;
		if (mode === 'push') window.history.pushState({}, '', url);
		else window.history.replaceState({}, '', url);
	}
}

export function createLookupSearch(lang: Lang): LookupSearch {
	return new LookupSearch(lang);
}
