/**
 * MD3 Multi-Color Schemes
 *
 * Each scheme defines light & dark token sets for ALL color roles.
 * Dark-surface values are NOT shared — each scheme has its own dark surface
 * tinted slightly toward the seed color (MD3 tonal surface spec).
 *
 * localStorage key: "gf-color" → scheme id (string)
 *   - When absent → user follows site default (from config.site.defaultColorScheme)
 *   - When present → user has explicitly chosen a custom scheme
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
  // Surface / background palette
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  // Outline
  outline: string;
  outlineVariant: string;
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
  // ── Forest Green (default) ─────────────────
  {
    id: 'green',
    label: 'Forest Green',
    swatch: '#388e3c',
    light: {
      primary: '#1b6b22',           onPrimary: '#ffffff',
      primaryContainer: '#a2f5a6',  onPrimaryContainer: '#002106',
      secondary: '#516351',         onSecondary: '#ffffff',
      secondaryContainer: '#d5e8d2', onSecondaryContainer: '#0f1f12',
      tertiary: '#3b6471',          onTertiary: '#ffffff',
      tertiaryContainer: '#bfe9f8',  onTertiaryContainer: '#001f27',
      surface: '#f6fbf3',           onSurface: '#181d18',
      surfaceVariant: '#dbe5d9',    onSurfaceVariant: '#414a40',
      surfaceContainerLow: '#f0f6ee',
      surfaceContainer: '#eaf0e8',
      surfaceContainerHigh: '#e5ebe3',
      surfaceContainerHighest: '#dfe5dd',
      outline: '#717970',           outlineVariant: '#c1c9bf',
    },
    dark: {
      primary: '#7ddd85',           onPrimary: '#00390a',
      primaryContainer: '#005312',  onPrimaryContainer: '#a2f5a6',
      secondary: '#b9ccb6',         onSecondary: '#253528',
      secondaryContainer: '#3a4b3d', onSecondaryContainer: '#d5e8d2',
      tertiary: '#a3cddb',          onTertiary: '#043543',
      tertiaryContainer: '#224c5a',  onTertiaryContainer: '#bfe9f8',
      surface: '#10140f',           onSurface: '#dfe5dd',
      surfaceVariant: '#414a40',    onSurfaceVariant: '#c1c9bf',
      surfaceContainerLow: '#0b100a',
      surfaceContainer: '#141a14',
      surfaceContainerHigh: '#1e251e',
      surfaceContainerHighest: '#282f28',
      outline: '#8b938a',           outlineVariant: '#414a40',
    },
  },

  // ── Ocean Blue ────────────────────────────
  {
    id: 'ocean',
    label: 'Ocean Blue',
    swatch: '#1a5cb0',
    light: {
      primary: '#295ea7',           onPrimary: '#ffffff',
      primaryContainer: '#d6e3ff',  onPrimaryContainer: '#001b3e',
      secondary: '#545f71',         onSecondary: '#ffffff',
      secondaryContainer: '#d8e3f9', onSecondaryContainer: '#111c2b',
      tertiary: '#6c5779',          onTertiary: '#ffffff',
      tertiaryContainer: '#f3daff',  onTertiaryContainer: '#261433',
      surface: '#f8f9ff',           onSurface: '#191c20',
      surfaceVariant: '#dfe2f0',    onSurfaceVariant: '#44474f',
      surfaceContainerLow: '#f2f4fc',
      surfaceContainer: '#eceef7',
      surfaceContainerHigh: '#e6e9f1',
      surfaceContainerHighest: '#e1e3eb',
      outline: '#73777f',           outlineVariant: '#c3c7cf',
    },
    dark: {
      primary: '#aac7ff',           onPrimary: '#002f63',
      primaryContainer: '#00458b',  onPrimaryContainer: '#d6e3ff',
      secondary: '#bcc7dc',         onSecondary: '#263141',
      secondaryContainer: '#3d4758', onSecondaryContainer: '#d8e3f9',
      tertiary: '#d7bee5',          onTertiary: '#3c2949',
      tertiaryContainer: '#543f60',  onTertiaryContainer: '#f3daff',
      // Ocean dark surface — slight blue tint
      surface: '#121318',           onSurface: '#e1e3eb',
      surfaceVariant: '#3d424e',    onSurfaceVariant: '#c3c7cf',
      surfaceContainerLow: '#0d0f14',
      surfaceContainer: '#181b20',
      surfaceContainerHigh: '#22252b',
      surfaceContainerHighest: '#2c3036',
      outline: '#8c9098',           outlineVariant: '#3d424e',
    },
  },

  // ── Royal Purple ──────────────────────────
  {
    id: 'purple',
    label: 'Royal Purple',
    swatch: '#7c4a9e',
    light: {
      primary: '#7b48a1',           onPrimary: '#ffffff',
      primaryContainer: '#f5d9ff',  onPrimaryContainer: '#2d0052',
      secondary: '#675a70',         onSecondary: '#ffffff',
      secondaryContainer: '#edddf7', onSecondaryContainer: '#22172b',
      tertiary: '#815256',          onTertiary: '#ffffff',
      tertiaryContainer: '#ffd9dc',  onTertiaryContainer: '#321014',
      surface: '#fef7ff',           onSurface: '#1d1a20',
      surfaceVariant: '#e7deee',    onSurfaceVariant: '#4a4450',
      surfaceContainerLow: '#f8f1fb',
      surfaceContainer: '#f2ecf6',
      surfaceContainerHigh: '#ece6ef',
      surfaceContainerHighest: '#e6e1e9',
      outline: '#797581',           outlineVariant: '#cbc4d0',
    },
    dark: {
      primary: '#d7b8f0',           onPrimary: '#441867',
      primaryContainer: '#5d307f',  onPrimaryContainer: '#f5d9ff',
      secondary: '#d0c1db',         onSecondary: '#372c40',
      secondaryContainer: '#4e4357', onSecondaryContainer: '#edddf7',
      tertiary: '#f1b9be',          onTertiary: '#4b252a',
      tertiaryContainer: '#56333a',  onTertiaryContainer: '#ffd9dc',
      // Purple dark surface — slight purple tint
      surface: '#1a171f',           onSurface: '#e6e1e9',
      surfaceVariant: '#443e4a',    onSurfaceVariant: '#cbc4d0',
      surfaceContainerLow: '#150f1b',
      surfaceContainer: '#1f1b25',
      surfaceContainerHigh: '#292532',
      surfaceContainerHighest: '#332e3c',
      outline: '#948e9a',           outlineVariant: '#443e4a',
    },
  },

  // ── Terracotta ────────────────────────────
  {
    id: 'terra',
    label: 'Terracotta',
    swatch: '#ba4a0a',
    light: {
      primary: '#b54b06',           onPrimary: '#ffffff',
      primaryContainer: '#ffdbca',  onPrimaryContainer: '#3a1200',
      secondary: '#755945',         onSecondary: '#ffffff',
      secondaryContainer: '#ffdcc7', onSecondaryContainer: '#2a1707',
      tertiary: '#5e6137',          onTertiary: '#ffffff',
      tertiaryContainer: '#e4e6b8',  onTertiaryContainer: '#1b1d00',
      surface: '#fef9f6',           onSurface: '#1e1b18',
      surfaceVariant: '#f2dfd8',    onSurfaceVariant: '#51443e',
      surfaceContainerLow: '#f8f3f0',
      surfaceContainer: '#f3edea',
      surfaceContainerHigh: '#ede7e4',
      surfaceContainerHighest: '#e7e2de',
      outline: '#85746b',           outlineVariant: '#d8c4b8',
    },
    dark: {
      primary: '#ffb693',           onPrimary: '#602200',
      primaryContainer: '#893400',  onPrimaryContainer: '#ffdbca',
      secondary: '#e6bfa7',         onSecondary: '#432b1b',
      secondaryContainer: '#5b4231', onSecondaryContainer: '#ffdcc7',
      tertiary: '#c8ca9e',          onTertiary: '#32330e',
      tertiaryContainer: '#474923',  onTertiaryContainer: '#e4e6b8',
      // Terra dark surface — slight warm tint
      surface: '#1c1814',           onSurface: '#e7e2de',
      surfaceVariant: '#4a3e38',    onSurfaceVariant: '#d8c4b8',
      surfaceContainerLow: '#17130e',
      surfaceContainer: '#211d18',
      surfaceContainerHigh: '#2b2722',
      surfaceContainerHighest: '#35312b',
      outline: '#9e8c82',           outlineVariant: '#4a3e38',
    },
  },

  // ── Rose ──────────────────────────────────
  {
    id: 'rose',
    label: 'Rose',
    swatch: '#bd2e5b',
    light: {
      primary: '#bc0049',           onPrimary: '#ffffff',
      primaryContainer: '#ffd9e1',  onPrimaryContainer: '#400014',
      secondary: '#75585f',         onSecondary: '#ffffff',
      secondaryContainer: '#ffd9e1', onSecondaryContainer: '#2b161c',
      tertiary: '#785a0d',          onTertiary: '#ffffff',
      tertiaryContainer: '#ffdf93',  onTertiaryContainer: '#261a00',
      surface: '#fff8f7',           onSurface: '#221a1b',
      surfaceVariant: '#f3dde1',    onSurfaceVariant: '#524345',
      surfaceContainerLow: '#faf1f2',
      surfaceContainer: '#f4ebed',
      surfaceContainerHigh: '#eee6e7',
      surfaceContainerHighest: '#e8e0e2',
      outline: '#857273',           outlineVariant: '#d8c2c4',
    },
    dark: {
      primary: '#ffb1c1',           onPrimary: '#65002c',
      primaryContainer: '#8f0041',  onPrimaryContainer: '#ffd9e1',
      secondary: '#e5bdc2',         onSecondary: '#432a2f',
      secondaryContainer: '#5b4045', onSecondaryContainer: '#ffd9e1',
      tertiary: '#dec46b',          onTertiary: '#3f2e00',
      tertiaryContainer: '#5a441a',  onTertiaryContainer: '#ffdf93',
      // Rose dark surface — slight rose tint
      surface: '#1f1517',           onSurface: '#e8e0e2',
      surfaceVariant: '#4a3d40',    onSurfaceVariant: '#d8c2c4',
      surfaceContainerLow: '#1a1012',
      surfaceContainer: '#24191b',
      surfaceContainerHigh: '#2e2225',
      surfaceContainerHighest: '#382b2e',
      outline: '#9e888c',           outlineVariant: '#4a3d40',
    },
  },

  // ── Teal ──────────────────────────────────
  {
    id: 'teal',
    label: 'Teal',
    swatch: '#00796b',
    light: {
      primary: '#006a5e',           onPrimary: '#ffffff',
      primaryContainer: '#6ef7e0',  onPrimaryContainer: '#00201b',
      secondary: '#4a635e',         onSecondary: '#ffffff',
      secondaryContainer: '#cde8e2', onSecondaryContainer: '#05201b',
      tertiary: '#436278',          onTertiary: '#ffffff',
      tertiaryContainer: '#cae6ff',  onTertiaryContainer: '#001e2f',
      surface: '#f4faf8',           onSurface: '#161d1b',
      surfaceVariant: '#dbe5e2',    onSurfaceVariant: '#404a47',
      surfaceContainerLow: '#eef4f2',
      surfaceContainer: '#e9efed',
      surfaceContainerHigh: '#e3eae7',
      surfaceContainerHighest: '#dee4e2',
      outline: '#6f7976',           outlineVariant: '#bfc9c6',
    },
    dark: {
      primary: '#4edac9',           onPrimary: '#00382f',
      primaryContainer: '#004f46',  onPrimaryContainer: '#6ef7e0',
      secondary: '#b2ccc6',         onSecondary: '#1c3531',
      secondaryContainer: '#324b47', onSecondaryContainer: '#cde8e2',
      tertiary: '#aeccf2',          onTertiary: '#0d3347',
      tertiaryContainer: '#2b4a5f',  onTertiaryContainer: '#cae6ff',
      // Teal dark surface — slight teal tint
      surface: '#0f1a18',           onSurface: '#dee4e2',
      surfaceVariant: '#3a4441',    onSurfaceVariant: '#bfc9c6',
      surfaceContainerLow: '#0a1512',
      surfaceContainer: '#14201d',
      surfaceContainerHigh: '#1e2a27',
      surfaceContainerHighest: '#283432',
      outline: '#88938f',           outlineVariant: '#3a4441',
    },
  },
];

/* ── Helpers ─────────────────────────────────────── */

const PROPERTY_MAP: [keyof ColorTokens, string][] = [
  // Primary
  ['primary',            '--md-sys-color-primary'],
  ['onPrimary',          '--md-sys-color-on-primary'],
  ['primaryContainer',   '--md-sys-color-primary-container'],
  ['onPrimaryContainer', '--md-sys-color-on-primary-container'],
  // Secondary
  ['secondary',          '--md-sys-color-secondary'],
  ['onSecondary',        '--md-sys-color-on-secondary'],
  ['secondaryContainer', '--md-sys-color-secondary-container'],
  ['onSecondaryContainer','--md-sys-color-on-secondary-container'],
  // Tertiary
  ['tertiary',           '--md-sys-color-tertiary'],
  ['onTertiary',         '--md-sys-color-on-tertiary'],
  ['tertiaryContainer',  '--md-sys-color-tertiary-container'],
  ['onTertiaryContainer','--md-sys-color-on-tertiary-container'],
  // Surface
  ['surface',             '--md-sys-color-surface'],
  ['onSurface',           '--md-sys-color-on-surface'],
  ['surfaceVariant',      '--md-sys-color-surface-variant'],
  ['onSurfaceVariant',    '--md-sys-color-on-surface-variant'],
  ['surfaceContainerLow', '--md-sys-color-surface-container-low'],
  ['surfaceContainer',    '--md-sys-color-surface-container'],
  ['surfaceContainerHigh','--md-sys-color-surface-container-high'],
  ['surfaceContainerHighest', '--md-sys-color-surface-container-highest'],
  // Outline
  ['outline',        '--md-sys-color-outline'],
  ['outlineVariant', '--md-sys-color-outline-variant'],
];

export function getScheme(id: string): ColorScheme {
  return SCHEMES.find(s => s.id === id) ?? SCHEMES[0];
}

function resolveDefaultId(): string {
  const cfgId = siteConfig.defaultColorScheme;
  if (cfgId && SCHEMES.some(s => s.id === cfgId)) return cfgId;
  return SCHEMES[0].id;
}

export function getDefaultSchemeId(): string {
  return resolveDefaultId();
}

export function getActiveSchemeId(): string {
  if (typeof localStorage === 'undefined') return resolveDefaultId();
  const saved = localStorage.getItem('gf-color');
  if (saved && SCHEMES.some(s => s.id === saved)) return saved;
  return resolveDefaultId();
}

export function hasCustomScheme(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const saved = localStorage.getItem('gf-color');
  return !!saved && SCHEMES.some(s => s.id === saved);
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

/** Generate the inline anti-FOUC script.
 *  Embeds only the default scheme data to keep the script small.
 *  Applies default scheme colors before paint, preventing flash.
 *  Custom-scheme users will get their scheme after Svelte hydrates. */
export function getColorFoucScript(): string {
  const propNames = PROPERTY_MAP.map(([, p]) => p);
  const def = SCHEMES.find(s => s.id === resolveDefaultId()) || SCHEMES[0];
  const defaultTokens = [
    PROPERTY_MAP.map(([k]) => def.light[k]),
    PROPERTY_MAP.map(([k]) => def.dark[k]),
  ];
  const propsJson = JSON.stringify(propNames);
  const tokensJson = JSON.stringify(defaultTokens);
  return `(function(){var P=${propsJson},T=${tokensJson};try{var t=localStorage.getItem('gf-theme'),d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches),a=T[d?1:0],r=document.documentElement;for(var i=0;i<P.length;i++)r.style.setProperty(P[i],a[i]);r.setAttribute('data-color-scheme',${JSON.stringify(def.id)});if(t==='light'||t==='dark')r.setAttribute('data-theme',t)}catch(e){}})()`;
}
