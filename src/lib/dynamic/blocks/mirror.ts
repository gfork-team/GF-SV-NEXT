/**
 * 区块 mirror-status · 类型 probe
 *
 * 数据来源：站点自身 `/ping`（Cloudflare Worker 侧实现，勿在 Worker 里改 HTML body），
 * 只读响应头 x-mirror-node / x-upstream-fetched-at / x-mirror-status。
 * 拿不到就显示「状态未知」，不做任何猜测。
 *
 * 字段级：tone（配色）/ label（文案）/ latency / synced / node 各自独立覆盖。
 */

import { dynamicConfig } from '$config';
import { t, type Lang } from '$i18n';
import { formatRelative } from '$lib/format';
import { createResource, type Resource } from '../core/resource.svelte';
import { probe } from '../core/request';

export const MIRROR_BLOCK_ID = 'mirror-status';

export type MirrorTone = 'unknown' | 'ok' | 'degraded' | 'down';

export interface MirrorView {
	tone: MirrorTone;
	label: string;
	/** '' = 该字段不显示（CSS `:empty` 收起），DOM 节点始终存在 */
	latency: string;
	synced: string;
	node: string;
}

/** 构建期默认内容：还没探测到任何东西 */
export function mirrorFallback(lang: Lang): MirrorView {
	return {
		tone: 'unknown',
		label: t(lang, 'mirror.checking'),
		latency: '',
		synced: '',
		node: ''
	};
}

function parseFetchedAt(raw: string | null): string {
	if (!raw) return '';
	const d = new Date(raw);
	return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

/** 响应头 → 视图数据 */
function toView(
	lang: Lang,
	status: { ok: boolean; headers: Headers; latencyMs: number },
	degraded: boolean
): MirrorView {
	return {
		tone: status.ok ? (degraded ? 'degraded' : 'ok') : 'down',
		label: status.ok
			? degraded
				? t(lang, 'mirror.degraded')
				: t(lang, 'mirror.ok')
			: t(lang, 'mirror.down'),
		latency: status.latencyMs > 0 ? `${status.latencyMs}ms` : '',
		synced: formatRelative(parseFetchedAt(status.headers.get('x-upstream-fetched-at')), lang),
		node: status.headers.get('x-mirror-node') ?? ''
	};
}

export function mirrorResource(lang: Lang): Resource<MirrorView> {
	return createResource<MirrorView>({
		key: `${MIRROR_BLOCK_ID}:${lang}`,
		fallback: mirrorFallback(lang),
		fetcher: async (signal) => {
			const res = await probe({
				key: `${MIRROR_BLOCK_ID}:probe`,
				url: dynamicConfig.endpoints.mirror,
				timeoutMs: dynamicConfig.timeout.mirror,
				signal
			});
			if (!res.ok) {
				// 网络层失败（超时 / DNS / CORS）也算「暂不可用」，不给假数据
				if (res.reason === 'aborted') return { ok: false, reason: 'aborted' };
				return {
					ok: true,
					data: { tone: 'down', label: t(lang, 'mirror.down'), latency: '', synced: '', node: '' }
				};
			}
			// 404 / 405 = /ping 未部署：状态未知，隐藏附加项
			if (res.data.status === 404 || res.data.status === 405) {
				return {
					ok: true,
					data: {
						tone: 'unknown',
						label: t(lang, 'mirror.unknown'),
						latency: '',
						synced: '',
						node: ''
					}
				};
			}
			const degraded = /degrad|slow|lag|warn/i.test(res.data.headers.get('x-mirror-status') ?? '');
			return { ok: true, data: toView(lang, res.data, degraded) };
		}
	});
}
