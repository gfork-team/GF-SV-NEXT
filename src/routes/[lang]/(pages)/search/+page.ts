import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const prerender = true;

/**
 * 高级搜索表单页已下线 —— lookup 页侧边栏已经覆盖同样的筛选能力
 * （排序、语言、安装量/评分/日期、按站点、脚本语言多选）。
 *
 * 这里保留一条 301 → /{lang}/lookup：
 * - 旧外链、收藏、搜索引擎收录的 URL 不会 404；
 * - prerender 依旧会为它生成静态跳转存根（与根路由 /l 同一手法）。
 */
export const load: PageLoad = ({ params }) => {
	redirect(301, `/${params.lang}/lookup`);
};
