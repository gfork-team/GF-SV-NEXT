/**
 * 展示层格式化工具（安装量 / 日期 / 相对时间 / 评分占比）
 *
 * 规则：所有数字来自接口真实字段，缺字段时由调用方隐藏该行，
 * 绝不在这里编造默认值。
 */

import { t, type Lang } from '$i18n';

/** 安装量紧凑格式：中文用「万」，英日用 K / M。 */
export function formatCount(n: number | null | undefined, lang: Lang): string {
	if (n == null || !Number.isFinite(n)) return '—';
	const v = Math.max(0, Math.floor(n));
	if (v < 1000) return String(v);

	if (lang === 'zh-hans' || lang === 'zh-hant') {
		if (v < 10000) return v.toLocaleString('zh-CN');
		if (v < 100000000) {
			const wan = v / 10000;
			return `${wan < 100 ? wan.toFixed(1) : Math.round(wan)}万`;
		}
		return `${(v / 100000000).toFixed(1)}亿`;
	}

	if (v < 1000000) return `${(v / 1000).toFixed(1)}K`;
	return `${(v / 1000000).toFixed(1)}M`;
}

/** 评分占比（好评率），无评分返回 null —— 调用方据此隐藏该指标。 */
export function ratingPercent(
	good?: number | null,
	ok?: number | null,
	bad?: number | null
): number | null {
	const g = good ?? 0;
	const o = ok ?? 0;
	const b = bad ?? 0;
	const total = g + o + b;
	if (total <= 0) return null;
	return Math.round((g / total) * 100);
}

/** YYYY-MM-DD（按语言本地化月份无关，保持可读一致） */
export function formatDate(iso: string | null | undefined, lang: Lang): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '—';
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	void lang;
	return `${y}-${m}-${day}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** 相对时间：3 天前 / 刚刚 —— 未来时间按「刚刚」处理。 */
export function formatRelative(iso: string | null | undefined, lang: Lang): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '—';
	const diff = Date.now() - d.getTime();
	if (diff < MINUTE) return t(lang, 'time.justNow');
	if (diff < HOUR) return t(lang, 'time.minutesAgo', { n: String(Math.floor(diff / MINUTE)) });
	if (diff < DAY) return t(lang, 'time.hoursAgo', { n: String(Math.floor(diff / HOUR)) });
	if (diff < MONTH) return t(lang, 'time.daysAgo', { n: String(Math.floor(diff / DAY)) });
	if (diff < YEAR) return t(lang, 'time.monthsAgo', { n: String(Math.floor(diff / MONTH)) });
	return t(lang, 'time.yearsAgo', { n: String(Math.floor(diff / YEAR)) });
}

/** 描述截断（卡片用），按字符计。 */
export function truncate(text: string, max: number): string {
	const s = text.replace(/\s+/g, ' ').trim();
	return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/** 从 install 链接 / code_url 提取脚本 id（详情页用），失败返回 null。 */
export function parseScriptIdFromUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	const m = url.match(/\/scripts?\/(\d+)/) || url.match(/^\/(\d+)\//);
	return m ? m[1] : null;
}
