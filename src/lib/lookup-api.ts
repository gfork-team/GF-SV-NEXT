import { siteConfig, getPrimaryLookupNodes, getBackupLookupNodes } from '$lib/config';

export interface ScriptSuggestion {
	id: number;
	name: string;
	installs: number;
}

async function generateSS(): Promise<string> {
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const input = timestamp.substring(0, 8);
	const data = new TextEncoder().encode(input);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, siteConfig.lookupSignature.ssLength);
}

/**
 * 顺序尝试各节点，返回首个成功的脚本名建议。
 * 与 lookup 页的并发竞速不同：建议请求频率高，顺序尝试可节省流量。
 */
export async function fetchScriptSuggestions(
	q: string,
	signal: AbortSignal,
	limit = 8,
	timeoutMs = 8000
): Promise<ScriptSuggestion[] | null> {
	const nodes = [...getPrimaryLookupNodes(), ...getBackupLookupNodes()];
	const params = { q, per_page: String(limit), page: '1' };

	for (const node of nodes) {
		try {
			const ss = await generateSS();
			const timeout = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Timeout')), timeoutMs)
			);

			let url: string;
			let options: RequestInit;

			if (node.method === 'POST') {
				url = `${node.endpoint}/${ss}`;
				options = {
					method: 'POST',
					headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams(params).toString(),
					mode: 'cors' as RequestMode,
					signal
				};
			} else {
				const qs = new URLSearchParams({ ...params, ss }).toString();
				url = `${node.endpoint}?${qs}`;
				options = {
					method: 'GET',
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					mode: 'cors' as RequestMode,
					signal
				};
			}

			const res = await Promise.race([fetch(url, options), timeout]);
			if (!(res instanceof Response) || !res.ok) continue;

			let json: unknown;
			const encoding = (res as Response).headers.get('X-Content-Encoding');
			if (encoding === 'base64') {
				const text = await (res as Response).text();
				const decoded = atob(text);
				const bytes = new Uint8Array(decoded.length);
				for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
				json = JSON.parse(new TextDecoder('utf-8').decode(bytes));
			} else {
				json = await (res as Response).json();
			}

			const data = json as { query?: unknown[]; execute?: unknown[] };
			const list = data.query ?? data.execute;
			if (!Array.isArray(list)) continue;

			return list
				.slice(0, limit)
				.map((it) => {
					const item = it as { id?: number; name?: string; daily_installs?: number };
					return { id: Number(item.id) || 0, name: item.name || '', installs: Number(item.daily_installs) || 0 };
				})
				.filter((it) => it.id > 0 && it.name);
		} catch {
			if (signal.aborted) return null;
			// 尝试下一个节点
		}
	}

	return null;
}
