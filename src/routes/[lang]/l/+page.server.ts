import { i18nConfig, type Lang } from '$i18n';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const entries = () => i18nConfig.supportedLangs.map(lang => ({ lang }));

export const load: PageServerLoad = ({ params }) => {
	const lang = (params.lang as Lang) || i18nConfig.defaultLang;
	return { lang };
};
