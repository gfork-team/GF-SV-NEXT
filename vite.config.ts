import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
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
