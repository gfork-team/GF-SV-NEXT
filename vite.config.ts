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

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(appVersion.slice(0, 7))
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
