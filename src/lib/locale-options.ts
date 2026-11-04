/**
 * 脚本语言筛选选项（Greasy Fork 的 entry_locales[] 数字 id）。
 *
 * 首页高级搜索面板与 lookup 侧边栏共用这一份，避免两处写死不同步。
 */
export const LOCALE_OPTIONS = [
	{ value: '187', label: '简体中文 (zh-CN)' },
	{ value: '188', label: '繁體中文 (zh-TW)' },
	{ value: '40', label: 'English (en)' },
	{ value: '78', label: '日本語 (ja)' },
	{ value: '88', label: '한국어 (ko)' },
	{ value: '42', label: 'Español (es)' },
	{ value: '51', label: 'Français (fr)' },
	{ value: '35', label: 'Deutsch (de)' },
	{ value: '139', label: 'Русский (ru)' },
	{ value: '134', label: 'Português do Brasil (pt-BR)' },
	{ value: '76', label: 'Italiano (it)' },
	{ value: '118', label: 'Nederlands (nl)' },
	{ value: '130', label: 'Polski (pl)' },
	{ value: '171', label: 'Türkçe (tr)' },
	{ value: '181', label: 'Tiếng Việt (vi)' },
	{ value: '165', label: 'ไทย (th)' },
	{ value: '71', label: 'Bahasa Indonesia (id)' }
] as const;
