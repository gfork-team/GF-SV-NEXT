/**
 * 内联 SVG 图标集 —— 不引外部图标字体 / CDN。
 * 统一 24×24 viewBox，stroke 用 currentColor，跟随文字色。
 */
export const ICONS = {
	search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
	close: '<path d="M6 6l12 12M18 6L6 18"/>',
	install:
		'<path d="M12 3v11"/><path d="M8 10.5l4 4 4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>',
	'more-vert':
		'<g fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></g>',
	'chevron-down': '<path d="M6 9.5l6 6 6-6"/>',
	'chevron-right': '<path d="M9.5 6l6 6-6 6"/>',
	'chevron-left': '<path d="M14.5 6l-6 6 6 6"/>',
	'arrow-up': '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
	'arrow-left': '<path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/>',
	sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
	moon: '<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/>',
	globe:
		'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.7 2.5 15.3 0 18-2.5-2.7-2.5-15.3 0-18z"/>',
	check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
	refresh: '<path d="M20 12a8 8 0 11-2.6-5.9"/><path d="M20 4v4h-4"/>',
	external:
		'<path d="M14 4h6v6"/><path d="M20 4l-8 8"/><path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/>',
	code: '<path d="M9 7l-5 5 5 5"/><path d="M15 7l5 5-5 5"/>',
	history: '<path d="M3.5 12a8.5 8.5 0 105-7.8"/><path d="M3 4v4h4"/><path d="M12 8v4.5l3 1.8"/>',
	star: '<path d="M12 4l2.4 5 5.6.7-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.7z"/>',
	alert: '<path d="M12 4.5l8.5 15h-17z"/><path d="M12 10v4"/><path d="M12 17.2v.1"/>',
	info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.1"/>',
	'mirror-ok':
		'<path d="M7 18a4.5 4.5 0 01-.4-9A6 6 0 0117.8 8.6 4.2 4.2 0 0117 18z"/><path d="M10 14.5l2 2 3.5-3.8"/>',
	sort: '<path d="M7 4v16"/><path d="M4 17l3 3 3-3"/><path d="M17 20V4"/><path d="M14 7l3-3 3 3"/>',
	filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
	grid: '<path d="M4 4h7v7H4z"/><path d="M13 4h7v7h-7z"/><path d="M4 13h7v7H4z"/><path d="M13 13h7v7h-7z"/>',
	list: '<path d="M4 6h16M4 12h16M4 18h16"/>',
	copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M6 15H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v1"/>',
	link: '<path d="M10.5 13.5a4 4 0 005.7 0l2.3-2.3a4 4 0 10-5.7-5.7L11.5 6.8"/><path d="M13.5 10.5a4 4 0 00-5.7 0l-2.3 2.3a4 4 0 105.7 5.7l1.3-1.3"/>',
	'help-circle':
		'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.7-1.5 1.2-1.5 2.5"/><path d="M12 17.5v.1"/>',
	menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
	download: '<path d="M12 4v10"/><path d="M8 11l4 4 4-4"/><path d="M5 19h14"/>',
	message: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12.5h5"/>',
	book: '<path d="M4 5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M8 3v18"/>',
	sparkle:
		'<path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
	shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>'
} as const;

export type IconName = keyof typeof ICONS;
