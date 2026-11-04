/**
 * 全站唯一的请求出口。
 *
 * 规则（改动前先读）：
 * - 除了本文件，仓库里不允许出现 `fetch(`。区块要数据只能经过 resource → 本文件。
 * - 任何失败都必须归一化成 `{ ok: false, reason }`，绝不向调用方抛异常。
 * - 同 key 并发去重：同一页面同一份数据只发一次请求（in-flight Map）。
 * - TTL 缓存只用于二次访问：它在浏览器里、水合之后才会被写入，
 *   冷加载首帧永远来自构建期 HTML，不受缓存影响。
 * - 端点 / 超时 / 重试 / TTL 一律来自 `src/config`，这里不写死。
 *
 * 本模块顶层不访问 window / document，SSR 与 prerender 均可安全 import。
 */

import { dynamicConfig, getBackupLookupNodes, getPrimaryLookupNodes, siteConfig } from '$config';
import { stringifySearchParams, type SearchParams } from '$lib/search-params';

export type Failure = { ok: false; reason: string };
export type Success<T> = { ok: true; data: T; node?: string };
export type Result<T> = Success<T> | Failure;

/** 与 config.json → lookupNodes 的结构一致 */
export interface LookupNode {
	id: string;
	endpoint: string;
	method: 'GET' | 'POST';
}

/** 同 key 并发去重：同一份数据同一时刻只发一次 */
const inflight = new Map<string, Promise<Result<unknown>>>();
/** 二次访问用的内存 TTL */
const ttlStore = new Map<string, { expires: number; value: Result<unknown> }>();

/** HTTP 状态码错误：让 reason 保持 `HTTP 404` 这种可判定的形态 */
class HttpError extends Error {
	readonly status: number;
	constructor(status: number) {
		super(`HTTP ${status}`);
		this.status = status;
	}
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(e: unknown): boolean {
	return (e as Error | undefined)?.name === 'AbortError';
}

/** 统一错误归一化：任何异常都变成可判定的 reason */
function reasonOf(e: unknown, timedOut: boolean): string {
	if (timedOut) return 'timeout';
	if (isAbortError(e)) return 'aborted';
	if (e instanceof Error) return e.message || e.name || 'error';
	return 'error';
}

/** 可重试的失败：超时 / 网络 / 5xx（竞速失败时 reason 是多个节点原因的拼接） */
function isTransient(reason: string): boolean {
	if (reason === 'aborted') return false;
	return (
		reason.includes('timeout') ||
		/HTTP 5\d\d/.test(reason) ||
		/Failed to fetch|NetworkError|fetch failed/i.test(reason)
	);
}

/** 响应体解析：兼容服务端 `X-Content-Encoding: base64` 的编码包装 */
async function readJsonBody(res: Response): Promise<unknown> {
	if (res.headers.get('X-Content-Encoding') === 'base64') {
		const binary = atob(await res.text());
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		return JSON.parse(new TextDecoder('utf-8').decode(bytes));
	}
	return res.json();
}

/**
 * 单次 fetch：AbortController 超时 + 外部 signal 联动。
 * `handle` 里抛出的异常同样会被归一化，因此调用方拿到的永远是 Result。
 */
async function send<T>(
	url: string,
	init: RequestInit,
	timeoutMs: number,
	signal: AbortSignal | undefined,
	handle: (res: Response) => Promise<T>
): Promise<Result<T>> {
	if (signal?.aborted) return { ok: false, reason: 'aborted' };

	const ctrl = new AbortController();
	let timedOut = false;
	const timer = setTimeout(() => {
		timedOut = true;
		ctrl.abort();
	}, timeoutMs);
	const onAbort = () => ctrl.abort();
	signal?.addEventListener('abort', onAbort, { once: true });

	try {
		const res = await fetch(url, { ...init, signal: ctrl.signal });
		return { ok: true, data: await handle(res) };
	} catch (e) {
		return { ok: false, reason: reasonOf(e, timedOut) };
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener('abort', onAbort);
	}
}

async function readJsonResponse(res: Response): Promise<unknown> {
	if (!res.ok) throw new HttpError(res.status);
	return readJsonBody(res);
}

/** 去重 + TTL 包装：同一 key 只会有一次真实请求 */
function shared<T>(key: string, ttlSec: number, run: () => Promise<Result<T>>): Promise<Result<T>> {
	const ttlMs = ttlSec * 1000;
	if (ttlMs > 0) {
		const hit = ttlStore.get(key);
		if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value as Result<T>);
	}
	const running = inflight.get(key);
	if (running) return running as Promise<Result<T>>;

	const task = run()
		.then((result) => {
			if (result.ok && ttlMs > 0) {
				ttlStore.set(key, { value: result, expires: Date.now() + ttlMs });
			}
			return result;
		})
		.finally(() => {
			inflight.delete(key);
		});

	inflight.set(key, task as Promise<Result<unknown>>);
	return task;
}

// ─── 普通 JSON 请求 ───────────────────────────────────────────────────────

export interface RequestOptions<T> {
	/** 去重 / 缓存键，必须能唯一标识这份数据 */
	key: string;
	url: string;
	init?: RequestInit;
	timeoutMs?: number;
	/** 0 = 不缓存（仍会去重） */
	ttlSec?: number;
	/** 含首次的总尝试次数 */
	attempts?: number;
	signal?: AbortSignal;
	/** 响应解析；默认 JSON（兼容 base64 包装） */
	read?: (res: Response) => Promise<T>;
}

/** 带重试的 JSON 请求（非 2xx 视为失败），失败时返回归一化的 reason */
export function request<T>(o: RequestOptions<T>): Promise<Result<T>> {
	const timeoutMs = o.timeoutMs ?? dynamicConfig.timeout.info;
	const attempts = Math.max(1, o.attempts ?? dynamicConfig.retry.attempts);
	const ttlSec = o.ttlSec ?? dynamicConfig.cache.ttlSec;
	const read = o.read ?? (readJsonResponse as unknown as (res: Response) => Promise<T>);

	return shared(o.key, ttlSec, async () => {
		let last: Result<T> = { ok: false, reason: 'error' };
		for (let i = 0; i < attempts; i++) {
			if (i > 0) await wait(dynamicConfig.retry.delaysMs[i - 1] ?? 0);
			if (o.signal?.aborted) return { ok: false, reason: 'aborted' };
			last = await send(o.url, o.init ?? {}, timeoutMs, o.signal, read);
			if (last.ok || !isTransient(last.reason) || last.reason === 'aborted') return last;
		}
		return last;
	});
}

// ─── 探活（只关心状态码 / 响应头，非 2xx 也算「有响应」） ─────────────────

export interface ProbeResponse {
	status: number;
	ok: boolean;
	headers: Headers;
	latencyMs: number;
}

export interface ProbeOptions {
	key: string;
	url: string;
	method?: string;
	headers?: Record<string, string>;
	timeoutMs?: number;
	ttlSec?: number;
	signal?: AbortSignal;
}

/**
 * 探活请求：用于「镜像状态」「下载节点测速」这类只看响应本身的区块。
 * 4xx/5xx 不在传输层算失败，交给调用方按 status 判断。
 */
export function probe(o: ProbeOptions): Promise<Result<ProbeResponse>> {
	const timeoutMs = o.timeoutMs ?? dynamicConfig.timeout.mirror;

	return shared(o.key, o.ttlSec ?? 0, async () => {
		const started = performance.now();
		return send(
			o.url,
			{
				method: o.method ?? 'GET',
				headers: { Accept: 'application/json', ...o.headers },
				cache: 'no-store'
			},
			timeoutMs,
			o.signal,
			async (res) => ({
				status: res.status,
				ok: res.ok,
				headers: res.headers,
				latencyMs: Math.round(performance.now() - started)
			})
		);
	});
}

// ─── lookup 节点请求（签名 + 竞速 / 回退） ────────────────────────────────

/** 节点签名：sha256(秒级时间戳前 8 位) 截断到 lookupSignature.ssLength */
async function signSuffix(): Promise<string> {
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const data = new TextEncoder().encode(timestamp.substring(0, 8));
	const digest = await crypto.subtle.digest('SHA-256', data);
	const hex = Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return hex.substring(0, siteConfig.lookupSignature.ssLength);
}

/** 按节点 method 组装 URL 与请求参数（POST 走 /{ss} + 表单体，GET 走 ?ss=） */
async function buildNodeCall(
	node: LookupNode,
	params: SearchParams
): Promise<{ url: string; init: RequestInit }> {
	const ss = await signSuffix();
	if (node.method === 'POST') {
		return {
			url: `${node.endpoint}/${ss}`,
			init: {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: stringifySearchParams(params),
				mode: 'cors'
			}
		};
	}
	const qs = stringifySearchParams({ ...params, ss });
	return {
		url: qs ? `${node.endpoint}?${qs}` : node.endpoint,
		init: { method: 'GET', headers: { Accept: 'application/json' }, mode: 'cors' }
	};
}

export interface LookupRequestOptions<T> {
	key: string;
	params: SearchParams;
	/**
	 * race：primary + backup 全部并发，首个成功者胜出（搜索页）；
	 * sequential：按 primary → backup 顺序回退（建议词 / 榜单，频率高、省流量）。
	 */
	strategy?: 'race' | 'sequential';
	timeoutMs?: number;
	ttlSec?: number;
	signal?: AbortSignal;
	/** API 原始 JSON → 视图数据（区块自己的 mapper） */
	read: (json: unknown, nodeId: string) => T;
}

async function callNode<T>(
	node: LookupNode,
	params: SearchParams,
	read: (json: unknown, nodeId: string) => T,
	timeoutMs: number,
	signal: AbortSignal | undefined
): Promise<Result<T>> {
	let call: { url: string; init: RequestInit };
	try {
		call = await buildNodeCall(node, params);
	} catch (e) {
		return { ok: false, reason: reasonOf(e, false) };
	}

	const res = await send(call.url, call.init, timeoutMs, signal, readJsonResponse);
	if (!res.ok) return res;

	try {
		return { ok: true, data: read(res.data, node.id), node: node.id };
	} catch (e) {
		return { ok: false, reason: reasonOf(e, false) };
	}
}

/** 全节点竞速：任一成功即返回，全部失败才失败 */
function raceNodes<T>(
	nodes: LookupNode[],
	run: (node: LookupNode) => Promise<Result<T>>
): Promise<Result<T>> {
	if (nodes.length === 0) return Promise.resolve({ ok: false, reason: 'no-node' });

	return new Promise((resolve) => {
		let pending = nodes.length;
		let settled = false;
		const reasons: string[] = [];

		for (const node of nodes) {
			run(node).then((result) => {
				if (settled) return;
				if (result.ok) {
					settled = true;
					resolve(result);
					return;
				}
				reasons.push(`${node.id}:${result.reason}`);
				if (--pending === 0) {
					settled = true;
					resolve({ ok: false, reason: reasons.join(', ') });
				}
			});
		}
	});
}

export function lookupRequest<T>(o: LookupRequestOptions<T>): Promise<Result<T>> {
	const timeoutMs = o.timeoutMs ?? dynamicConfig.timeout.lookup;
	const ttlSec = o.ttlSec ?? dynamicConfig.cache.ttlSec;
	const attempts = Math.max(1, dynamicConfig.retry.attempts);
	const nodes: LookupNode[] = [...getPrimaryLookupNodes(), ...getBackupLookupNodes()];

	return shared(o.key, ttlSec, async () => {
		let last: Result<T> = { ok: false, reason: 'no-node' };

		// 整轮失败后会按 config.retry 的间隔重来（与旧页面的重试兜底一致）
		for (let round = 0; round < attempts; round++) {
			if (round > 0) await wait(dynamicConfig.retry.delaysMs[round - 1] ?? 0);
			if (o.signal?.aborted) return { ok: false, reason: 'aborted' };

			if (o.strategy === 'sequential') {
				for (const node of nodes) {
					if (o.signal?.aborted) return { ok: false, reason: 'aborted' };
					last = await callNode(node, o.params, o.read, timeoutMs, o.signal);
					if (last.ok) return last;
				}
			} else {
				last = await raceNodes(nodes, (node) =>
					callNode(node, o.params, o.read, timeoutMs, o.signal)
				);
			}

			if (last.ok || !isTransient(last.reason)) return last;
		}

		return last;
	});
}

/** 供调试 / 测试使用：清空去重与 TTL 缓存 */
export function resetRequestCache(): void {
	inflight.clear();
	ttlStore.clear();
}
