import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';

/** 当前版本：GHA 传入 VITE_GIT_SHA，本地 fallback 到 git rev-parse。 */
const appVersion =
	process.env.VITE_GIT_SHA ||
	(() => {
		try {
			return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
				.toString()
				.trim();
		} catch {
			return 'dev';
		}
	})();

/**
 * 该 commit 的提交时间（ISO）：GHA 传 VITE_GIT_TIME，本地读 git。
 * 只用于页脚展示 "v1a2b3c4 · 2026-11-04"，取不到就留空。
 */
const appTime =
	process.env.VITE_GIT_TIME ||
	(() => {
		try {
			return execSync('git show -s --format=%cI HEAD', {
				stdio: ['ignore', 'pipe', 'ignore']
			})
				.toString()
				.trim();
		} catch {
			return '';
		}
	})();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(appVersion.slice(0, 7)),
		__APP_VERSION_TIME__: JSON.stringify(appTime)
	},
	build: {
		sourcemap: true,
		minify: 'esbuild',
		cssMinify: true,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: []
				}
			}
		}
	},
	css: {
		devSourcemap: true
	}
});
