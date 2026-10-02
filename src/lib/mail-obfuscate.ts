/**
 * 联系邮箱的轻量混淆。
 *
 * 背景：邮箱明文写进静态 HTML，等于直接送给邮件采集机器人。正则一把梭就能
 * 抓走全站联系方式。这里把邮箱做一次对称混淆，页面在浏览器里再解回明文。
 *
 * 能防什么 / 不能防什么（重要，别误判安全强度）：
 *   - 能挡：绝大多数按 `@` 符号做正则匹配的采集脚本、爬虫、浏览器插件式抓取。
 *   - 挡不住：会执行 JS 的采集器。因为解密逻辑必须下发到客户端，密钥必然随之
 *     可见，这是纯前端方案的固有上限。
 *   - 真要根治，只能是不公开邮箱（例如只留反馈表单由服务端转发）。
 *
 * 因此这里的做法是：**明文不进入任何构建产物**，仓库里只存密文，
 * 需要改邮箱时用 `npm run mail:encode` 重新生成。
 */

/** 单字节 XOR 混淆；key 长度变化会改变密文长度，不适合直接用长度探测 */
export function cipherText(plain: string, key: string): string {
	const k = key.length > 0 ? key : 'gfork';
	let out = '';
	for (let i = 0; i < plain.length; i++) {
		const code = plain.charCodeAt(i) ^ k.charCodeAt(i % k.length);
		out += String.fromCharCode(code & 0xff);
	}
	return toBase64(out);
}

/** 运行时解密：ContactEmail.svelte 使用 */
export function decipherText(cipher: string, key: string): string {
	const k = key.length > 0 ? key : 'gfork';
	let raw: string;
	try {
		raw = fromBase64(cipher);
	} catch {
		return '';
	}
	let out = '';
	for (let i = 0; i < raw.length; i++) {
		out += String.fromCharCode(raw.charCodeAt(i) ^ k.charCodeAt(i % k.length));
	}
	return out;
}

/* 邮箱字符全部落在 ASCII 范围内，用 latin1 走 btoa/atob 最省事 */
function toBase64(s: string): string {
	if (typeof btoa === 'function') return btoa(s);
	const buf = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i) & 0xff;
	return bytesToBase64(buf);
}

function fromBase64(s: string): string {
	if (typeof atob === 'function') return atob(s);
	const bin = base64ToBytes(s);
	let out = '';
	for (let i = 0; i < bin.length; i++) out += String.fromCharCode(bin[i]!);
	return out;
}

function bytesToBase64(bytes: Uint8Array): string {
	const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	let out = '';
	for (let i = 0; i < bytes.length; i += 3) {
		const b0 = bytes[i]!;
		const b1 = bytes[i + 1];
		const b2 = bytes[i + 2];
		out += CHARS[b0 >> 2];
		out += CHARS[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
		out += b1 === undefined ? '=' : CHARS[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
		out += b2 === undefined ? '=' : CHARS[b2 & 0x3f];
	}
	return out;
}

function base64ToBytes(s: string): Uint8Array {
	const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	const clean = s.replace(/[^A-Za-z0-9+/]/g, '');
	const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
	let o = 0;
	for (let i = 0; i < clean.length; i += 4) {
		const n =
			(CHARS.indexOf(clean[i]!) << 18) |
			(CHARS.indexOf(clean[i + 1]!) << 12) |
			((clean[i + 2] ? CHARS.indexOf(clean[i + 2]!) : 0) << 6) |
			(clean[i + 3] ? CHARS.indexOf(clean[i + 3]!) : 0);
		out[o++] = (n >> 16) & 0xff;
		if (clean[i + 2]) out[o++] = (n >> 8) & 0xff;
		if (clean[i + 3]) out[o++] = n & 0xff;
	}
	return out.subarray(0, o);
}
