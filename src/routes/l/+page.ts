import { redirect } from '@sveltejs/kit';
export const load = () => { redirect(301, '/zh-hans/l'); };
export const prerender = true;
