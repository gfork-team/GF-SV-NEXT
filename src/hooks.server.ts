import { i18nConfig, isValidLang } from '$i18n';
import { siteConfig } from '$config';
import type { Handle } from '@sveltejs/kit';

const SPECIAL_ROUTES = ['/s', '/l', '/sitemap.xml', '/robots.txt'];

/** Paths that serve static assets from CDN. */
const STATIC_ASSET_REGEX = /\.(css|js|svg|png|jpg|jpeg|webp|woff2|woff|ttf|ico)$/i;

/** Set of immutable asset extensions (long cache). */
const IMMUTABLE_ASSET_REGEX = /\.(css|js|svg|png|jpg|jpeg|webp|woff2)$/i;

function isSpecialRoute(pathname: string): boolean {
	return SPECIAL_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	const langMatch = pathname.match(/^\/([a-z-]+)(?:\/|$)/);
	const lang = langMatch?.[1];

	if (lang && !isValidLang(lang)) {
		if (isSpecialRoute(pathname)) {
			event.locals.lang = i18nConfig.defaultLang;
			return resolve(event, {
				transformPageChunk: ({ html }) => html.replace('%sveltekit.lang%', event.locals.lang)
			});
		}
		return new Response('Not Found', { status: 404 });
	}

	event.locals.lang = (lang as typeof i18nConfig.supportedLangs[number]) || i18nConfig.defaultLang;

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html.replace('%sveltekit.lang%', event.locals.lang);
		}
	});

	// ── Security headers (all responses) ──────────────────────────────────
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	// ── CORS for CDN assets ───────────────────────────────────────────────
	if (siteConfig.cdn.enabled && siteConfig.cdn.static) {
		response.headers.set('Access-Control-Allow-Origin', siteConfig.cdn.static);
		response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
		response.headers.set('Vary', 'Origin');
	}

	// ── Cache-Control for static assets ───────────────────────────────────
	if (IMMUTABLE_ASSET_REGEX.test(pathname)) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	} else if (STATIC_ASSET_REGEX.test(pathname)) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	} else if (pathname.endsWith('.html') || (!pathname.includes('.') && !pathname.startsWith('/api/'))) {
		// HTML pages → 1 hour cache
		response.headers.set('Cache-Control', 'public, max-age=3600');
	}

	return response;
};