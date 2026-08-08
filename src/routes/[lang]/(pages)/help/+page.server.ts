import { seoPageServerLoad } from '$utils/seo';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = seoPageServerLoad();
