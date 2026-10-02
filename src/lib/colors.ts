/**
 * MD3 Color Tokens — Teal（种子色 #006A6A）
 *
 * 架构说明（保留自既有设计系统，勿破坏）：
 *   - 本文件是「配色数据层」：每个 scheme 提供完整的 light / dark 两套
 *     `--md-sys-color-*` token，写入 :root 后由 app.css 的组件消费。
 *   - app.css 的 `:root` 静态声明同一套 light token，保证 JS 执行前首帧
 *     就是协调配色（无黑白闪变）。
 *   - `getColorFoucScript()` 生成内联脚本，在 paint 前同步读取
 *     localStorage（key：gf-theme / gf-color）并写入 token + data-theme。
 *
 * 现在的视觉方向是「单一青色种子 + 亮/暗双主题」，不再提供多套配色切换，
 * 因此 SCHEMES 只有一项；gf-color 仍保留读取（旧用户残留值会被忽略回落默认）。
 */

import { siteConfig } from '$config';

/* ── Token shape ─────────────────────────────────── */
export interface ColorTokens {
	// Primary palette
	primary: string;
	onPrimary: string;
	primaryContainer: string;
	onPrimaryContainer: string;
	// Secondary palette
	secondary: string;
	onSecondary: string;
	secondaryContainer: string;
	onSecondaryContainer: string;
	// Tertiary palette
	tertiary: string;
	onTertiary: string;
	tertiaryContainer: string;
	onTertiaryContainer: string;
	// Error palette
	error: string;
	onError: string;
	errorContainer: string;
	onErrorContainer: string;
	// Surface / background palette
	surface: string;
	onSurface: string;
	surfaceVariant: string;
	onSurfaceVariant: string;
	surfaceDim: string;
	surfaceBright: string;
	surfaceContainerLowest: string;
	surfaceContainerLow: string;
	surfaceContainer: string;
	surfaceContainerHigh: string;
	surfaceContainerHighest: string;
	background: string;
	onBackground: string;
	// Outline
	outline: string;
	outlineVariant: string;
	// Inverse（snackbar / 提示条）
	inverseSurface: string;
	inverseOnSurface: string;
	inversePrimary: string;
	// 其它
	scrim: string;
	shadow: string;
	surfaceTint: string;
}

export interface ColorScheme {
	id: string;
	label: string;
	/** CSS color to show in the picker swatch */
	swatch: string;
	light: ColorTokens;
	dark: ColorTokens;
}

/* ── Schemes (first = site default) ───────────────── */
export const SCHEMES: ColorScheme[] = [
	{
		id: 'teal',
		label: 'Teal',
		swatch: '#006a6a',
		light: {
			primary: '#006a6a',
			onPrimary: '#ffffff',
			primaryContainer: '#9cf1f1',
			onPrimaryContainer: '#002020',
			secondary: '#4a6363',
			onSecondary: '#ffffff',
			secondaryContainer: '#cce8e7',
			onSecondaryContainer: '#051f1f',
			tertiary: '#4b607c',
			onTertiary: '#ffffff',
			tertiaryContainer: '#d3e4ff',
			onTertiaryContainer: '#041c35',
			error: '#ba1a1a',
			onError: '#ffffff',
			errorContainer: '#ffdad6',
			onErrorContainer: '#410002',
			surface: '#f5fbfa',
			onSurface: '#171d1d',
			surfaceVariant: '#dae5e4',
			onSurfaceVariant: '#3f4948',
			surfaceDim: '#d5dbda',
			surfaceBright: '#f5fbfa',
			surfaceContainerLowest: '#ffffff',
			surfaceContainerLow: '#eff5f4',
			surfaceContainer: '#e9efef',
			surfaceContainerHigh: '#e3eae9',
			surfaceContainerHighest: '#dee4e3',
			background: '#f5fbfa',
			onBackground: '#171d1d',
			outline: '#6f7979',
			outlineVariant: '#bec9c8',
			inverseSurface: '#2b3231',
			inverseOnSurface: '#ecf2f1',
			inversePrimary: '#80d5d5',
			scrim: '#000000',
			shadow: '#000000',
			surfaceTint: '#006a6a'
		},
		dark: {
			primary: '#80d5d5',
			onPrimary: '#003737',
			primaryContainer: '#004f50',
			onPrimaryContainer: '#9cf1f1',
			secondary: '#b0cccb',
			onSecondary: '#1b3534',
			secondaryContainer: '#324b4b',
			onSecondaryContainer: '#cce8e7',
			tertiary: '#b3c8e8',
			onTertiary: '#1c314b',
			tertiaryContainer: '#334863',
			onTertiaryContainer: '#d3e4ff',
			error: '#ffb4ab',
			onError: '#690005',
			errorContainer: '#93000a',
			onErrorContainer: '#ffdad6',
			surface: '#0e1414',
			onSurface: '#dde4e3',
			surfaceVariant: '#3f4948',
			onSurfaceVariant: '#bec9c8',
			surfaceDim: '#0e1414',
			surfaceBright: '#343b3a',
			surfaceContainerLowest: '#090f0f',
			surfaceContainerLow: '#171d1d',
			surfaceContainer: '#1b2121',
			surfaceContainerHigh: '#252b2b',
			surfaceContainerHighest: '#303636',
			background: '#0e1414',
			onBackground: '#dde4e3',
			outline: '#899393',
			outlineVariant: '#3f4948',
			inverseSurface: '#dde4e3',
			inverseOnSurface: '#2b3231',
			inversePrimary: '#006a6a',
			scrim: '#000000',
			shadow: '#000000',
			surfaceTint: '#80d5d5'
		}
	}
];

/* ── Helpers ─────────────────────────────────────── */

const PROPERTY_MAP: [keyof ColorTokens, string][] = [
	// Primary
	['primary', '--md-sys-color-primary'],
	['onPrimary', '--md-sys-color-on-primary'],
	['primaryContainer', '--md-sys-color-primary-container'],
	['onPrimaryContainer', '--md-sys-color-on-primary-container'],
	// Secondary
	['secondary', '--md-sys-color-secondary'],
	['onSecondary', '--md-sys-color-on-secondary'],
	['secondaryContainer', '--md-sys-color-secondary-container'],
	['onSecondaryContainer', '--md-sys-color-on-secondary-container'],
	// Tertiary
	['tertiary', '--md-sys-color-tertiary'],
	['onTertiary', '--md-sys-color-on-tertiary'],
	['tertiaryContainer', '--md-sys-color-tertiary-container'],
	['onTertiaryContainer', '--md-sys-color-on-tertiary-container'],
	// Error
	['error', '--md-sys-color-error'],
	['onError', '--md-sys-color-on-error'],
	['errorContainer', '--md-sys-color-error-container'],
	['onErrorContainer', '--md-sys-color-on-error-container'],
	// Surface
	['surface', '--md-sys-color-surface'],
	['onSurface', '--md-sys-color-on-surface'],
	['surfaceVariant', '--md-sys-color-surface-variant'],
	['onSurfaceVariant', '--md-sys-color-on-surface-variant'],
	['surfaceDim', '--md-sys-color-surface-dim'],
	['surfaceBright', '--md-sys-color-surface-bright'],
	['surfaceContainerLowest', '--md-sys-color-surface-container-lowest'],
	['surfaceContainerLow', '--md-sys-color-surface-container-low'],
	['surfaceContainer', '--md-sys-color-surface-container'],
	['surfaceContainerHigh', '--md-sys-color-surface-container-high'],
	['surfaceContainerHighest', '--md-sys-color-surface-container-highest'],
	['background', '--md-sys-color-background'],
	['onBackground', '--md-sys-color-on-background'],
	// Outline
	['outline', '--md-sys-color-outline'],
	['outlineVariant', '--md-sys-color-outline-variant'],
	// Inverse
	['inverseSurface', '--md-sys-color-inverse-surface'],
	['inverseOnSurface', '--md-sys-color-inverse-on-surface'],
	['inversePrimary', '--md-sys-color-inverse-primary'],
	// Misc
	['scrim', '--md-sys-color-scrim'],
	['shadow', '--md-sys-color-shadow'],
	['surfaceTint', '--md-sys-color-surface-tint']
];

export function getScheme(id: string): ColorScheme {
	return SCHEMES.find((s) => s.id === id) ?? SCHEMES[0];
}

function resolveDefaultId(): string {
	const cfgId = siteConfig.defaultColorScheme;
	if (cfgId && SCHEMES.some((s) => s.id === cfgId)) return cfgId;
	return SCHEMES[0].id;
}

export function getDefaultSchemeId(): string {
	return resolveDefaultId();
}

export function getActiveSchemeId(): string {
	if (typeof localStorage === 'undefined') return resolveDefaultId();
	const saved = localStorage.getItem('gf-color');
	if (saved && SCHEMES.some((s) => s.id === saved)) return saved;
	return resolveDefaultId();
}

export function hasCustomScheme(): boolean {
	if (typeof localStorage === 'undefined') return false;
	const saved = localStorage.getItem('gf-color');
	return !!saved && SCHEMES.some((s) => s.id === saved) && saved !== resolveDefaultId();
}

export function saveSchemePreference(id: string) {
	localStorage.setItem('gf-color', id);
}

export function clearSchemePreference() {
	localStorage.removeItem('gf-color');
}

/**
 * Apply a color scheme to :root (tokens only, no localStorage write).
 * @param schemeId  scheme id
 * @param isDark    whether dark-mode tokens should be used
 */
export function applyColorScheme(schemeId: string, isDark: boolean) {
	if (typeof document === 'undefined') return;
	const scheme = getScheme(schemeId);
	const tokens = isDark ? scheme.dark : scheme.light;
	const root = document.documentElement;
	for (const [key, prop] of PROPERTY_MAP) {
		root.style.setProperty(prop, tokens[key]);
	}
	root.setAttribute('data-color-scheme', schemeId);
}

/**
 * Anti-FOUC 内联脚本（渲染于 <head>，paint 前同步执行）。
 * 读取 localStorage 的明暗配置并立即应用 token + data-theme，
 * 使首帧即为最终配色，避免 hydrate 前的黑白/错色闪变。
 * 仅内嵌 token 数据，无外部依赖。
 */
export function getColorFoucScript(): string {
	const propNames = PROPERTY_MAP.map(([, p]) => p);
	const bundles: Record<string, [string[], string[]]> = {};
	for (const s of SCHEMES) {
		bundles[s.id] = [PROPERTY_MAP.map(([k]) => s.light[k]), PROPERTY_MAP.map(([k]) => s.dark[k])];
	}
	const propsJson = JSON.stringify(propNames);
	const dataJson = JSON.stringify(bundles);
	const defId = JSON.stringify(resolveDefaultId());
	return `(function(){var P=${propsJson},D=${dataJson},DEF=${defId};try{var t=localStorage.getItem('gf-theme'),dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches),c=localStorage.getItem('gf-color'),id=(c&&D[c])?c:DEF,b=(D[id]||D[DEF])[dark?1:0],r=document.documentElement;for(var i=0;i<P.length;i++)r.style.setProperty(P[i],b[i]);r.setAttribute('data-color-scheme',id);if(t==='light'||t==='dark')r.setAttribute('data-theme',t)}catch(e){}})()`;
}
