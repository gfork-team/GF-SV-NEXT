import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { cdnEnabled, cdnStatic, buildBasePath } from './src/lib/cdn-toggle.ts';

const allLangs = ['zh-hans', 'zh-hant', 'en', 'ja'];
const pages = ['', '/download', '/lookup', '/search', '/help', '/about', '/tos', '/feedback', '/applist', '/installing', '/info'];

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: false
		}),
		prerender: {
			entries: [
				'/',
				...allLangs.flatMap(l => pages.map(p => `/${l}${p}`)),
				'/s',
				'/l',
				'/sitemap.xml',
				'/robots.txt'
			],
			crawl: true,
			handleHttpError: ({ path, message }) => {
				console.warn(`Prerender warning for ${path}: ${message}`);
				return;
			},
			// 有「声明可预渲染但没被渲染」的路由时直接在构建日志里报错，避免再次静默丢页
			handleUnseenRoutes: 'warn'
		},
		paths: {
			base: process.env.VITE_BUILD_BASE_PATH || '',
			assets: cdnEnabled
				? `${cdnStatic}${buildBasePath}`
				: (process.env.VITE_BUILD_BASE_PATH || '')
		},
		alias: {
			$components: 'src/lib/components',
			$utils: 'src/lib/utils',
			$i18n: 'src/lib/i18n',
			$config: 'src/config'
		}
	}
};

export default config;
