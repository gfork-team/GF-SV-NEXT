# Greasy Fork 镜像加速站 · 设计系统提示词

> 用途：存为仓库根目录 `CLAUDE.md` 作为项目记忆，或直接粘贴为新会话的开场白。目标是让任何一个不了解历史的 Claude 会话，也能立刻掌握既定设计架构，不重复踩坑、不误改约定。

---

## 0. 项目与角色

你正在维护「Greasy Fork 镜像加速站」的前端（SvelteKit）。当前默认主题是 **gov.cn 式简约政务风**，由早期「中国红 + 水墨」视觉演进而来。

注意：`--zh-*` 变量前缀、`data-zh-china` 属性名是"水墨覆盖层"这套技术架构沿用的命名，它当前实际输出的视觉效果就是下面第 1 节定义的政务蓝白灰配色（具体取值见第 4 节），不是传统水墨画风格——架构没变，视觉在这套架构上演进了。

下面的规范是**已经落地并验证过的既定架构**，不是待讨论的建议。除非用户明确要求调整设计方向或推翻架构，否则：
- 不要自行"优化"配色值、变量名、判断条件
- 不要合并或跳过三层架构（第 2 节）中的任何一层
- 改动前先判断会不会影响另外两层

## 1. 设计定位

| 维度 | 规范 |
|---|---|
| 基调配色 | 白 / 浅灰底、近黑文字、政务蓝链接、**淡粉紫（`#ddaacc`）点缀** |
| 搜索交互 | gov.uk 式大搜索框 + 输入联想（combobox） |
| 交互动效 | Apple 设计原则：短动效、按压反馈、focus-visible、遵守 prefers-reduced-motion |
| 图标 | 品牌不做 logo：Nav/首页品牌区不带图标，页脚用 `static/img/gforkg.svg`；功能图标统一用 Google Material Symbols |

## 2. 三层主题架构（核心，务必保持）

### 第 1 层 · MD3 token 层
- 文件：`src/lib/colors.ts` → `SCHEMES[]`
- 每个配色对象含 light / dark 两套完整 `--md-sys-color-*` token
- `SCHEMES[0] = azure`（Government Azure，`#1d5fa8`）—— **默认配色，配色本身不含绿色**
- 其余可选配色：`ocean` / `purple` / `terra` / `rose` / `teal`

### 第 2 层 · 水墨覆盖层
- 生效条件：`data-zh-china="1"`，且**仅当** `schemeId === resolveDefaultId()`（判断逻辑见 `colors.ts` 内 `applyColorScheme`）
- 生效范围：`Nav.svelte` + 首页 `+page.svelte`，用 `--zh-*` 变量覆盖 MD3 token
- **切到自定义配色时必须是 `data-zh-china="0"`，完全回落纯 MD3，两套变量互不串扰**（该行为已实测验证过；触碰这段逻辑后要重新手动验证一遍）

### 第 3 层 · 静态默认层
- 文件：`app.css` → `:root`
- 静态声明完整的 azure 配色 token，`body` 背景写死 `#fff`
- 作用：保证 JS 执行前的首帧就已经是协调配色，不出现黑白闪变

## 3. 防闪变（FOUC）机制 —— 高风险区，禁止回退历史 bug

- 脚本：`colors.ts` → `getColorFoucScript()`
- 位置：内联在 `+layout.svelte` 的 `<svelte:head>`
- 时机：**必须在 paint 之前**同步读取 `localStorage`（key：`gf-color` / `gf-theme`）
- 逻辑：
  - 存在自定义配色 → 直接应用该配色的 token
  - 不存在 → 应用 azure + `data-zh-china="1"`
- 效果：任何场景下首帧即为最终态，零闪烁

**历史教训表（不要重犯）：**

| 曾经的错误做法 | 后果 |
|---|---|
| FOUC 脚本里写死默认绿色 token | 首帧闪绿 |
| 直接删掉 FOUC 脚本 | hydrate 完成前 CSS 变量未定义，闪黑白 |

当前方案已同时规避以上两种问题。**任何修改 FOUC 逻辑 / `data-zh-china` 判断的改动，完成后必须硬刷新浏览器肉眼确认零闪烁。**

## 4. 水墨变量集

Nav 组件与首页**两处** `:root` 必须保持完全同步——只改一处会导致两处视觉不一致：

| 变量 | 值 | 说明 |
|---|---|---|
| `--zh-ink` | `#1f1f1f` | 主文字色 |
| `--zh-ink-deep` | `#111111` | 深色文字 |
| `--zh-ink-soft` | `#5f5f5f` | 次要文字 |
| `--zh-azure` | `#1d5fa8` | 链接蓝 |
| `--zh-azure-soft` | `#6b93c2` | 浅蓝 |
| `--zh-seal` | `#ddaacc` | 淡粉紫（点缀主色，克制使用） |
| `--zh-seal-deep` | `#c86b8a` | 深一档粉紫（渐变暗端） |
| `--zh-seal-bright` | `#eed3e5` | 亮一档粉紫（渐变亮端 / 按钮） |
| `--zh-seal-soft` | `#f8edf4` | 更浅粉紫（feature 卡底色） |
| `--zh-gold` | `#b98a1e` | 政务金（通知徽章等少量点缀） |
| `--zh-gold-deep` | `#9a731a` | 政务金深一档（徽章渐变） |
| `--zh-ivory` | `#f5f5f5` | 浅底色 |
| `--zh-ivory-bright` | `#fff` | 纯白底 |
| `--zh-paper` | `#fafafa` | 纸色底 |
| `--zh-line` | `#e5e5e5` | 分割线 |

全局链接色 / body 相关覆盖统一写在 `app.css`，不要散落在各组件里。

## 5. 布局与组件规范（gov.cn 式）

- **全站背景动效**：`+layout.svelte` 中 `.zh-bg` 固定浮层，三个缓慢漂移的光斑（`zh-blob-a/b/c`，无限往返动画，任何配色下都持续运动）；默认配色（`data-zh-china="1"`）为粉紫 / 墨蓝光斑，自定义配色回落中性灰 `rgba(108,112,122,.14)` 不上色；主体 `.m3-layout-body` 与 `.m3-footer` 需 `position:relative; z-index:1` 浮于其上
- **顶部**：4px 细粉紫带，class `zh-topbar`（默认配色下为 `--zh-seal-deep → --zh-seal → --zh-seal-bright` 三段粉紫渐变，自定义配色回落主题色）
- **顶栏**：白玻璃质感 `rgba(255,255,255,.82)` + `blur(20px)`；链接 hover / 激活态为粉紫 + 2px 短下划线；按钮白底、1px 边框、6px 圆角
- **首页 hero**：大搜索框（max-width 640px，高 48px）+ 粉紫渐变圆角按钮（`--zh-seal-bright → --zh-seal-deep`）+ 热门词列表；**无外框**，直接落在页面背景上
- **区块标题**：粉紫字 + 左侧粉紫竖条 + 右侧「更多 ›」
- **服务网格**：6 卡布局，图标蓝色，hover 时边框变粉紫
- **feature 区块**：粉紫字 + 浅粉紫底（`--zh-seal-soft`）

**动效基调**：160ms ease-out 过渡 / `:active` 按压缩放 / `focus-visible` 粉紫焦点环 / 遵守 `prefers-reduced-motion`，用户开启该系统设置时关闭动效。

**Cloudflare 组件质感（全站卡片/按钮）**：
- 卡片：白底 + 1px 细边（`--md-sys-color-outline-variant`）+ 双层柔和投影 `0 1px 2px rgba(0,0,0,.03), 0 8px 24px rgba(0,0,0,.04)` + 14px 圆角，hover 上浮 3px 投影加深
- 按钮：10px 圆角，主按钮带粉紫投影 `0 6px 16px rgba(221,170,204,.30)`
- 首页 hero：白卡片 + `cf-dots` 点阵底 + `cf-glow` 粉紫径向光晕（默认配色下带呼吸涨落动效，`prefers-reduced-motion` 关闭），hover 上浮
- 滚动渐入：`[data-reveal]` 元素由 IntersectionObserver 在布局层驱动，`--reveal-delay` 控制错峰，遵守 `prefers-reduced-motion`

## 6. 搜索联想（gov.uk 式 combobox）

**涉及文件**：首页 `+page.svelte` + `src/lib/lookup-api.ts`

**触发与请求逻辑：**
1. 输入达到 ≥ 2 字符，debounce 300ms 后触发
2. 调用 `fetchScriptSuggestions`，按顺序依次尝试 `getPrimaryLookupNodes()` → `getBackupLookupNodes()`
3. SS 签名 = `sha256(timestamp 前 8 位)`，再截取长度 = `config.json` 中 `lookupSignature.ssLength`（当前值 9）
4. 需兼容响应头 `X-Content-Encoding: base64`

**交互与无障碍：**
- `↑` / `↓` 切换高亮项
- `Enter` 跳转至 `/${lang}/info#/${locale}/scripts/{id}/detail`，其中 `locale = i18nConfig.langNames[lang]`
- `Esc` 或失焦时关闭建议列表
- 无障碍属性：`role="combobox"` / `role="listbox"`，并维护 `aria-activedescendant`

## 7. 关键文件索引

| 文件 | 作用 |
|---|---|
| `src/lib/colors.ts` | 配色体系定义 + FOUC 脚本 |
| `src/lib/theme.svelte.ts` | 主题状态管理 |
| `src/lib/components/Nav.svelte` | 顶栏组件（水墨覆盖层生效点之一） |
| `src/routes/[lang]/(pages)/+page.svelte` | 首页（水墨覆盖层生效点之二，含搜索联想 UI） |
| `src/lib/lookup-api.ts` | 搜索联想请求逻辑 |
| `src/config/config.json` | `defaultColorScheme: "azure"` |
| `src/config/index.ts` | fallback 值 `'azure'` |
| `src/app.css` | body / 链接色 / 静态 token 层 |
| `src/lib/i18n/*.json` | `home.hot.*`、`home.quick.*` 文案词条 |

## 8. 验收标准（任何改动完成后逐项确认）

1. `npx svelte-check --tsconfig ./tsconfig.json` → **0 errors 0 warnings**
2. 浏览器手动验证：
   - 默认配色（水墨政务风）下 `data-zh-china="1"`
   - 切到自定义配色（如 Ocean Blue）后 `data-zh-china="0"`，视觉完全回落 MD3，无水墨变量残留
3. 硬刷新页面全程无黑白闪变、无错误配色闪烁（默认配色场景重点测试）
4. Nav 与首页两处 `--zh-*` 变量定义完全一致

## 9. 给执行任务的 Claude 的提醒

- 只改动局部功能（例如只改搜索联想）时，仍建议顺手跑一遍第 8 节验收标准，避免连带破坏其他层。
- 涉及第 3 节（FOUC）或 `data-zh-china` 判断逻辑的改动，做完后必须回到第 3 节的历史教训表自查一遍。
- 不确定某个视觉细节的精确实现时，优先去读第 7 节里对应的源文件，而不是凭经验猜测或"看起来应该是这样"。
