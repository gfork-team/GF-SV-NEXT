/**
 * 镜像状态探测
 *
 * 请求站点自身的 /ping（Cloudflare Worker 侧实现，勿在 Worker 里改 HTML body），
 * 只读响应头：x-mirror-node / x-upstream-fetched-at / x-mirror-status。
 * 拿不到响应头就隐藏对应项，不做任何猜测。
 */

export interface MirrorStatus {
	/** 正常 / degraded / down */
	state: 'ok' | 'degraded' | 'down';
	latencyMs: number;
	node?: string;
	upstreamFetchedAt?: string;
	note?: string;
	checkedAt: number;
}

function parseFetchedAt(raw: string | null): string | undefined {
	if (!raw) return undefined;
	const d = new Date(raw);
	return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * 返回 null 表示「状态未知」（例如 /ping 尚未部署 → 404/405），
 * 调用方应隐藏整条状态栏。
 */
export async function measureMirror(timeoutMs = 3000): Promise<MirrorStatus | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	const start = performance.now();

	try {
		const res = await fetch('/ping', {
			method: 'GET',
			headers: { Accept: 'application/json' },
			cache: 'no-store',
			signal: controller.signal
		});

		if (res.status === 404 || res.status === 405) return null;

		const latencyMs = Math.round(performance.now() - start);
		const statusHeader = res.headers.get('x-mirror-status') ?? '';
		const degraded = /degrad|slow|lag|warn/i.test(statusHeader);

		return {
			state: res.ok ? (degraded ? 'degraded' : 'ok') : 'down',
			latencyMs,
			node: res.headers.get('x-mirror-node') ?? undefined,
			upstreamFetchedAt: parseFetchedAt(res.headers.get('x-upstream-fetched-at')),
			note: statusHeader || undefined,
			checkedAt: Date.now()
		};
	} catch {
		return { state: 'down', latencyMs: 0, checkedAt: Date.now() };
	} finally {
		clearTimeout(timer);
	}
}
