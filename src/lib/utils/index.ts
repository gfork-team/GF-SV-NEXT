/**
 * 把脚本内容包成一段完整的 `<script>...</script>` 字符串，供 {@html} 注入 <svelte:head>。
 *
 * 为什么闭合标签要拆开写：源码里只要出现字面量 `</script>`，
 * Svelte 编译器与 svelte-eslint-parser 都会判定为「提前闭合 script 元素」并报错
 * （Svelte 直接抛 element_invalid_closing_tag）。
 * 用 `'</' + 'script>'` 拼接后，运行时得到的字符串与字面量写法逐字符相同，
 * 产物 HTML 不变，只是让两个解析器都能正常读这份源码。
 *
 * 用途仅限本仓库自己生成的常量：FOUC 注入脚本、结构化数据 JSON-LD、AdSense/GTM 初始化代码。
 * 任何来自远程接口的 HTML 都不允许走这里。
 */
export function scriptTag(body: string, attrs = ''): string {
	return `<script${attrs}>${body}</` + 'script>';
}

export function escapeHtml(text: string): string {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

export function formatDateTime(date: Date | string | null): string {
	if (!date) return '未知';
	const d = typeof date === 'string' ? new Date(date) : date;
	return d
		.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		})
		.replace(/\//g, '-');
}

export function debounce<T extends (...args: unknown[]) => void>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
}

export function getCurrentYear(): number {
	return new Date().getFullYear();
}
