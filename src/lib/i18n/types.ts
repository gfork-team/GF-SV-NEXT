export type Lang = 'zh-hans' | 'zh-hant' | 'en' | 'ja';

export interface I18nConfig {
	defaultLang: Lang;
	supportedLangs: Lang[];
	langNames: Record<Lang, string>;
	langDisplayNames: Record<Lang, string>;
}

export const i18nConfig: I18nConfig = {
	defaultLang: 'zh-hans',
	supportedLangs: ['zh-hans', 'zh-hant', 'en', 'ja'],
	langNames: {
		'zh-hans': 'zh-CN',
		'zh-hant': 'zh-TW',
		en: 'en',
		ja: 'ja'
	},
	langDisplayNames: {
		'zh-hans': '简体字',
		'zh-hant': '正體字',
		en: 'English',
		ja: '日本語'
	}
};
