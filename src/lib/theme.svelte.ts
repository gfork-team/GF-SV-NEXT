/**
 * Theme store — Svelte 5 runes, shared module state.
 *
 * Manages both theme (light/dark/system) and color-scheme.
 * Supports two modes:
 *   - Default: follows site owner setting (SCHEMES[0]), no localStorage entry
 *   - Custom: user explicitly picks a scheme, stored in "gf-color"
 *
 * localStorage keys:
 *   "gf-theme" → "system" | "light" | "dark"
 *   "gf-color" → scheme id (only when user explicitly chooses)
 */

import {
  SCHEMES,
  getActiveSchemeId,
  getDefaultSchemeId,
  hasCustomScheme as hasCustom,
  applyColorScheme,
  saveSchemePreference,
  clearSchemePreference,
} from './colors.ts';

export type Theme = 'system' | 'light' | 'dark';

export type { ColorScheme } from './colors.ts';
export { SCHEMES };

/* ── State ─────────────────────────────────────── */
let _theme = $state<Theme>('system');
let _schemeId = $state<string>(SCHEMES[0].id);
let _customScheme = $state<boolean>(false);

/* ── Accessors ─────────────────────────────────── */
export function getTheme(): Theme { return _theme; }
export function getSchemeId(): string { return _schemeId; }
export function getDefaultSchemeId_(): string { return getDefaultSchemeId(); }
export function hasCustomScheme(): boolean { return _customScheme; }

/* ── Internal apply helpers ─────────────────────── */

function isDark(): boolean {
  if (_theme === 'dark') return true;
  if (_theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme() {
  const root = document.documentElement;
  if (_theme === 'system') {
    root.removeAttribute('data-theme');
    localStorage.removeItem('gf-theme');
  } else {
    root.setAttribute('data-theme', _theme);
    localStorage.setItem('gf-theme', _theme);
  }
}

function applyScheme() {
  applyColorScheme(_schemeId, isDark());
}

/* ── Public API ────────────────────────────────── */

/** Call once in +layout.svelte onMount. */
export function initTheme() {
  const savedTheme = localStorage.getItem('gf-theme') as Theme | null;
  if (savedTheme === 'light' || savedTheme === 'dark') {
    _theme = savedTheme;
  } else {
    _theme = 'system';
  }

  _customScheme = hasCustom();
  _schemeId = getActiveSchemeId();

  applyTheme();
  applyScheme();
}

/** Switch theme (light / dark / system). */
export function setTheme(t: Theme) {
  _theme = t;
  applyTheme();
  applyScheme();
}

/** Switch to a custom color scheme (saves preference). */
export function setScheme(id: string) {
  _schemeId = id;
  _customScheme = true;
  saveSchemePreference(id);
  applyScheme();
}

/** Revert to site default color scheme (removes preference). */
export function resetScheme() {
  _schemeId = getDefaultSchemeId();
  _customScheme = false;
  clearSchemePreference();
  applyScheme();
}

/** Call when system prefers-color-scheme changes (system mode only). */
export function handleSystemChange() {
  if (_theme !== 'system') return;
  applyScheme();
}
