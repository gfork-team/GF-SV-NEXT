import { siteConfig, auditEndpoint } from '$lib/config';
import { request } from '$lib/dynamic/core/request';

type AuditType = 'pageview' | 'search' | 'error';

interface AuditPayload {
	type: AuditType;
	path?: string;
	lang?: string;
	referrer?: string;
	payload?: Record<string, unknown>;
}

const queue: AuditPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 2000;

/** Drain queue and send all events to audit endpoint. */
function flush() {
	if (queue.length === 0) return;
	const endpoint = auditEndpoint();
	if (!endpoint) {
		queue.length = 0;
		return;
	}

	const batch = queue.splice(0);
	const body = JSON.stringify(batch.length === 1 ? batch[0] : batch);
	const url = `${endpoint}/api/audit`;

	if (navigator.sendBeacon) {
		navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
	} else {
		// 兜底通道也必须走 request.ts（全站唯一发请求的地方）。
		// keepalive 保证页面卸载时仍能发出；审计不重试、不缓存。
		void request<unknown>({
			key: `audit:${Date.now()}:${Math.random()}`,
			url,
			init: {
				method: 'POST',
				body,
				headers: { 'Content-Type': 'application/json' },
				keepalive: true
			},
			attempts: 1,
			ttlSec: 0
		});
	}
}

/** Schedule a deferred flush (batches rapid events). */
function scheduleFlush() {
	if (flushTimer) return;
	flushTimer = setTimeout(() => {
		flushTimer = null;
		flush();
	}, FLUSH_INTERVAL);
}

/** Queue an audit event. No-op when audit.enabled=false. */
export function sendAudit(type: AuditType, extra?: Partial<AuditPayload>) {
	if (!siteConfig.audit.enabled) return;

	queue.push({
		type,
		path: extra?.path,
		lang: extra?.lang,
		referrer: extra?.referrer,
		payload: extra?.payload
	});

	// Error events flush immediately; others batch
	if (type === 'error') {
		if (flushTimer) {
			clearTimeout(flushTimer);
			flushTimer = null;
		}
		flush();
	} else {
		scheduleFlush();
	}
}

/** Flush any pending events before page unload. */
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', flush);
	window.addEventListener('pagehide', flush);
}
