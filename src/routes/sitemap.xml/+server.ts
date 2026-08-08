import { i18nConfig } from '$i18n';
import { siteConfig } from '$lib/config';

const STATIC_PAGES = [
	{ path: '', priority: '1.0' },
	{ path: '/download', priority: '0.9' },
	{ path: '/lookup', priority: '0.9' },
	{ path: '/search', priority: '0.8' },
	{ path: '/help', priority: '0.7' },
	{ path: '/about', priority: '0.6' },
	{ path: '/applist', priority: '0.6' },
	{ path: '/installing', priority: '0.6' },
	{ path: '/tos', priority: '0.4' },
	{ path: '/feedback', priority: '0.4' }
];

/** ISO date string for today (used as lastmod). */
const TODAY = new Date().toISOString().split('T')[0];

export async function GET() {
	const BASE_URL = siteConfig.url;
	let urlEntries = '';

	for (const lang of i18nConfig.supportedLangs) {
		for (const page of STATIC_PAGES) {
			const loc = `${BASE_URL}/${lang}${page.path}`;
			urlEntries += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${page.priority}</priority>\n`;

			// hreflang alternates for each URL entry
			for (const altLang of i18nConfig.supportedLangs) {
				const altUrl = `${BASE_URL}/${altLang}${page.path}`;
				urlEntries += `    <xhtml:link rel="alternate" hreflang="${i18nConfig.langNames[altLang]}" href="${altUrl}" />\n`;
			}
			// x-default
			urlEntries += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/${i18nConfig.defaultLang}${page.path}" />\n`;

			urlEntries += '  </url>\n';
		}
	}

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
}