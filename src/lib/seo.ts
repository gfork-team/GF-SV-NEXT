import { siteConfig, siteUrl } from '$lib/config';
import { i18nConfig, type Lang } from '$i18n';

/** lang → Open Graph locale 映射。 */
export const OG_LOCALES: Record<Lang, string> = {
	'zh-hans': 'zh_CN',
	'zh-hant': 'zh_TW',
	en: 'en_US',
	ja: 'ja_JP'
};

export interface RouteMeta {
	titleKey: string;
	descKey: string;
	/** Open Graph type，默认 'website'。 */
	ogType?: string;
}

/**
 * 共用路由元数据表（客户端与预渲染同源）。
 * 新增页面时在此加一条记录，canonical / OG / BreadcrumbList / JSON-LD 自动跟进。
 */
export const ROUTE_META: Record<string, RouteMeta> = {
	'/': { titleKey: 'meta.home_title', descKey: 'meta.home_desc' },
	'/download': { titleKey: 'meta.download_title', descKey: 'meta.download_desc' },
	'/lookup': { titleKey: 'meta.lookup_title', descKey: 'meta.lookup_desc' },
	'/search': { titleKey: 'meta.search_title', descKey: 'meta.search_desc' },
	'/help': { titleKey: 'meta.help_title', descKey: 'meta.help_desc' },
	'/about': { titleKey: 'meta.about_title', descKey: 'meta.about_desc' },
	'/tos': { titleKey: 'meta.tos_title', descKey: 'meta.tos_desc' },
	'/feedback': { titleKey: 'meta.feedback_title', descKey: 'meta.feedback_desc' },
	'/applist': { titleKey: 'meta.applist_title', descKey: 'meta.applist_desc' },
	'/installing': { titleKey: 'meta.installing_title', descKey: 'meta.installing_desc' },
	'/info': { titleKey: 'meta.lookup_title', descKey: 'meta.lookup_desc' }
};

/** 从 lang 前缀路径解析出站内 cleanPath（如 /en/help → /help，根 → /）。 */
export function cleanPathFrom(pathname: string): string {
	const stripped = pathname.replace(new RegExp(`^/(?:${i18nConfig.supportedLangs.join('|')})`), '');
	return stripped.length === 0 ? '/' : stripped;
}

/** 标准 URL（无尾斜杠，根除外）。供 canonical / og:url 使用。 */
export function canonicalUrl(lang: Lang, cleanPath: string): string {
	const p = cleanPath === '/' ? '' : cleanPath;
	return `${siteConfig.url.replace(/\/+$/, '')}/${lang}${p}`;
}

function escapeJsonLd(text: string): string {
	return text.replace(/</g, '\\u003c');
}

/** 整站 WebSite JSON-LD（含 SearchAction）。 */
export function websiteJsonLd(lang: Lang): string {
	const searchUrl = `${canonicalUrl(lang, '/s')}?q={search_term_string}`;
	const ld = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${siteConfig.url}/#website`,
		url: siteConfig.url + '/',
		name: siteConfig.name,
		description: siteConfig.description[lang] || siteConfig.description.en,
		inLanguage: OG_LOCALES[lang],
		publisher: { '@id': `${siteConfig.url}/#organization` },
		potentialAction: {
			'@type': 'SearchAction',
			target: { '@type': 'EntryPoint', urlTemplate: searchUrl },
			'query-input': 'required name=search_term_string'
		}
	};
	return escapeJsonLd(JSON.stringify(ld));
}

/** 整站 Organization JSON-LD。 */
export function organizationJsonLd(): string {
	const ld = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${siteConfig.url}/#organization`,
		name: siteConfig.name,
		alternateName: 'GFork',
		url: siteConfig.url + '/',
		logo: { '@type': 'ImageObject', url: siteUrl(siteConfig.seo.defaultOgImage) },
		sameAs: [siteConfig.github.org, siteConfig.github.gfHomeSvelteKit].filter(Boolean)
	};
	return escapeJsonLd(JSON.stringify(ld));
}

/** BreadcrumbList JSON-LD（首页 › 当前页），自动从路径推导。 */
export function breadcrumbJsonLd(lang: Lang, cleanPath: string, pageTitle: string): string {
	const items = [
		{
			'@type': 'ListItem',
			position: 1,
			name: i18nConfig.langNames[lang],
			item: canonicalUrl(lang, '/')
		},
		{
			'@type': 'ListItem',
			position: 2,
			name: pageTitle,
			item: canonicalUrl(lang, cleanPath)
		}
	];
	const ld = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items
	};
	return escapeJsonLd(JSON.stringify(ld));
}
