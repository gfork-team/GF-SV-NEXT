import { i18nConfig, type Lang } from './types';
import zhHans from './zh-hans.json';
import zhHant from './zh-hant.json';
import en from './en.json';
import ja from './ja.json';

const translations: Record<Lang, Record<string, string>> = {
	'zh-hans': zhHans as Record<string, string>,
	'zh-hant': zhHant as Record<string, string>,
	en: en as Record<string, string>,
	ja: ja as Record<string, string>
};

export function t(lang: Lang, key: string, vars?: Record<string, string>): string {
	const dict = translations[lang] || translations[i18nConfig.defaultLang];
	let text = dict[key] ?? key;
	if (vars) {
		Object.entries(vars).forEach(([k, v]) => {
			text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
		});
	}
	return text;
}

export { i18nConfig, type Lang };

export function getLangFromPath(pathname: string): Lang {
	const match = pathname.match(/^\/(zh-hans|zh-hant|en|ja)(?:\/|$)/);
	const lang = match?.[1];
	return isValidLang(lang) ? lang : i18nConfig.defaultLang;
}

export function isValidLang(lang: string | undefined): lang is Lang {
	return !!lang && i18nConfig.supportedLangs.includes(lang as Lang);
}
