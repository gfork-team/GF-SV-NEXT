import { i18nConfig, type Lang } from '$i18n';
import { shouldShowAds } from '$lib/config';
import type { LayoutServerLoad } from './$types';

export const prerender = true;

export const load: LayoutServerLoad = ({ params }) => {
	const lang = (params.lang as Lang) || i18nConfig.defaultLang;
	return { lang, showAds: shouldShowAds(lang) };
};