/**
 * CDN 开关 — 默认关闭（本地 dev / build / preview 始终不用 CDN）。
 * 仅在 GitHub Actions 工作流（.github/workflows/deploy.yml）构建时通过
 * VITE_CDN_ENABLED=true 参数启用，将静态资源重写为 CDN 源站地址。
 */
const env =
	(typeof process !== 'undefined' && process.env) ||
	((import.meta as { env?: Record<string, string | undefined> }).env ?? {});

/** CDN 开关 — true 时将静态/API 资源重写为 CDN 源站地址。 */
export const cdnEnabled = env.VITE_CDN_ENABLED === 'true';

/** CDN 静态资源源站（图片、字体、_app 构建产物）。 */
export const cdnStatic = env.VITE_CDN_STATIC || 'https://web-static-origin.dahi.edu.cn.dahi.e.yu.ac.cn';

/** 构建输出基础路径。若将 build/_app 镜像至 CDN 的 /gfork/_app/，则设为 '/gfork'。 */
export const buildBasePath = env.VITE_BUILD_BASE_PATH || '/gfork';
