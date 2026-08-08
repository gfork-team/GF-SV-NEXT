/// <reference types="@sveltejs/kit" />

declare global {
	interface Window {
		adsbygoogle?: unknown[];
	}

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
