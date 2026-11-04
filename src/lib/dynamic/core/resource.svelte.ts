/**
 * 动态内容资源（runes 状态机）
 *
 * 职责：
 * - `data` 的初始值就是 fallback —— 构建期写进 HTML 的默认内容，
 *   所以 SSR / prerender 阶段渲染出来的结构与文案永远完整。
 * - 只有 `load()` 会触发请求，而 `load()` 只会在浏览器里被 Slot 调用，
 *   prerender / SSR 阶段永远不会发出请求。
 * - 一个 resource 可以被多个区块绑定：`data` 变了，所有绑定处一起覆盖，
 *   请求只发一次（request 层还有同 key 去重）。
 *
 * 文件名是 `.svelte.ts`：runes 只在 svelte 模块里可用，
 * 组件里读 `resource.data` / `resource.state` 即可获得响应式更新。
 */

import type { Result } from './request';
import { dynamicConfig } from '$config';

export type ResourceState = 'idle' | 'loading' | 'ready' | 'error';

export interface ResourceOptions<T> {
	/** 去重 / 缓存键，必须能唯一标识这份数据 */
	key: string;
	/** 构建期默认内容；视为不可变，不要原地修改 */
	fallback: T;
	/** 真正的取数；只在浏览器里被调用 */
	fetcher: (signal: AbortSignal) => Promise<Result<T>>;
	/** TTL 缓存（秒）：只用于二次访问，冷加载不会命中 */
	ttlSec?: number;
}

export interface Resource<T> {
	readonly id: string;
	readonly state: ResourceState;
	readonly data: T;
	readonly error: string | null;
	/** 幂等：已在请求中或已 ready 时直接返回，不会重复发请求 */
	load(force?: boolean): Promise<void>;
	/** 取消当前请求（页面隐藏等场景），状态回到 idle 以便下次重试 */
	abort(): void;
}

/** 跨组件实例的二次访问缓存（同一 key 在同一页面/会话内复用上一份结果） */
// 纯缓存表，不参与渲染，故意用原生 Map：SvelteMap 的响应式在这里没有意义
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const memo = new Map<string, { expires: number; data: unknown }>();

class ResourceImpl<T> implements Resource<T> {
	readonly id: string;
	readonly #fallback: T;
	readonly #fetcher: (signal: AbortSignal) => Promise<Result<T>>;
	readonly #ttlSec: number;

	state = $state<ResourceState>('idle');
	data = $state<T>(null as unknown as T);
	error = $state<string | null>(null);

	#pending: Promise<void> | null = null;
	#controller: AbortController | null = null;

	constructor(o: ResourceOptions<T>) {
		this.id = o.key;
		this.#fallback = o.fallback;
		this.#fetcher = o.fetcher;
		this.#ttlSec = o.ttlSec ?? dynamicConfig.cache.ttlSec;
		this.data = o.fallback;
	}

	load(force = false): Promise<void> {
		if (this.#pending) return this.#pending;
		if (!force && this.state === 'ready') return Promise.resolve();

		const cached = this.#readMemo();
		if (cached !== undefined && !force) {
			this.data = cached;
			this.state = 'ready';
			this.error = null;
			return Promise.resolve();
		}

		this.state = 'loading';
		this.error = null;
		this.#controller = new AbortController();

		const task = this.#fetcher(this.#controller.signal).then((result) => {
			if (result.ok) {
				this.data = result.data;
				this.state = 'ready';
				this.error = null;
				this.#writeMemo(result.data);
				return;
			}
			if (result.reason === 'aborted') {
				// 被主动取消：回到 idle，保留 fallback，下次可以重试
				this.state = 'idle';
				return;
			}
			// 失败降级：显示 fallback + 错误态，不影响其它区块
			this.data = this.#fallback;
			this.state = 'error';
			this.error = result.reason;
		});

		this.#pending = task.finally(() => {
			this.#pending = null;
		});
		return this.#pending;
	}

	abort(): void {
		this.#controller?.abort();
	}

	#readMemo(): T | undefined {
		if (this.#ttlSec <= 0) return undefined;
		const hit = memo.get(this.id);
		if (!hit) return undefined;
		if (hit.expires <= Date.now()) {
			memo.delete(this.id);
			return undefined;
		}
		return hit.data as T;
	}

	#writeMemo(value: T): void {
		if (this.#ttlSec <= 0) return;
		memo.set(this.id, { data: value, expires: Date.now() + this.#ttlSec * 1000 });
	}
}

export function createResource<T>(o: ResourceOptions<T>): Resource<T> {
	return new ResourceImpl<T>(o);
}
