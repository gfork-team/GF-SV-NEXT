import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

/** 打包期由 vite define 注入的全局常量，见 vite.config */
const BUILD_DEFINES = {
	__APP_VERSION__: 'readonly'
};

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...BUILD_DEFINES
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		// runes 模块（*.svelte.ts）同时命中 svelte 与 ts 两套配置，
		// 这里显式指定 TS 解析器，否则 interface / type / 修饰符全部解析失败
		files: ['**/*.svelte.ts'],
		languageOptions: {
			parser: ts.parser,
			parserOptions: { ecmaVersion: 'latest', sourceType: 'module' }
		}
	},
	{
		// TS 里 RequestInit / RequestMode 这类只在类型位置出现的名字由 tsc 负责校验，
		// no-undef 只认运行时的全局变量，会对纯类型引用误报
		files: ['**/*.ts', '**/*.svelte.ts', '**/*.svelte'],
		rules: { 'no-undef': 'off' }
	},
	{
		// 下划线前缀是本仓库的「有意保留」约定：未使用的形参（seoPageServerLoad）
		// 与占位绑定（{#each Array(4) as _}）都靠它表达，不算缺陷
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		// 本项目固定部署在域名根：static/edgeone.json 里 "/" -> "/zh-hans"，
		// CI 也不注入 VITE_BUILD_BASE_PATH，所以 svelte.config.js 的 paths.base 恒为 ''。
		// cdn-toggle 的 buildBasePath('/app') 只作用于 paths.assets（CDN 上的 _app 资源目录），
		// 与站内链接无关。
		// 因此 resolve('/xxx') 在 base 为空时是恒等函数，给 19 个文件 40 处 href/goto
		// 包一层只会增加噪音，不改变任何行为 —— 这条规则在本仓库没有收益，直接关掉。
		rules: { 'svelte/no-navigation-without-resolve': 'off' }
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/']
	}
];
