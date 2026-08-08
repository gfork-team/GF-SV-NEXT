/// <reference types="@sveltejs/kit" />

declare global {
	interface Window {
		adsbygoogle?: unknown[];
	}

	/** Commit SHA 注入值（vite.config.ts 的 define 注入）。 */
	const __APP_VERSION__: string;

	namespace App {
		interface Locals {
			lang: 'zh-hans' | 'zh-hant' | 'en' | 'ja';
		}
		interface Error {
			message: string;
			code?: string;
		}
		interface PageData {
			lang: 'zh-hans' | 'zh-hant' | 'en' | 'ja';
		}
	}
}

export {};
