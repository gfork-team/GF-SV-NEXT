/**
 * 重新生成联系邮箱的密文 / 密钥。
 *
 * 用法：
 *   npm run mail:encode -- you@example.com
 *
 * 会打印出需要粘进 src/config/config.json 的两行。
 * 每次运行都会产生新的随机 key，因此请勿无故重跑覆盖现有配置。
 */

import { cipherText, decipherText } from '../src/lib/mail-obfuscate.ts';

const KEY_LENGTH = 12;
const KEY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const email = process.argv[2]?.trim();
if (!email) {
	console.error('用法: npm run mail:encode -- you@example.com');
	process.exit(1);
}
if (!email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
	console.error(`看起来不像邮箱地址: ${email}`);
	process.exit(1);
}

/** 与 mail-obfuscate.ts 的解码路径保持一致的随机 key */
function randomKey(len) {
	const bytes = new Uint8Array(len);
	crypto.getRandomValues(bytes);
	let out = '';
	for (let i = 0; i < len; i++) out += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
	return out;
}

const key = randomKey(KEY_LENGTH);
const cipher = cipherText(email, key);

// 自检：确保这份配置在浏览器里能被原样解回来
if (decipherText(cipher, key) !== email) {
	console.error('自检失败：解密结果与输入不一致，未输出配置。');
	process.exit(1);
}

console.log(`邮箱: ${email}`);
console.log('');
console.log(`  "contactEmailCipher": "${cipher}",`);
console.log(`  "contactEmailKey": "${key}"`);
console.log('');
console.log('请把上面两行替换到 src/config/config.json 的 site 段落后重新构建。');
