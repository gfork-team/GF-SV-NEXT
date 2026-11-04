# GFork SvelteKit

> **⚠️ 请维护者动态维护此 README — 任何配置/结构变更必须同步更新本文档**

> Greasy Fork 脚本加速访问代理 | SvelteKit 静态构建
> 多 CDN 节点 · 竞速搜索 · 多语言 · 冷加载可读 · MD3 设计

技术栈：SvelteKit 2 + **Svelte 5（runes，`$state` / `$derived` / `$effect` / snippets）** + TypeScript +
`@sveltejs/adapter-static`（`build/` 直接静态托管）+ Tailwind 4 与 MD3 token 变量。

---

## 一、目录结构

```
gfork-sveltekit/
├── src/
│   ├── config/                     ← 全部可调参数（唯一配置入口）
│   │   ├── config.json             站点 / 广告 / 节点 / 跳转 / SEO / 页脚 …（数据）
│   │   ├── dynamic.ts              动态内容模块的策略参数（时序 / 重试 / 缓存）
│   │   └── index.ts                聚合入口 → siteConfig + helper 函数
│   ├── lib/
│   │   ├── config.ts               ← 重新导出 src/config/index.ts（向后兼容）
│   │   ├── cdn-toggle.ts           CDN 开关（独立文件，防常量折叠，勿合并）
│   │   ├── dynamic/                ★ 动态内容统一模块（见第三节）
│   │   │   ├── core/request.ts     全站唯一的请求出口
│   │   │   ├── core/resource.svelte.ts  资源状态机（data 初值 = fallback）
│   │   │   ├── core/Slot.svelte    默认内容 → 覆盖的渲染槽
│   │   │   ├── core/patch.ts       字段映射 / 列表补齐 / HTML sanitize
│   │   │   ├── blocks/             每个动态区块一个文件
│   │   │   └── index.ts            统一导出
│   │   ├── components/             Svelte 组件（Nav / Footer / SearchBar / Ad …）
│   │   ├── i18n/                   zh-hans / zh-hant / en / ja 四套词条
│   │   ├── scripts.ts              脚本数据模型与链接规则（纯函数）
│   │   ├── format.ts               安装量 / 日期 / 相对时间格式化
│   │   ├── search-params.ts        搜索参数（含 `entry_locales[]` 多值键）
│   │   ├── locale-options.ts       脚本语言筛选选项（首页高级搜索 / lookup 共用）
│   │   ├── colors.ts               MD3 配色 + FOUC 内联脚本
│   │   ├── theme.svelte.ts         主题状态
│   │   ├── ad-state.svelte.ts      AdSense 状态
│   │   ├── audit.ts                审计上报（走 request.ts）
│   │   └── utils/index.ts          scriptTag 等小工具
│   └── routes/                     SvelteKit 路由（全部 prerender）
├── static/                         静态资源 + edgeone.json（托管重写规则）+ 手写 404.html
├── scripts/minify-html.js          postbuild：压缩 build/*.html
├── build/                          构建输出（可直接静态托管）
├── svelte.config.js                 adapter-static / prerender entries / alias
├── vite.config.ts                   define __APP_VERSION__ + __APP_VERSION_TIME__
├── tsconfig.json
└── package.json
```

---

## 二、路由速览

| 路由                                      | 用途                                                           |
| ----------------------------------------- | -------------------------------------------------------------- |
| `/[lang]/`                                | 首页（搜索框 + 折叠高级搜索 + 常用服务 + 广告）                |
| `/[lang]/s`                               | 搜索广告中间页 → 延时跳 `/lookup`                              |
| `/[lang]/l`                               | 下载广告中间页 → 延时跳 `/download`                            |
| `/[lang]/search`                          | **已下线**：`301` → `/[lang]/lookup`（HTML 为跳转存根）        |
| `/[lang]/lookup#?...`                     | 搜索结果页（多节点竞速）。**不作为入口暴露**，只由搜索动作进入 |
| `/[lang]/download#/path`                  | 下载加速（节点测速 + 最优节点跳转）                            |
| `/[lang]/info#/zh-CN/scripts/123/detail`  | 脚本详情 / 反馈 / 作者（hash 路由，含 GF locale）              |
| `/[lang]/help` `about` `tos` `installing` | 静态内容页                                                     |
| `/[lang]/applist`                         | 用户脚本管理器清单（**纯静态，无动态区块**）                   |
| `/[lang]/feedback`                        | 反馈页（表单指向外部渠道）                                     |
| `/s`                                      | 特殊入口：prerender 页面，JS 转发到 `/{默认语言}/s?qs`         |
| `/l`                                      | 特殊入口：`301` 到 `/zh-hans/l`（`+page.ts`，HTML 为存根）     |
| `/sitemap.xml` `/robots.txt`              | 由 `+server.ts` 预渲染                                         |

语言：`zh-hans` / `zh-hant` / `en` / `ja`，全部由 `src/lib/i18n/types.ts` 的
`i18nConfig.supportedLangs` 驱动，`svelte.config.js` 的 `prerender.entries` 与各
`+page.server.ts` 的 `entries()` 都读它 —— **新增语言只需改这一处 + 加一份 JSON**。

---

## 三、动态内容统一模块（`src/lib/dynamic/`）

### 3.1 目标与「冷加载」定义

页面上凡是「由 API 异步填充」的内容，都走同一套模块，规则只有三条：

1. **构建期就完整**：prerender 把每个区块的完整 DOM 结构与默认文案写进 HTML，
   默认文案来自 i18n，按语言分别预构建。
2. **水合后只覆盖**：浏览器水合后由统一模块发请求，完成后只替换文字 / 属性，
   不重建子树、不改变布局。
3. **冷加载必须可读**：用户首次访问、无缓存、无 JS 状态、API 未返回时，
   页面也要完整可读、版面稳定 —— 效果等同「禁用 JS 时看到的页面」。
   缓存只能加速二次访问，**不得改变首屏**。

### 3.2 模块职责

| 文件                      | 职责                                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/request.ts`         | **全站唯一允许出现 `fetch(` 的地方**。AbortController 超时、lookup 多节点竞速、primary→backup 回退、错误归一化 `{ok:false,reason}`、同 key 并发去重、可选 TTL 缓存、签名 `ss`。 |
| `core/resource.svelte.ts` | `createResource({key, fetcher, fallback, ttlSec})`。状态 `idle → loading → ready / error`，`data` 初值就是 fallback；一个 resource 可被多个区块绑定，一次请求多处覆盖。         |
| `core/Slot.svelte`        | 渲染默认内容，ready 后覆盖。用 `$effect` 在浏览器里触发 `resource.load()`（prerender / SSR 不执行 effect，**永不发请求**）。状态通过 `data-state` 暴露给 CSS。                  |
| `core/patch.ts`           | 字段 → 文字 / 属性的映射；列表占位行；HTML 片段 sanitize（DOMPurify 白名单）；`document.title` 覆盖。                                                                           |
| `blocks/*`                | 每个动态区块一个文件：`id` + resource 定义 + `mapper`（API → 视图）+ fallback 的 i18n key。                                                                                     |

`data-state` 取值：`idle`（构建期/未开始）、`loading`、`ready`、`error`
（列表区块另有 `empty`，倒计时区块是 `running` / `ready`）。
CSS 只按属性选择器写样式，**不做运行时 class 切换**，所以首帧就是最终态。

### 3.3 区块清单

| 区块 id              | 类型               | 数据来源                                       | 挂载位置                       | 默认内容（i18n）                                               |
| -------------------- | ------------------ | ---------------------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| `mirror-status`      | `probe`            | 站点自身 `/ping` 的响应头                      | 首页 hero 底部（**默认关闭**） | `mirror.checking` + 空延迟/节点槽；`mirrorStatus.enabled` 控制 |
| `search-suggestions` | `race`（顺序回退） | lookup 节点                                    | 顶栏 / 首页 / lookup 侧栏      | 无占位（用户没输入就不该暗示有结果）                           |
| `lookup-results`     | `race` + `list`    | lookup 节点（primary+backup 全并发，首个成功） | `/[lang]/lookup`               | 状态条 + **100 行占位卡片** + 加载遮罩                         |
| `script-info`        | `text` + `html`    | `infoApi.primary` 的 detail / feedback / user  | `/[lang]/info`                 | 标题 / 作者·版本·安装量·评分 / **10 行描述骨架** / 遮罩        |
| `download-probe`     | `probe` + `list`   | 出口 IP 走 request；节点用隐藏 iframe 探测     | `/[lang]/download`             | 标题 + 状态 + 3 行节点行（域名取自 config）+ 进度条            |
| `countdown`          | `countdown`        | 无请求，纯本地计时                             | `/[lang]/s` `/[lang]/l` `/s`   | `redirect.waiting`（`{countdown}` 秒后到达）+ 进度条           |

区块之间互不依赖：某个区块失败只会把它自己降级成 fallback + 错误文案，
不会阻塞其他区块。

### 3.3.1 「结构不动、只换文字」是怎么做到的

冷加载最容易踩的坑不是文案，而是**数据到达时把 DOM 重建一遍**。当前做法：

| 做法                 | 说明                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **列表按下标做 key** | `{#each rows as row, i (i)}`。占位行 id 是负数、真实行是正数，用 id 做 key 会在数据到达时把 100 个 `<li>` 全销毁重建；按下标复用后只改文字，超出的占位行才删除 |
| **空槽恒定输出**     | `StatBar` 四个指标、卡片版本徽标、卡片标题 `<a>`、骨架块都**常驻 DOM**，缺数据时用 `hidden` 收起，而不是 `{#if}` 增删                                          |
| **遮罩只盖可见段**   | `.lk-shield` / `.if-shield` 用 `position: sticky` + 负 margin：覆盖当前视口那一段，滚动跟随，且不额外占高度；`ready` 后 `hidden`                               |
| **骨架行数可调**     | `dynamic.ts → list.placeholderRows`（默认 100）、`ScriptInfoBlock` 的 `infoLines`（默认 10）控制预渲染行数，撑住高度以减少到达后的跳变                         |

代价：lookup 的预渲染 HTML 会明显变大（100 行 × 4 语言）。觉得重就调小
`placeholderRows`，遮罩逻辑不用动。

### 3.4 新增一个区块

1. 在 `blocks/` 建 `<name>.svelte.ts`：定义 `const X_BLOCK_ID`、`mapper`、
   `fallback`（i18n key）与 `createXResource(...)` / `createXController(...)`。
2. 需要渲染就用 `core/Slot.svelte` 包住默认内容，或在区块组件自己的容器上写
   `data-block` / `data-state`（列表 / 表格类区块直接挂在 `<ul>` 上，避免多包一层）。
3. 在 `blocks/` 建 `<Name>Block.svelte`：只负责渲染与交互，请求交给 resource。
4. i18n 四份 JSON 都要加默认文案；页面里只写 `<XBlock {lang} />`。

### 3.5 请求规则（改代码前必读）

- 除 `core/request.ts` 外，仓库里不允许出现 `fetch(`。需要数据 → resource → request。
- 端点、超时、重试、TTL **一律来自 `src/config/`**，模块内不得硬编码。
- 同 key 并发去重：同一页面同一份数据只会发一次请求（Network 面板可验证）。
- TTL 缓存只用于二次访问（`dynamic.ts → cache.ttlSec`），冷加载不会命中。
- 请求失败一律归一化成 `{ ok: false, reason }`，不向上抛异常。

### 3.6 安全：HTML 片段必须消毒

info 页的 4 个远端片段（`#script-header` / `#script-meta` / `#additional-info` /
`#feedback-list`）在 `blocks/info.svelte.ts` 的 mapper 里先过
`core/patch.sanitize`（DOMPurify 白名单：保留描述性标签与图片，禁 script / style /
iframe / form，去 style 与事件属性，禁未知协议），然后注入到固定的容器里。

> SSR 阶段 `DOMPurify.isSupported === false`，`sanitize()` 直接返回空串：
> 构建产物里只有我们自己的骨架，**永远不会把远端 HTML 写进静态 HTML**。

### 3.7 列表接口的响应信封（两种都要认）

lookup 节点在不同版本下返回两种信封，统一由 `$lib/scripts` 的
`readScriptList(json)` 收口，区块 mapper 不再自己解结构：

```jsonc
// 新版（当前线上）：裸数组，一条 = 一个脚本
[{ "id": 407485, "name": "…", "daily_installs": 53, "fan_score": "96.5", "users": [ … ], … }]

// 旧版：包一层，还带分页与跳转指令
{ "query": [ … ], "total": 100, "options": { "per_page": 100 },
  "redirect": false, "target_url": "", "message": "" }
```

`readScriptList(json, requestedPerPage)` 统一产出 `{ items, perPage, redirect? }`：

- **`perPage`**：旧版优先读 `options.per_page`；新版是裸数组、没有分页元信息，
  所以搜索请求会**显式带上 `per_page`**（`dynamicConfig.list.perPage`，默认 100），
  用它作为每页条数；两者都没有才退化成「本次返回条数」。
- **`hasMore`**：`items.length >= perPage`。用「接口原始条数」而不是过滤后的行数，
  这样个别脏行被丢弃也不会误关「下一页」；尾页（不足 per_page）才关。
- **`per_page` 只进请求参数，不进 hash** —— 地址栏 `#?...` 的格式保持不变。
- **`redirect`**：只有旧版会出现，命中时仍按原逻辑 `alert` + 跳回官方站。

字段层面只取视图需要的键（`normalizeScript`），新版的 `support_url` /
`contribution_url` / `contribution_amount` 等暂未展示的字段会被忽略；
`fan_score` 是字符串（`"96.5"`）也照旧转成数字，`license` 为 `null` 时不补值。

---

## 四、配置指南

所有可调参数集中在 `src/config/`，只有两个文件。

### 4.1 `config.json`（数据）

| 字段                                                          | 内容                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| `site`                                                        | 站点名、域名、描述、关键词、默认配色、联系邮箱密文（见 4.4）  |
| `favicon` / `seo` / `footer` / `github` / `links` / `sponsor` | 图标、OG、页脚、外链、赞助商                                  |
| `adsense`                                                     | publisherId、GTM、广告位 slot、允许语言、DNS 预取             |
| `cdn`                                                         | 站点代理源站、adsense 脚本地址                                |
| `downloadNodes`                                               | 下载测速节点列表（构建期占位行也用它）                        |
| `download`                                                    | 测速超时、缓存天数/键、各阶段等待、是否用查询串               |
| `lookupNodes`                                                 | 查询 API 节点：`primary` + `backup`（id / endpoint / method） |
| `lookupSignature`                                             | 节点签名模式与 `ss` 截断长度                                  |
| `infoApi`                                                     | 详情 / 反馈 / 作者 API 源站                                   |
| `redirects`                                                   | `/s`、`/l` 中间页延时（秒）                                   |
| `urlRewriteRules`                                             | 首页 URL 工具的改写规则                                       |
| `mirrorStatus`                                                | 首页镜像状态胶囊开关（`enabled: false` = 整栏不渲染、不探活） |
| `audit` / `announce` / `search`                               | 审计、公告、站点过滤开关                                      |

### 4.2 `dynamic.ts`（策略）

| 字段                          | 说明                                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| `endpoints.mirror`            | 镜像探活路径（默认 `/ping`）                                       |
| `endpoints.ipTrace`           | 出口 IP 回显（下载缓存键需要）                                     |
| `timeout.*`                   | `lookup` / `suggestions` / `info` / `mirror` / `ip` / `download`   |
| `retry.attempts`              | 含首次的总尝试次数；竞速整轮失败后会按 `delaysMs` 重来             |
| `retry.delaysMs`              | 每次重试前的等待                                                   |
| `cache.ttlSec`                | 二次访问的内存 TTL（0 = 关闭）                                     |
| `list.placeholderRows`        | 列表区块在构建期渲染的占位行数                                     |
| `list.perPage`                | 搜索请求的每页条数（新版裸数组没有分页元信息，靠它判断「下一页」） |
| `countdown.tickMs`            | 倒计时节拍                                                         |
| `debounceMs`                  | hash 变化 / 搜索输入去抖                                           |
| `refresh.mirrorSec`           | 首页镜像状态后台重探间隔                                           |
| `download.gapMs` / `settleMs` | 测速节点之间 / 选中最优后的等待                                    |

### 4.3 广告（AdSense）

广告是收益面，所有开关都在 `config.json → adsense`，组件里不写死槽位。

| 配置                                           | 作用                                                                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `publisherId` / `gtmId` / `enabled`            | 基础信息与总开关                                                                                                                                     |
| `allowedLangs`                                 | 允许投放的语言（空数组 = 全部）。**`Ad` 组件与 layout 注入脚本共用 `shouldShowAds()`**，避免「渲染了槽位但没加载 SDK」                               |
| `slots.*`                                      | 广告单元 id，5 个位置各自独立：`fluid` `auto` `horizontal` `autorelaxed` `sidebar`。后台换单元**只改这里**                                           |
| `fluidLayoutKey`                               | fluid 单元布局 key                                                                                                                                   |
| `lazyLoad` / `lazyRootMargin`                  | 投放半径。`true` = 进入半径才 push（viewability ↑、展示量 ↓）；`false`（**当前**）= 加载即全部投放，保展示量。两种模式都**不会**投放结构性隐藏的槽位 |
| `keepReserveOnFill`                            | 已填充时是否保留预留高度。`true`（默认）= 零 CLS；`false` = 填满即贴合，但广告比预留矮时会跳一次                                                     |
| `reserveTimeoutMs`                             | 「已发起投放」后多久还没 `data-ad-status` 就收掉预留（被拦截 / 静默失败的兜底）                                                                      |
| `inFeedAfter`                                  | lookups 结果列表的 in-feed 单元插入位置（第 N 条之后）；`0` = 关闭。只在有真实结果时渲染                                                             |
| `allowOnRedirectPages` / `allowOnDownloadPage` | 页面级开关                                                                                                                                           |
| `dnsPrefetch`                                  | 与 `preconnect` 成对输出，缩短 SDK 首字节                                                                                                            |

**单元与位置（当前，改动广告位时同步这张表）**

| 单元         | 类型          | 位置                                                                                                                                          |
| ------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `1394739154` | `fluid`       | 首页 hero 下方 / applist / feedback / help / info / installing / lookup（底部 + **结果内 in-feed**）/ search 顶部 / tos（正文内）             |
| `4095096984` | `auto`        | 首页 / about / download / feedback / info / installing / lookup / search / s / l / tos                                                        |
| `1008349318` | `horizontal`  | 首页 / about（正文内）/ applist（正文内）/ help（正文内）/ info（正文内）/ installing / lookup / search / tos / **download 窄屏顶替竖版侧栏** |
| `3934604756` | `autorelaxed` | 首页底部 / about / applist / help / s / l / tos                                                                                               |
| `4497590737` | `sidebar`     | lookup / download（≤839px 由 `1008349318` 全宽顶替）                                                                                          |

> **DOM 里的 `<ins>` 数 ≠ 实际投放数。** `hidden` 容器与 `display:none` 的槽位不会 push
> （见规则 3），所以 info 页那两个 `horizontal` 同一时刻只有一个在投放；
> download 的 `sidebar` / `horizontal` 按 839px 断点二选一。改动时不要按 DOM 数量判断曝光。
>
> **in-feed 单元**（`lookup` 结果第 `adsense.inFeedAfter` 条之后）只在有真实结果时渲染，
> 构建产物里看不到；它与页面底部的 `fluid` 同单元是预期行为 —— fluid 本就是「在信息流里
> 重复投放」的格式。`/search` 与 `/s` `/l` 曾各有一处同页重复，`/search` 已删掉低可见的
> 那个（高级筛选表单末尾），`/s` `/l` 的 `auto×2` 保留（中间页只活 1–2 秒，删掉不划算）。

**投放规则（改代码前必读）**

1. 一个文档只注入一份 `adsbygoogle.js`：`[lang]/+layout.svelte` 负责；根 `/s`、`/l`
   与 `+error.svelte` 只在「不在该布局内」时自带（错误页按 `page.data.lang` 判断）。
2. 每个 `<ins>` 只 push 一次（`data-gf-requested` 幂等，SPA 重挂载安全）。
3. push 条件 = **进入投放半径** 且 **同意状态已知** 且 **未被拦截**。
   - `lazyLoad: true` → 半径 = `lazyRootMargin`（默认 600px），进入才投放；
   - `lazyLoad: false`（当前配置）→ 半径等效无限，页面加载即全部投放，保展示量；
   - 两种模式都**不会**投放 `display:none` 里的槽位（移动端隐藏的侧栏、未激活的
     tab 面板）：它们永远看不到，只会产生 0 viewability 曝光和 Google 的
     `availableWidth=0` 报错；切到可见时观察器会再触发一次，届时才投放。
4. 同意策略：同意 → 普通队列；拒绝 → `googlefc` 的 `npa:1` 非个性化通道；未表态 → 不投。
5. 高度策略：未表态 / 被拦截 / `unfilled` → 立即收掉预留；`filled` → 默认保留
   （CLS 是搜索排名因素，用长期流量换一次跳动不划算）。
6. 窄屏（≤839px）隐藏 `sidebar` 竖版单元：300px 固定单元在窄屏会报 `availableWidth=0`。

### 4.4 联系方式

只有两个渠道，配置全在 `config.json`：

| 渠道   | 配置                                               | 说明                                                                                                                 |
| ------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 邮箱   | `site.contactEmailCipher` + `site.contactEmailKey` | XOR + Base64 密文，**构建产物里只有占位符**，浏览器端解密后才渲染 `mailto:`。改邮箱用 `npm run mail:encode` 重新生成 |
| GitHub | `github.repo`                                      | 公开地址（`github.com/greasyfork-proxy/GreasyFork-Mirror`），直接渲染；Issues 作为第二种反馈渠道                     |

**分布（唯一渲染入口是 `ContactChannels.svelte`，别在页面里各写一套）**

| 位置                  | 内容                            |
| --------------------- | ------------------------------- |
| 页脚（全站可达）      | 「与我们反馈问题」+ GitHub 仓库 |
| `/[lang]/feedback`    | 完整两个渠道 + 各自适用场景     |
| `/[lang]/about`       | Contact 卡片：完整两个渠道      |
| `/[lang]/tos` 第 7 节 | 条款措辞 + 邮箱 + GitHub 仓库   |

> 邮箱加密的代价：**禁用 JS 时只看到 `••••••••@••••••` 占位**，无法直接联系。
> 这是「明文不进 HTML」的取舍；如需兜底，在 `ContactEmail.svelte` 里加
> `<noscript>` 文本形式（例如 `name [at] domain`）即可，但会牺牲一部分防采集效果。

### 4.5 CDN 镜像 `build/_app` 的操作

1. 修改 `src/lib/cdn-toggle.ts` 的 `buildBasePath` 为 `/app`（或其他路径）；
2. `npm run build`；
3. 把 `build/_app/` 上传到 CDN 的 `/app/_app/`；
4. 把 `build/*.html` 部署到 Web 服务器（HTML 中会引用 `/app/_app/...`）。

`cdn-toggle.ts` 故意独立成文件：它必须保持「非常量可折叠」的形态，
**不要合并进 `config/index.ts`**。

---

## 五、多语言（i18n）

- 词条：`src/lib/i18n/{zh-hans,zh-hant,en,ja}.json`，扁平 key（`lookup.title` 形式）。
- 取值：`t(lang, key, vars?)`，未命中时回落 key 本身 —— 所以**新 key 必须四份都加**。
- 动态区块的 fallback 文案全部走 i18n，构建期按语言写进各自的 HTML。
- 语言列表只在 `i18nConfig.supportedLangs` 维护，prerender 与 `entries()` 都读它。
- **当前 322 条/语言**（曾 430）。功能下线后已清理过一轮死词条；新增词条请随手删旧的。
  清理口径：扫 `src/**` 里的字面量引用，保留 `home.hot.` 这类动态拼接前缀下的 key。
- 文案格式约定：`标题 — 描述` 用**全角破折号**分隔（首页核心特色卡片会按它拆分），
  不要用 ASCII `-`，否则 `Multi-CDN` 这类词会被误拆。

---

## 六、Helper 函数

`src/config/index.ts`（`$lib/config` 重新导出）：

| 函数                      | 用途                             |
| ------------------------- | -------------------------------- |
| `siteUrl(path)`           | 拼接规范 URL                     |
| `staticUrl(path)`         | 拼接 CDN 静态资源 URL            |
| `siteProxyUrl()`          | 站点代理源站 URL（空串表示关闭） |
| `ogImageUrl()`            | 默认 OG 图片 URL                 |
| `shouldShowAds(lang)`     | 当前语言是否显示广告             |
| `getDownloadDomains()`    | 打乱顺序的下载节点列表           |
| `getPrimaryLookupNodes()` | 查询 primary 节点                |
| `getBackupLookupNodes()`  | 查询 backup 节点                 |
| `auditEndpoint()`         | 审计服务器端点                   |

`src/lib/`：

| 函数                                                                                       | 用途                           |
| ------------------------------------------------------------------------------------------ | ------------------------------ |
| `formatCount` / `formatDate` / `formatRelative` / `ratingPercent` / `truncate`             | 展示层格式化（缺字段不编造 0） |
| `normalizeScript` / `detailHref` / `authorHref` / `installHref` / `installPathFromCodeUrl` | 脚本模型与链接规则             |
| `stringifySearchParams` / `parseSearchParams` / `getParam` / `getParamList`                | 搜索参数序列化                 |
| `LOCALE_OPTIONS`（`lib/locale-options.ts`）                                                | 脚本语言筛选选项（两处共用）   |
| `sanitize` / `text` / `attr` / `placeholderRows` / `rowsMinHeight` / `setDocumentTitle`    | 动态区块的 patch 工具          |

---

## 七、CSS 设计规范

遵循 [Material Design 3](https://m3.material.io/develop/web) 的 Design Token 体系，
并且保持既定的**三层主题架构**（改动前先判断会不会影响另外两层）：

1. **MD3 token 层** — `src/lib/colors.ts → SCHEMES[]`，每个配色含 light/dark 两套
   `--md-sys-color-*`，默认 `azure`。
2. **覆盖层** — `data-zh-china="1"` 且 `schemeId === resolveDefaultId()` 时生效，
   范围仅 `Nav.svelte` + 首页，用 `--zh-*` 变量覆盖 token；切到自定义配色必须回到
   `data-zh-china="0"`。
3. **静态默认层** — `app.css → :root` 静态声明完整 azure token + `body` 背景，
   保证 JS 执行前首帧就是协调配色（FOUC 防护脚本内联在 `+layout.svelte` 的
   `<svelte:head>`，paint 前同步读 `localStorage` 的 `gf-color` / `gf-theme`）。

**动态区块的样式也属于静态默认层**：占位态只用 `[data-state]` 属性选择器表达，
不新增运行时样式表、不切 class。`app.css` 里两条兜底必须保留：

```css
.dyn-slot {
	display: contents;
} /* Slot 包裹元素不生成盒子，不改变布局 */
[hidden] {
	display: none !important;
} /* 骨架 ↔ 真实内容用 hidden 切换，压过组件的 display */
```

其它约定：160ms ease-out 动效 / `:active` 按压反馈 / `focus-visible` 焦点环 /
遵守 `prefers-reduced-motion`；卡片白底 + 1px 细边 + 柔和投影 + 14px 圆角。

**几个容易踩的具体点**

| 项                    | 现状                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| 顶部色带 `.zh-topbar` | 2px 政务蓝渐变（`--zh-azure` → `--zh-azure-soft`）；自定义配色回落 `--md-sys-color-primary`                     |
| 卡片别名              | `.md3-card` / `.md3-outlined-button` 是早期页面沿用的空 class，现已与 `.ui-card` / `.ui-btn--outlined` 共用样式 |
| 长文页面              | `.text-content`（tos / applist / feedback / installing）统一成卡片 + 一套排版规则                               |
| 标题字形              | `h1–h4` 全局 `font-optical-sizing` + `text-wrap: balance`；拉丁/日文额外收紧字距，中文不加                      |
| 图标                  | **全部内联 SVG**（`Icon.svelte` + `lib/icons.ts`），零外部字体。不要再引 Material Icons / Google Fonts          |
| 搜索框                | 左右各一个图标按钮（左 32/36px 小号、右 44/52px 大号），都 `type="submit"`，文字走 `visually-hidden`            |
| 卡片白底              | 用 `--md-sys-color-surface-container-lowest`；`surface` 在浅色主题下偏灰，别混用                                |

---

## 八、构建与验证

```bash
npm install              # 安装依赖
npm run dev              # 开发服务器
npm run check            # Svelte / TS 类型检查（要求 0 errors 0 warnings）
npm run lint             # ESLint + Prettier 检查（CI 必过）
npm run format           # Prettier 格式化
npm run build            # 生产构建 → build/（含 postbuild HTML 压缩）
npm run preview          # 预览构建结果（见下方注意）
```

> **别在 preview 运行时重新 build**：`vite preview` 服务的是 `.svelte-kit/output/client`
> 这个构建中间目录，重新构建会把它清空，正在浏览的页面会因 chunk 被删而让服务器崩掉
> （`ENOENT ... immutable/nodes/*.js`）。要边改边看，就用任意静态服务器直接托管 `build/`；
> 重新构建完刷新即可。

### 验收清单（任何动态内容改动都要过一遍）

1. `npm run check`、`npm run lint`、`npm run build` 全部通过。
2. 构建产物里每个动态区块的结构 + 默认文案都在（不执行 JS 也能读）：
   ```bash
   # 例：lookup 的占位行与示例状态
   grep -o 'data-block="lookup-results"' build/zh-hans/lookup.html | head
   grep -c '脚本标题' build/zh-hans/lookup.html
   ```
3. DevTools → Network 设 Slow 3G 或 Block request URL：结构不变、无布局抖动，
   失败降级为 fallback + 错误文案。
4. 同一页面同一份数据只发一次请求（Network 面板去重）。
5. 全仓库只有 `src/lib/dynamic/core/request.ts` 出现 `fetch(`：
   ```bash
   grep -rn "fetch(" src | grep -v "core/request.ts"
   ```
6. 任一区块失败不影响其他区块（单独 Block 掉某个 API 域名验证）。

---

## 九、部署

`build/` 目录可直接部署到任意静态托管。仓库内的 GitHub Actions
（`.github/workflows/deploy.yml`）在 push 到 `main`/`master` 时：

1. `npm ci` → `VITE_CDN_ENABLED=true npm run build`；
2. `build/` 推到 `publish` 分支；
3. `build/_app` 推到 `cdn` 分支（供 CDN 源站拉取）。

`static/edgeone.json` 提供托管侧的重写规则（`/` → `/zh-hans`、
`/zh-CN/*` → `/zh-hans/*`、`/scripts/*` `/users/*` 等旧路径回源到 Greasy Fork 代理）。

---

## 十、约定与取舍（维护者须知）

- **hash 页面只产出骨架**：`lookup` / `download` / `info` 的真实数据在 hash 里，
  构建期无法预构建，因此只预渲染骨架 + 默认文案；hash 在水合后由区块读取，
  并监听 `hashchange` / `popstate`。
- **HTML 片段是「整段替换」而非字段级覆盖**：上游 info API 返回的是已经渲染好的
  HTML（`c1`/`c2`/`c3`），无法拆字段，因此这些区块做到「字段级默认内容 + 整段覆盖」。
- **`/[lang]/applist` 没有动态区块**：它是用户脚本管理器的静态清单，无 API。
- **`/l` 是 301 存根**：`src/routes/l/+page.ts` 直接 `redirect(301, '/zh-hans/l')`，
  `build/l.html` 是 meta refresh 存根，不渲染页面。
- **列表行数与真实行数会变化**：占位行数固定（`list.placeholderRows`），ready 后按
  真实数量增减；行高由 `--dyn-row-h` 固定，容器 `min-height` 撑住，所以不会整页跳动。
- **非请求的 `fetch` 等价物**：下载节点测速用隐藏 iframe 加载节点上的 `gfork.js`
  并等 `postMessage`（无法用 fetch 表达 CORS 探测）；输入联想等所有 HTTP 请求仍只走
  `core/request.ts`。

- **`/search` 已下线**：高级搜索表单页删除，`/[lang]/search` 保留 `301` → `/[lang]/lookup`
  （`+page.ts` 里 `redirect()` + `prerender`，静态托管会生成 meta-refresh 存根）。筛选能力
  全部并到首页 hero 的**折叠高级搜索面板**和 lookup 侧栏。
- **`/lookup` 不作为入口**：不在导航、页脚、常用服务宫格里露出；只能由搜索动作
  （搜索框提交、热门词、`/s` 中间页、info 页「按站点」链接）进入。页面本身必须保留。
- **跳转有三种实现**，别混：
  1. 路由级 301（`/search`、根 `/l`）：load 里 `redirect(301)` + `prerender` → 静态跳转存根；
  2. `/s`：真实预渲染页面，JS 读 `location.search` 后 `location.assign`（静态 301 带不上查询串）；
  3. 站内：`goto()`（搜索提交、切语言）+ `history.pushState` 改 hash（lookup 筛选/翻页，不刷新）。

---

_最后更新：2026-11-04_
