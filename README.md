# GFork SvelteKit

> **⚠️ 请维护者动态维护此 README — 任何配置/结构变更必须同步更新本文档**

> Greasy Fork 脚本加速访问代理 | SvelteKit 重构版
> 多 CDN 节点 · 竞速搜索 · 多语言 · MD3 设计

---

## 一、目录结构

```
gf-home-next/
├── src/
│   ├── config/              ← 站点配置（拆分模块）
│   │   ├── adsense.ts       AdSense 广告配置
│   │   ├── cdn.ts           CDN 与构建配置
│   │   ├── download.ts      下载测速节点
│   │   ├── external.ts      外部链接
│   │   ├── index.ts         聚合入口 → siteConfig
│   │   ├── lookup.ts        Lookup/search API 节点与签名
│   │   ├── redirects.ts     重定向延时
│   │   ├── seo.ts           SEO / OG 配置
│   │   ├── site.ts          站点基础（名称/域名/图标/页脚/GitHub）
│   │   └── sponsor.ts       赞助商
│   ├── lib/
│   │   ├── config.ts        ← 重新导出到 src/config/index.ts
│   │   ├── cdn-toggle.ts    CDN 开关（独立文件，防常量折叠）
│   │   ├── components/      Svelte 组件
│   │   ├── i18n/            多语言翻译
│   │   └── utils/           工具函数
│   └── routes/              SvelteKit 路由
├── static/                  静态资源
├── build/                   构建输出
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 二、路由速览

| 路由 | 用途 |
|---|---|
| `/[lang]/` | 首页（搜索框 + 推荐 + 广告） |
| `/[lang]/s` | 搜索广告中间页 → 3s 跳 lookup |
| `/[lang]/l` | 下载广告中间页 → 3s 跳 download |
| `/[lang]/search` | 高级搜索表单（Script Search + Advanced Options） |
| `/[lang]/lookup#?...` | 搜索结果页（多节点竞速） |
| `/[lang]/download#/path` | 下载加速（iframe 测速 + 最优节点跳转） |
| `/[lang]/info#/zh-CN/scripts/123/detail` | 脚本/用户详情（hash 路由含 locale） |
| `/[lang]/help` | 帮助页 |
| `/[lang]/installing` | 安装教程 |
| `/[lang]/about` | 关于页 |
| `/[lang]/tos` | 服务条款 |
| `/[lang]/applist` | 推荐脚本列表 |
| `/[lang]/feedback` | 反馈页 |
| `/s` / `/l` | 301 跳到 `/zh-hans/s` / `/zh-hans/l` |

---

## 三、配置指南

所有部署配置集中于 `src/config/` 目录，分为 10 个模块文件 + 1 个聚合入口。

### 模块说明

| 文件 | 配置内容 |
|---|---|
| `site.ts` | 站点名称、域名、描述、关键词、图标、页脚、GitHub、审计、URL 重写规则 |
| `adsense.ts` | AdSense publisherId、GTM、广告位 slot、fluidLayoutKey、DNS 预取 |
| `cdn.ts` | CDN 开关、静态资源源站、站点代理、adsense 脚本地址、构建基础路径 |
| `download.ts` | 下载测速节点列表、超时/缓存/调试参数 |
| `lookup.ts` | 脚本查询 API 节点（primary + backup）、签名配置、info API |
| `redirects.ts` | 搜索/下载跳转页广告展示延时 |
| `seo.ts` | Twitter Card、OG 图片、搜索引擎验证标签 |
| `external.ts` | Tampermonkey / Violentmonkey / GreasyFork 等外部链接 |
| `sponsor.ts` | 赞助商名称、链接、图片 |
| `index.ts` | 聚合入口 — 组装 `siteConfig` 对象 + 导出所有 helper 函数 |

### 向后兼容

`import { siteConfig } from '$lib/config'` 仍然有效。`src/lib/config.ts` 会重新导出 `src/config/index.ts` 的所有内容。

### CDN 镜像 `build/_app` 的操作：

1. 修改 `src/lib/cdn-toggle.ts` 中的 `buildBasePath` 为 `/app`（或其他路径）
2. `npm run build`
3. 将 `build/_app/` 目录上传到 CDN 的 `/app/_app/` 路径下
4. 将 `build/*.html` 部署到 Web 服务器（HTML 中会引用 `/app/_app/...`）

---

## 四、Helper 函数

| 函数 | 用途 |
|---|---|
| `siteUrl(path)` | 拼接规范 URL |
| `staticUrl(path)` | 拼接 CDN 静态资源 URL |
| `siteProxyUrl()` | 返回站点代理源站 URL |
| `ogImageUrl()` | 默认 OG 图片 URL |
| `shouldShowAds(lang)` | 当前语言是否显示广告 |
| `getDownloadDomains()` | 返回打乱顺序的下载节点列表 |
| `getPrimaryLookupNodes()` | 搜索 primary 节点 |
| `getBackupLookupNodes()` | 搜索 backup 节点 |
| `auditEndpoint()` | 审计服务器端点 |

---

## 五、构建命令

```bash
npm install              # 安装依赖
npm run dev              # 开发服务器
npm run build            # 生产构建 → build/
npm run preview          # 预览构建结果
npm run check            # Svelte 类型检查
npm run lint             # ESLint + Prettier 检查
npm run format           # Prettier 格式化
```

`build/` 目录可直接部署到任意静态托管。

---

## 六、CSS 设计规范

遵循 [Material Design 3](https://m3.material.io/develop/web) 的 Design Token 体系：

- 颜色：`--md-sys-color-primary` / `--md-sys-color-surface` / `--md-sys-color-outline-variant` 等
- 形状：`--md-sys-shape-corner-*`（full/small/medium/extra-small）
- 高度：`--md-sys-elevation-*`（0~5）
- 动效：`--md-sys-motion-duration-*` + `--md-sys-motion-easing-*`

Info 页的 API 注入 HTML（`#script-info` / `#script-meta` / `#additional-info` / `#feedback-list`）有独立的 MD3 样式，不依赖原项目 CSS。

---

*最后更新：2026-05-29*
