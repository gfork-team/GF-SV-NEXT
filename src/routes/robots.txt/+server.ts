import { siteConfig } from '$lib/config';

export async function GET() {
	const body = `User-agent: *
Allow: /

Sitemap: ${siteConfig.url}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'max-age=86400'
		}
	});
}

export const prerender = true;