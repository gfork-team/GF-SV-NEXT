/**
 * 区块 search-suggestions · 类型 race（顺序回退）
 *
 * 输入联想是「用户触发」的请求，不是冷加载区块：默认内容就是空列表，
 * 所以构建期 HTML 里没有它的结构，也没有占位行 —— 不该在没输入时暗示有结果。
 *
 * 策略用 sequential（primary → backup 逐个试）：联想请求频率高，省流量优先。
 */

import { dynamicConfig } from '$config';
import { readScriptList } from '$lib/scripts';
import { lookupRequest } from '../core/request';

export interface ScriptSuggestion {
	id: number;
	name: string;
	installs: number | null;
}

export const SUGGESTIONS_BLOCK_ID = 'search-suggestions';

/** API 原始 JSON → 建议词列表（缺 id / name 的条目直接丢弃；兼容裸数组与旧信封） */
function toSuggestions(json: unknown, limit: number): ScriptSuggestion[] {
	const list = readScriptList(json).items;

	return list
		.slice(0, limit)
		.map((entry) => {
			const item = (entry ?? {}) as { id?: number; name?: string; daily_installs?: unknown };
			// 缺失就保留 null，别谎报 0；formatCount 会显示为「—」
			const raw = item.daily_installs;
			const installs = raw == null || raw === '' ? null : Number(raw);
			return {
				id: Number(item.id) || 0,
				name: item.name || '',
				installs: Number.isFinite(installs) ? (installs as number) : null
			};
		})
		.filter((item) => item.id > 0 && item.name);
}

export function fetchSuggestions(q: string, limit: number, signal: AbortSignal) {
	return lookupRequest<ScriptSuggestion[]>({
		key: `${SUGGESTIONS_BLOCK_ID}:${q}:${limit}`,
		params: { q, per_page: String(limit), page: '1' },
		strategy: 'sequential',
		timeoutMs: dynamicConfig.timeout.suggestions,
		signal,
		read: (json) => toSuggestions(json, limit)
	});
}
