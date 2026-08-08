import { redirect } from '@sveltejs/kit';
export const load = () => { redirect(301, '/zh-hans/s'); };
export const prerender = true;
