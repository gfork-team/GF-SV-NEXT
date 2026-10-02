/// <reference types="@sveltejs/kit" />

declare global {
	interface Window {
		/** AdSense 请求队列；脚本到位后会消费其中每个对象并渲染对应 ins */
		adsbygoogle?: unknown[];
		/** 非个性化广告（npa）通道 */
		googlefc?: {
			callbackQueue: {
				init?: (cb: () => void) => void;
				push?: (req: unknown) => void;
			};
		};
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
