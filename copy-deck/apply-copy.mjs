#!/usr/bin/env node
/**
 * 把改写后的 copy-all.csv 回填到四份 i18n JSON。
 *
 *   node copy-deck/apply-copy.mjs copy-deck/copy-all.csv          # 预检，只报告不写入
 *   node copy-deck/apply-copy.mjs copy-deck/copy-all.csv --write  # 真正写入
 *
 * 校验规则（任何一条不过就不会写）：
 *   1. key 必须已存在于 zh-hans.json（防止改名/拼错）
 *   2. 占位符 {count} 这类必须与原文一一对应（数量与名字都不能变）
 *   3. 四种语言都不能留空
 *   4. 不允许 HTML 标签（文案里出现 < > 会被当成标记）
 */
import { readFileSync, writeFileSync } from 'node:fs';

const LANGS = ['zh-hans', 'zh-hant', 'en', 'ja'];
const [, , file = 'copy-deck/copy-all.csv', mode] = process.argv;
const WRITE = mode === '--write';

/** 最小 CSV 解析：处理双引号包裹、字段内换行与 "" 转义 */
function parseCsv(text) {
	const src = text.replace(/^\uFEFF/, '');
	const rows = [];
	let row = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i < src.length; i++) {
		const c = src[i];
		if (quoted) {
			if (c === '"' && src[i + 1] === '"') {
				field += '"';
				i++;
			} else if (c === '"') quoted = false;
			else field += c;
		} else if (c === '"') quoted = true;
		else if (c === ',') {
			row.push(field);
			field = '';
		} else if (c === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else if (c !== '\r') field += c;
	}
	if (field || row.length) {
		row.push(field);
		rows.push(row);
	}
	return rows.filter((r) => r.some((v) => v !== ''));
}

const rows = parseCsv(readFileSync(file, 'utf8'));
const header = rows.shift();
const col = (name) => header.indexOf(name);
for (const need of ['key', ...LANGS]) {
	if (col(need) < 0) {
		console.error(`CSV 缺少列: ${need}（实际列: ${header.join(', ')}）`);
		process.exit(1);
	}
}

const store = {};
for (const lang of LANGS) {
	const raw = readFileSync(`src/lib/i18n/${lang}.json`, 'utf8');
	const bom = raw.startsWith('\uFEFF') ? '\uFEFF' : '';
	store[lang] = { bom, data: JSON.parse(raw.replace(/^\uFEFF/, '')) };
}

const vars = (s) =>
	[...String(s).matchAll(/\{[a-zA-Z_][\w]*\}/g)]
		.map((m) => m[0])
		.sort()
		.join(',');

const errors = [];
const updates = [];
for (const row of rows) {
	const key = row[col('key')];
	// config / 写死英文串这两类行不是 i18n 词条，跳过（不能回填到 JSON）
	if (key?.startsWith('site.') || key?.startsWith('s.')) continue;
	if (!key || !(key in store['zh-hans'].data)) {
		if (key) errors.push(`未知 key: ${key}`);
		continue;
	}
	const next = {};
	for (const lang of LANGS) {
		const value = row[col(lang)] ?? '';
		const before = store[lang].data[key];
		// 只校验「被改动过」的值：原样保留的空值（如英文不需要的语缀）不算错误
		if (value === before) continue;
		if (!value.trim()) {
			errors.push(`${key}: ${lang} 被改成了空值`);
			continue;
		}
		if (/[<>]/.test(value)) errors.push(`${key}: ${lang} 含 HTML 标签`);
		if (vars(before) !== vars(value)) {
			errors.push(
				`${key}: ${lang} 占位符不一致（原 ${vars(before) || '无'} → 新 ${vars(value) || '无'}）`
			);
		}
		next[lang] = value;
	}
	const changed = LANGS.some((l) => next[l] !== undefined && next[l] !== store[l].data[key]);
	if (changed) updates.push({ key, next });
}

if (errors.length) {
	console.error(`✗ 校验未通过，共 ${errors.length} 个问题：`);
	for (const e of errors.slice(0, 40)) console.error('  - ' + e);
	if (errors.length > 40) console.error(`  …还有 ${errors.length - 40} 个`);
	process.exit(1);
}

console.log(`✓ 校验通过，${updates.length} 条有改动`);
for (const { key, next } of updates.slice(0, 5)) {
	console.log(`  ${key}\n    zh-hans: ${next['zh-hans'] ?? store['zh-hans'].data[key]}`);
}
if (updates.length > 5) console.log(`  …还有 ${updates.length - 5} 条`);

if (!WRITE) {
	console.log('\n预检模式，未写入。确认无误后加 --write 重新执行。');
	process.exit(0);
}

for (const { key, next } of updates) {
	for (const lang of LANGS) {
		if (next[lang] !== undefined) store[lang].data[key] = next[lang];
	}
}
for (const lang of LANGS) {
	const { bom, data } = store[lang];
	writeFileSync(`src/lib/i18n/${lang}.json`, bom + JSON.stringify(data, null, '\t') + '\n', 'utf8');
}
console.log(`✓ 已写入 4 份 JSON（每份 ${updates.length} 条变更）`);
console.log('下一步：npx prettier --write src/lib/i18n && npm run check && npm run build');
