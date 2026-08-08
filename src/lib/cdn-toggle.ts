/** CDN 开关 — 设为 true 则将静态/API 资源重写为 CDN 源站地址。 */
export const cdnEnabled = true;

/** CDN 静态资源源站（图片、字体、_app 构建产物）。 */
export const cdnStatic = 'https://web-static-origin.dahi.edu.cn.dahi.e.yu.ac.cn';

/** 构建输出基础路径。若将 build/_app 镜像至 CDN 的 /gfork/_app/，则设为 '/gfork'。 */
export const buildBasePath = '/gfork';
