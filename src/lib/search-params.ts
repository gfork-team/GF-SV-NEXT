/**
 * 搜索参数的序列化 / 反序列化。
 *
 * 关键点：`entry_locales[]` 是 PHP 风格的多值参数，必须以重复键出现
 * （`entry_locales[]=187&entry_locales[]=40`）。用
 * `new URLSearchParams(obj)` 处理带数组值的普通对象会把它拼成逗号分隔的
 * 单值（`entry_locales[]=187,40`），后端解析不出来，因此这里统一自己拼。
 */

/** 以 `[]` 结尾的键为 string[]，其余为 string；undefined 视为未设置 */
export type SearchParams = Record<string, string | string[] | undefined>;

/** 把带数组值的对象序列化成查询串，数组按键重复展开 */
export function stringifySearchParams(params: SearchParams): string {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value == null || value === '') continue;
		if (Array.isArray(value)) {
			for (const item of value) if (item != null && item !== '') search.append(key, item);
		} else {
			search.append(key, value);
		}
	}
	return search.toString();
}

/** 解析查询串，把 `[]` 结尾的重复键收敛成 string[] */
export function parseSearchParams(raw: string): SearchParams {
	const result: SearchParams = {};
	for (const [key, value] of new URLSearchParams(raw).entries()) {
		if (value === '') continue;
		if (key.endsWith('[]')) {
			if (!Array.isArray(result[key])) result[key] = [];
			(result[key] as string[]).push(value);
		} else {
			result[key] = value;
		}
	}
	return result;
}

/** 取单值参数（多值键取第一个），把 SearchParams 收敛成字符串 */
export function getParam(params: SearchParams, key: string): string {
	const value = params[key];
	if (Array.isArray(value)) return value[0] ?? '';
	return value ?? '';
}

/** 取多值参数（单个字符串按只有一个元素的数组处理） */
export function getParamList(params: SearchParams, key: string): string[] {
	const value = params[key];
	if (Array.isArray(value)) return value;
	return value ? [value] : [];
}
