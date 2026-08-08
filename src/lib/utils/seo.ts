/**
 * Simplify +page.server.ts load functions. The layout already provides
 * `lang`/`showAds` via merged data, so pages return nothing here.
 */
export function seoPageServerLoad(
	_getMeta?: (lang: string) => { title: string; description: string; keywords: string }
) {
	return () => ({});
}
