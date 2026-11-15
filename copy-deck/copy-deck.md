# 全站文案清单（Copy Deck）

> 交给其他模型批量改写用。改完用 `node copy-deck/apply-copy.mjs copy-all.csv` 回填四份 i18n JSON。
> 全量机读版：`copy-deck/copy-all.csv`（列：group, key, 四语言, 占位符, 问题标记, 出现位置, 类型）。
> 共 **321** 条词条 × 4 语言，另有 config 文案 6 条、写死英文串 5 条。

## 改写要求（原样转给写手）

1. **四语言都要改**，不要只改中文；英文别逐字直译，日文用自然口语，繁体不要从简体机械转写（「搜尋」「腳本」「選單」这类用词要对）。
2. **保持长度量级**：标题 ≤ 30 字、描述 40–90 字、按钮/标签 ≤ 6 字。卡片标题 18px 两行，超长会撑破布局。
3. **别堆关键词**：不要「支持…、支持…、支持…」这种罗列句，像跟人说话一样写。
4. **占位符原样保留**：`{count}`、`{name}`、`{lang}`、`{countdown}` 里一个字都不能改。
5. **分隔符约定**：`meta.*` 用全角破折号 `—` 分隔标题与描述；首页 `about.feature_*` 也用 `—` 拆标题/描述；其余文案不要用 `—`。
6. **不要增删 key、不要改 key 名**；不想改的保持原样，别留空。

## ⚠️ 需要优先处理的 1 条

这些词条翻译缺失、明显截断，或英文里混着中文 —— 重写时按「重新写一份」对待，不要参照旧译。

| key | 问题 | zh-hans | en | ja |
| --- | --- | --- | --- | --- |
| `about.feature_4` | en 含中文 | 多语言界面：简体中文、繁體中文、English、日本語 | Languages: 简体中文, 繁體中文, English, 日本語 | 対応言語：简体中文、繁體中文、English、日本語 |

## 导航与菜单（`nav.*`，10 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `nav.home` | 正文 | src/lib/components/Footer.svelte:13 src/lib/components/Nav.svelte:22 | 首页 | 首頁 | Home | ホーム |
| `nav.help` | 正文 | src/lib/components/Footer.svelte:14 src/lib/components/Nav.svelte:23 | 帮助 | 幫助 | Help | ヘルプ |
| `nav.about` | 正文 | src/lib/components/Footer.svelte:15 src/lib/components/Nav.svelte:24 | 关于 | 關於 | About | サイトについて |
| `nav.download` | 正文 | src/routes/[lang]/(pages)/+page.svelte:45 | 下载加速 | 下載加速 | Download | ダウンロード |
| `nav.applist` | 正文 | src/routes/[lang]/(pages)/+page.svelte:46 src/routes/[lang]/(pages)/installing/+page.svelte:45 | 用户脚本管理器 | 使用者腳本管理器 | Script Managers | スクリプトマネージャー |
| `nav.installing` | 正文 | src/routes/[lang]/(pages)/+page.svelte:51 | 如何安装 | 如何安裝 | Install Guide | インストール方法 |
| `nav.skip_to_content` | 正文 | src/lib/components/Nav.svelte:86 | 跳到主要内容 | 跳到主要內容 | Skip to main content | メインコンテンツへ |
| `nav.menu` | 正文 | src/lib/components/Nav.svelte:99 | 菜单 | 選單 | Menu | メニュー |
| `nav.language` | 正文 | src/lib/components/Nav.svelte:173 | 语言 | 語言 | Language | 言語 |
| `nav.search_open` | 正文 | src/lib/components/Nav.svelte:123 | 搜索 | 搜尋 | Search | 検索 |

## 首页（`home.*`，30 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `home.features_title` | 标题 | src/routes/[lang]/(pages)/+page.svelte:238 | 主要功能 | 主要功能 | Features | 主な機能 |
| `home.super_title` | 标题 | src/routes/[lang]/(pages)/+page.svelte:124 | 欢迎来到 GFork Proxy 这里是 Greasy Fork 的镜像站 搜脚本、装脚本，下载走加速 | 歡迎來到 GFork Proxy 這裡是 Greasy Fork 的鏡像站 搜腳本、裝腳本，下載走加速 | Welcome to GFork Proxy a mirror of Greasy Fork search, install and download — accelerated | GFork Proxy へようこそ Greasy Fork のミラーサイトです 検索・インストール・ダウンロードを高速に |
| `home.intro` | 正文 | src/routes/[lang]/(pages)/+page.svelte:286 | GFork Proxy 是 Greasy Fork 的镜像加速站。请求经由亚太服务器转发，脚本页面更容易打开，安装和下载也少出加载错误。本站只转发页面和下载请求，不制作、不存储任何脚本和用户数据，内容与官方实时同步。本站与 Greasy Fork 官方没有直接关联。脚本由第三方作者发布，其合法性和使用风险请自行判断，因脚本产生的版权或其他纠纷，本站不承担责任。页面内容会经过自动过滤检查，除更新链接外，数据与官方保持一致。 | GFork Proxy 是 Greasy Fork 的鏡像加速站。請求經由亞太伺服器轉發，腳本頁面更容易開啟，安裝和下載也少出載入錯誤。本站只轉發頁面和下載請求，不製作、不儲存任何腳本和使用者資料，內容與官方即時同步。本站與 Greasy Fork 官方沒有直接關聯。腳本由第三方作者發布，其合法性和使用風險請自行判斷，因腳本產生的版權或其他糾紛，本站不承擔責任。頁面內容會經過自動過濾檢查，除更新連結外，資料與官方保持一致。 | GFork Proxy is a mirror of Greasy Fork. Requests are relayed through Asia-Pacific servers, so script pages open more reliably and installs and downloads fail less often. We only relay pages and downloads. We don’t write or store any scripts or user data, and content stays in sync with the official site. GFork is not directly affiliated with Greasy Fork. Scripts are published by third parties, so judging their legality and risks is up to you, and we are not responsible for copyright issues or disputes involving them. Pages go through an automated filter, and apart from update links the data matches the official site. | GFork は Greasy Fork のミラーサイトです。アジア太平洋のサーバーを経由することで、スクリプトのページが開きやすくなり、インストールやダウンロードの読み込みエラーも起きにくくなります。当サイトはページとダウンロードの中継のみを行い、スクリプトやユーザーデータの作成・保存は一切行いません。内容は公式サイトとリアルタイムで同期されます。Greasy Fork 公式とは直接の関係はありません。スクリプトは第三者が公開したものです。その合法性や利用上のリスクはご自身で判断してください。スクリプトに関する著作権上の問題や紛争について、当サイトは責任を負いません。表示内容は自動フィルターで確認しており、更新リンクを除き、公式サイトと同じデータです。 |
| `home.recommend` | 正文 | src/routes/[lang]/(pages)/+page.svelte:293 | 如果你在中国内地，需要教学平台自动化或影视平台相关的脚本，建议直接去脚本猫（scriptcat.org）下载。脚本猫由中国内地开发者运营，隶属油猴中文网（bbs.tampermonkey.net.cn），社区支持更好。注：油猴中文网和脚本猫的服务器都在日本。 | 如果你在中國大陸，需要教學平台自動化或影音平台相關的腳本，建議直接到腳本貓（scriptcat.org）下載。腳本貓由中國大陸開發者營運，隸屬油猴中文網（bbs.tampermonkey.net.cn），社群支援更好。註：油猴中文網和腳本貓的伺服器都在日本。 | If you’re in mainland China and need scripts that automate study platforms or work with video sites, we recommend downloading from ScriptCat (scriptcat.org). It is run by developers in mainland China as part of the Tampermonkey Chinese Forum (bbs.tampermonkey.net.cn), so community support is better. Note: both the forum and ScriptCat are hosted in Japan. | 中国本土で、学習プラットフォームの自動化や動画サイト向けのスクリプトをお探しなら、脚本猫（scriptcat.org）からのダウンロードをおすすめします。中国本土の開発者が運営する Tampermonkey 中国語フォーラム（bbs.tampermonkey.net.cn）のサービスで、コミュニティのサポートも充実しています。なお、フォーラムと脚本猫のサーバーはどちらも日本にあります。 |
| `home.url_tool.title` | 正文 | src/routes/[lang]/(pages)/+page.svelte:306 | 脚本下载与更新链接加速 | 腳本下載與更新連結加速 | Speed up script download and update links | スクリプトのダウンロード・更新リンクを高速化 |
| `home.url_tool.placeholder` | 输入框占位 | src/routes/[lang]/(pages)/+page.svelte:312 | 粘贴 Greasy Fork 脚本链接 | 貼上 Greasy Fork 腳本連結 | Paste a Greasy Fork script link | Greasy Fork のスクリプトリンクを貼り付け |
| `home.url_tool.button` | 按钮 | src/routes/[lang]/(pages)/+page.svelte:317 | 生成链接 | 產生連結 | Get link | リンクを生成 |
| `home.url_tool.result` | 正文 | src/routes/[lang]/(pages)/+page.svelte:325 | 加速后的链接会显示在下方 | 加速後的連結會顯示在下方 | The faster link will appear below | 高速化したリンクが下に表示されます |
| `home.url_tool.error` | 错误提示 | src/routes/[lang]/(pages)/+page.svelte:93 | 这不是 Greasy Fork 的脚本链接，本站只支持 Greasy Fork。 | 這不是 Greasy Fork 的腳本連結，本站只支援 Greasy Fork。 | That isn’t a Greasy Fork link. This site only works with Greasy Fork scripts. | Greasy Fork のリンクではありません。当サイトは Greasy Fork のスクリプトのみ対応しています。 |
| `home.tos_agree` | 正文 | src/routes/[lang]/(pages)/+page.svelte:332 | 继续使用即表示你同意 | 繼續使用即表示你同意 | By continuing, you agree to our | サイトを利用すると、次の規約に同意したことになります： |
| `home.tos_link` | 正文 | src/routes/[lang]/(pages)/+page.svelte:334 | 用户协议 | 使用者協議 | Terms of Service | 利用規約 |
| `home.installing_link` | 正文 | src/routes/[lang]/(pages)/+page.svelte:344 | 「用户脚本是什么？怎么安装和使用？」 | 「使用者腳本是什麼？怎麼安裝和使用？」 | “What are userscripts, and how do I install and use them?” | 「ユーザースクリプトとは？インストールと使い方」 |
| `home.hot.title` | 正文 | src/routes/[lang]/(pages)/+page.svelte:143 | 热门搜索 | 熱門搜尋 | Hot Searches | 人気の検索 |
| `home.hot.1` | 正文 |  | 哔哩哔哩 | 嗶哩嗶哩 | bilibili | bilibili |
| `home.hot.2` | 正文 |  | 学习 | 學習 | Study | 学習 |
| `home.hot.3` | 正文 |  | GitHub | GitHub | GitHub | GitHub |
| `home.hot.4` | 正文 |  | 视频加速 | 影片加速 | Video Acceleration | 動画加速 |
| `home.hot.5` | 正文 |  | 文档解析 | 文件解析 | Document Parsing | ドキュメント解析 |
| `home.quick.title` | 正文 | src/routes/[lang]/(pages)/+page.svelte:259 | 常用服务 | 常用服務 | Popular Services | よく使うサービス |
| `home.quick.desc.download` | 正文 | src/routes/[lang]/(pages)/+page.svelte:45 | 自动测速，选最快的节点 | 自動測速，選最快的節點 | Tests nodes and picks the fastest one | ノードを自動で測定し、最速のものを選択 |
| `home.quick.desc.help` | 正文 | src/routes/[lang]/(pages)/+page.svelte:47 | 使用说明和常见问题 | 使用說明和常見問題 | Guides and FAQ | 使い方とよくある質問 |
| `home.quick.desc.about` | 正文 | src/routes/[lang]/(pages)/+page.svelte:48 | 本站简介和免责声明 | 本站簡介和免責宣告 | About this site and disclaimer | サイトの紹介と免責事項 |
| `home.quick.desc.feedback` | 正文 | src/routes/[lang]/(pages)/+page.svelte:55 | 报告问题，提建议 | 報告問題，提建議 | Report a problem or suggest an idea | 不具合の報告・ご要望 |
| `home.recommend.link1` | 正文 | src/routes/[lang]/(pages)/+page.svelte:297 | 油猴中文网 | 油猴中文網 | Tampermonkey Chinese Forum | Tampermonkey 中国語フォーラム |
| `home.search_placeholder` | 输入框占位 | src/lib/components/SearchBar.svelte:199 | 搜索脚本名称、描述或功能 | 搜尋腳本名稱、描述或功能 | Search scripts by name, description, or feature | スクリプト名・説明・機能で検索 |
| `home.search_clear` | 按钮 | src/lib/components/SearchBar.svelte:217 | 清空搜索内容 | 清空搜尋內容 | Clear search | 検索をクリア |
| `home.search_action` | 按钮 | src/lib/components/SearchBar.svelte:183 | 搜索 | 搜尋 | Search | 検索 |
| `home.quick.more` | 正文 | src/routes/[lang]/(pages)/+page.svelte:261 | 更多 | 更多 | More | もっと見る |
| `home.quick.desc.applist` | 正文 | src/routes/[lang]/(pages)/+page.svelte:46 | 常用脚本管理器推荐 | 常用腳本管理器推薦 | Recommended userscript managers | おすすめのスクリプトマネージャー |
| `home.quick.desc.installing` | 正文 | src/routes/[lang]/(pages)/+page.svelte:52 | 图文安装教程 | 圖文安裝教學 | Step-by-step installation guide | 図解付きのインストール手順 |

## 页脚（`footer.*`，6 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `footer.sponsor_title` | 标题 | src/lib/components/Footer.svelte:59 | 网络服务由 | 網路服務由 | Network services sponsored by | ネットワーク提供： |
| `footer.sponsor_alt` | 正文 | src/lib/components/Footer.svelte:79 | 赞助商 | 贊助商 | Sponsor | スポンサー |
| `footer.rating_alt` | 正文 | src/lib/components/Footer.svelte:144 | 内容分级 | 內容分級 | Content rating | レーティング |
| `footer.feedback` | 正文 | src/lib/components/Footer.svelte:92 src/routes/[lang]/(pages)/+page.svelte:55 | 问题反馈 | 問題回饋 | Send feedback | フィードバックを送る |
| `footer.copyright` | 正文 | src/lib/components/Footer.svelte:103 · 占位符 {year} | © 2020-{year} GFork. | © 2020-{year} GFork. | © 2020-{year} GFork. | © 2020-{year} GFork. |
| `footer.sponsor_title_suffix` | 正文 | src/lib/components/Footer.svelte:68 | 赞助 | 贊助 |  |  |

## SEO（title / description）（`meta.*`，21 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `meta.home_title` | 标题 | src/lib/seo.ts:24 src/routes/[lang]/(pages)/+page.svelte:112 | Greasy Fork 油猴脚本镜像加速 - GFork Proxy | Greasy Fork 油猴腳本鏡像加速 - GFork Proxy | Greasy Fork Mirror & Script CDN - GFork Proxy | Greasy Fork ミラーとスクリプト高速化 - GFork Proxy |
| `meta.home_desc` | 描述 | src/lib/seo.ts:24 src/routes/[lang]/(pages)/+page.svelte:113 | Greasy Fork 在国内访问时好时坏，这里放了个镜像：脚本页能正常打开，安装和下载走加速通道，搜索也能按站点、语言、安装量筛选。不用注册，打开就用。 | Greasy Fork 在中國大陸時好時壞，這裡放了個鏡像：腳本頁能正常開啟，安裝和下載走加速通道，搜尋也能依站點、語言、安裝量篩選。不用註冊，開啟就能用。 | Greasy Fork is unreliable from mainland China, so we mirror it: script pages load, installs and downloads go through accelerated nodes, and search lets you filter by site, language and install count. No sign-up. | Greasy Fork は中国本土からだと不安定なので、ミラーを用意しました。スクリプトページはそのまま開け、インストールとダウンロードは高速ノード経由、検索はサイト・言語・インストール数で絞れます。登録は不要です。 |
| `meta.home_keywords` | SEO | src/routes/[lang]/(pages)/+page.svelte:114 | greasyfork, greasyfork镜像, greasyfork加速, 油猴脚本, 油猴脚本下载, tampermonkey, violentmonkey, scriptcat, 用户脚本, 脚本加速, userscript, cdn加速, 镜像站, 高级搜索, 油猴 | greasyfork, greasyfork鏡像, greasyfork加速, 油猴腳本, 油猴腳本下載, tampermonkey, violentmonkey, scriptcat, 使用者腳本, 腳本加速, userscript, cdn加速, 鏡像站, 進階搜尋, 油猴 | greasyfork, greasyfork mirror, greasyfork alternative, userscript, user scripts, tampermonkey, violentmonkey, scriptcat, userscript download, script search, cdn acceleration, greasemonkey | greasyfork, greasyfork ミラー, ユーザースクリプト, tampermonkey, violentmonkey, scriptcat, スクリプト ダウンロード, 高速アクセス, 高度な検索, ブラウザー拡張 |
| `meta.search_title` | 标题 |  | 高级搜索 - GFork Proxy | 進階搜尋 - GFork Proxy | Advanced Search - GFork Proxy | 高度な検索 - GFork Proxy |
| `meta.search_desc` | 描述 |  | 搜索 Greasy Fork 上的用户脚本，可按站点域名、语言、安装量等条件筛选。 | 搜尋 Greasy Fork 上的使用者腳本，可按站點網域、語言、安裝量等條件篩選。 | Search userscripts on Greasy Fork and filter by site domain, language, install count and more. | Greasy Fork のユーザースクリプトを検索。サイトのドメイン・言語・インストール数などで絞り込めます。 |
| `meta.help_title` | 标题 | src/lib/seo.ts:27 src/routes/[lang]/(pages)/help/+page.svelte:76 | 帮助 - GFork Proxy | 幫助 - GFork Proxy | Help - GFork Proxy | ヘルプ - GFork Proxy |
| `meta.help_desc` | 描述 | src/lib/seo.ts:27 src/routes/[lang]/(pages)/help/+page.svelte:77 | 装脚本前后会碰到的问题都在这：怎么安装、怎么升级、装不上怎么办。 | 裝腳本前後會碰到的問題都在這：怎麼安裝、怎麼升級、裝不上怎麼辦。 | Everything you need before and after installing a script: how to install, how to update, and what to do when it won’t. | スクリプトを入れる前後に困ること。インストール方法、更新方法、入らないときの対処。 |
| `meta.about_title` | 标题 | src/lib/seo.ts:28 src/routes/[lang]/(pages)/about/+page.svelte:13 | 关于 - GFork Proxy | 關於 - GFork Proxy | About - GFork Proxy | サイトについて - GFork Proxy |
| `meta.about_desc` | 描述 | src/lib/seo.ts:28 src/routes/[lang]/(pages)/about/+page.svelte:14 | GFork Proxy 是什么、有哪些功能，以及源码地址和联系方式。 | GFork Proxy 是什麼、有哪些功能，以及原始碼地址和聯絡方式。 | What GFork Proxy is, what it does, and where to find the source code and contact details. | GFork Proxy の概要、機能、ソースコードの場所、連絡先。 |
| `meta.tos_title` | 标题 | src/lib/seo.ts:29 src/routes/[lang]/(pages)/tos/+page.svelte:13 | 用户协议 - GFork Proxy | 使用者協議 - GFork Proxy | Terms of Service - GFork Proxy | 利用規約 - GFork Proxy |
| `meta.tos_desc` | 描述 | src/lib/seo.ts:29 src/routes/[lang]/(pages)/tos/+page.svelte:14 | 用之前先看清楚：能做什么、不能做什么、出了问题找谁。 | 用之前先看清楚：能做什麼、不能做什麼、出了問題找誰。 | Read this before you use the site: what’s allowed, what isn’t, and who to ask when something goes wrong. | 使う前に目を通してください。できること、できないこと、困ったときの連絡先。 |
| `meta.feedback_title` | 标题 | src/lib/seo.ts:30 src/routes/[lang]/(pages)/feedback/+page.svelte:12 | 反馈 - GFork Proxy | 回饋 - GFork Proxy | Feedback - GFork Proxy | フィードバック - GFork Proxy |
| `meta.feedback_desc` | 描述 | src/lib/seo.ts:30 src/routes/[lang]/(pages)/feedback/+page.svelte:13 | 遇到问题、发现错误、有想法，都可以从这一页告诉我们。 | 遇到問題、發現錯誤、有想法，都可以從這一頁告訴我們。 | Found a bug, a wrong script, or have an idea? This page is how you tell us. | 不具合、間違い、要望はこのページからどうぞ。 |
| `meta.applist_title` | 标题 | src/lib/seo.ts:31 src/routes/[lang]/(pages)/applist/+page.svelte:11 | 各平台可用用户脚本管理器 - GFork Proxy | 各平台可用使用者腳本管理器 - GFork Proxy | Script Managers - GFork Proxy | スクリプトマネージャー - GFork Proxy |
| `meta.applist_desc` | 描述 | src/lib/seo.ts:31 src/routes/[lang]/(pages)/applist/+page.svelte:12 | Tampermonkey、Violentmonkey、ScriptCat 这几个主流脚本管理器，按浏览器和系统整理好了。 | Tampermonkey、Violentmonkey、ScriptCat 這幾個主流腳本管理器，按瀏覽器和系統整理好了。 | Tampermonkey, Violentmonkey, ScriptCat and friends — user script managers sorted by browser and platform. | Tampermonkey、Violentmonkey、ScriptCat など、ブラウザ・OS 別に整理したユーザースクリプトマネージャ一覧。 |
| `meta.installing_title` | 标题 | src/lib/seo.ts:32 src/routes/[lang]/(pages)/installing/+page.svelte:11 | 油猴脚本安装与常见问题 - GFork Proxy | 油猴腳本安裝與常見問題 - GFork Proxy | Installation Guide - GFork Proxy | インストールガイド - GFork Proxy |
| `meta.installing_desc` | 描述 | src/lib/seo.ts:32 src/routes/[lang]/(pages)/installing/+page.svelte:12 | 从下载脚本到第一次跑起来，一步一步说清楚，附常见报错怎么处理。 | 從下載腳本到第一次跑起來，一步一步說清楚，附常見報錯怎麼處理。 | From downloading a script to running it the first time, step by step, with fixes for the usual errors. | ダウンロードから初回実行までを順番に。よくあるエラーの直し方も。 |
| `meta.download_title` | 标题 | src/lib/seo.ts:25 | 脚本下载加速 - GFork Proxy | 腳本下載加速 - GFork Proxy | Script Download - GFork Proxy | スクリプトダウンロード - GFork Proxy |
| `meta.download_desc` | 描述 | src/lib/seo.ts:25 src/routes/[lang]/(pages)/download/+page.svelte:19 | 下载脚本时自动挑最快的节点，慢的直接跳过，不用自己选。 | 下載腳本時自動挑最快的節點，慢的直接跳過，不用自己選。 | Downloads pick the fastest node automatically and skip the slow ones — no manual choosing. | ダウンロード時に最速のノードを自動で選択。遅いノードは飛ばすので、手動で選ぶ必要はありません。 |
| `meta.lookup_title` | 标题 | src/lib/seo.ts:26 | 脚本搜索 - GFork Proxy | 腳本搜尋 - GFork Proxy | Script Search - GFork Proxy | スクリプト検索 - GFork Proxy |
| `meta.lookup_desc` | 描述 | src/lib/seo.ts:26 src/routes/[lang]/(pages)/lookup/+page.svelte:111 | 搜 Greasy Fork 上的脚本，能按名字找，也能按站点、语言、安装量和更新时间筛选。 | 搜 Greasy Fork 上的腳本，能按名字找，也能按站點、語言、安裝量和更新時間篩選。 | Search Greasy Fork scripts by name, or filter by site, language, install count and last update. | Greasy Fork のスクリプト検索。名前はもちろん、サイト・言語・インストール数・更新日でも絞れます。 |

## 搜索结果页（`lookup.*`，45 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `lookup.title` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:33 | 脚本搜索 | 腳本搜尋 | Script Search | スクリプト検索 |
| `lookup.description` | 正文 |  | 搜索 Greasy Fork 上的用户脚本 | 搜尋 Greasy Fork 上的使用者腳本 | Search user scripts on Greasy Fork | Greasy Fork のユーザースクリプトを検索 |
| `lookup.retry` | 正文 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:78 | 重试 | 重試 | Retry | 再試行 |
| `lookup.result_count` | 正文 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:31 · 占位符 {n} | 共 {n} 个结果 | 共 {n} 個結果 | Results: {n} | {n} 件の結果 |
| `lookup.row_placeholder_title` | 标题 | src/lib/dynamic/blocks/lookup.svelte.ts:41 | 脚本标题 | 腳本標題 | Script title | スクリプト名 |
| `lookup.row_placeholder_desc` | 描述 | src/lib/dynamic/blocks/lookup.svelte.ts:42 | 脚本的名称、简介和安装量会显示在这里。 | 腳本的名稱、簡介和安裝量會顯示在這裡。 | A script’s name, description and install count appear here. | スクリプトの名前・説明・インストール数がここに表示されます。 |
| `lookup.loading` | 正文 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:33 | 搜索中… | 搜尋中… | Searching… | 検索中… |
| `lookup.warning` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:275 | 脚本由第三方发布，可靠性无法保证。安装前请检查代码和相关内容，谨防欺诈。 | 腳本由第三方發布，可靠性無法保證。安裝前請檢查程式碼和相關內容，謹防詐騙。 | Scripts are published by third parties and may not be reliable. Check the code and content before installing, and watch out for scams. | スクリプトは第三者が公開したもので、信頼性は保証できません。インストール前にコードと内容を確認し、詐欺にご注意ください。 |
| `lookup.no_results` | 空状态 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:30 | 没有找到相关脚本 | 沒有找到相關腳本 | No scripts found | 該当するスクリプトが見つかりません |
| `lookup.daily_installs` | 正文 | src/routes/[lang]/(pages)/+page.svelte:61 src/routes/[lang]/(pages)/lookup/+page.svelte:49 | 日安装量 | 日安裝量 | Daily Installs | 日次インストール |
| `lookup.total_installs` | 正文 | src/routes/[lang]/(pages)/+page.svelte:60 src/routes/[lang]/(pages)/lookup/+page.svelte:48 | 总安装量 | 總安裝量 | Total Installs | 総インストール数 |
| `lookup.ratings` | 正文 | src/routes/[lang]/(pages)/+page.svelte:62 src/routes/[lang]/(pages)/lookup/+page.svelte:50 | 评分 | 評分 | Ratings | 評価 |
| `lookup.created` | 正文 | src/routes/[lang]/(pages)/+page.svelte:65 src/routes/[lang]/(pages)/lookup/+page.svelte:54 | 创建于 | 建立於 | Created | 作成日 |
| `lookup.updated` | 正文 | src/routes/[lang]/(pages)/+page.svelte:66 src/routes/[lang]/(pages)/lookup/+page.svelte:55 | 更新于 | 更新於 | Updated | 更新日 |
| `lookup.pagination.first` | 正文 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:113 src/lib/dynamic/blocks/ScriptInfoBlock.svelte:357 | 第一页 | 第一頁 | First page | 最初のページ |
| `lookup.pagination.prev` | 正文 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:120 src/lib/dynamic/blocks/ScriptInfoBlock.svelte:364 | 上一页 | 上一頁 | Previous | 前へ |
| `lookup.pagination.next` | 正文 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:128 src/lib/dynamic/blocks/ScriptInfoBlock.svelte:373 | 下一页 | 下一頁 | Next | 次へ |
| `lookup.sidebar_sort` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:138 | 排序： | 排序： | Sort by: | 並び替え： |
| `lookup.sidebar_advanced` | 正文 | src/routes/[lang]/(pages)/+page.svelte:155 src/routes/[lang]/(pages)/lookup/+page.svelte:167 | 高级搜索选项 | 進階搜尋選項 | Advanced Search | 高度な検索 |
| `lookup.load_failed` | 错误提示 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:32 | 加载失败 | 載入失敗 | Load failed | 読み込み失敗 |
| `lookup.sidebar_title` | 标题 | src/routes/[lang]/(pages)/lookup/+page.svelte:127 | 搜索选项 | 搜尋選項 | Search Options | 検索オプション |
| `lookup.lang_all` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:156 | 显示所有语言 | 顯示所有語言 | Show all languages | すべての言語を表示 |
| `lookup.lang_zh` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:159 | 只看中文 | 只看中文 | Chinese only | 中国語のみ |
| `lookup.filter_site_placeholder` | 输入框占位 | src/routes/[lang]/(pages)/+page.svelte:160 src/routes/[lang]/(pages)/lookup/+page.svelte:174 | 网站域名过滤（如：bilibili.com） | 網站網域過濾（如：bilibili.com） | Site domain filter (e.g. bilibili.com) | サイトドメインフィルター（例：bilibili.com） |
| `lookup.filter_apply` | 按钮 | src/routes/[lang]/(pages)/+page.svelte:223 src/routes/[lang]/(pages)/lookup/+page.svelte:256 | 应用筛选 | 套用篩選 | Apply filters | フィルターを適用 |
| `lookup.filter_clear` | 按钮 | src/routes/[lang]/(pages)/lookup/+page.svelte:259 | 清除筛选 | 清除篩選 | Clear filters | フィルターをクリア |
| `lookup.filter_script_lang` | 正文 | src/routes/[lang]/(pages)/+page.svelte:209 src/routes/[lang]/(pages)/lookup/+page.svelte:235 | 脚本语言筛选 | 腳本語言篩選 | Script Language | スクリプト言語 |
| `lookup.filter_multi_hint` | 说明 | src/routes/[lang]/(pages)/+page.svelte:216 src/routes/[lang]/(pages)/lookup/+page.svelte:249 | 按住 Ctrl 键可多选（Windows） | 按住 Ctrl 鍵可多選（Windows） | Hold Ctrl to multi-select (Windows) | Ctrlキーを押しながら複数選択（Windows） |
| `lookup.operator.gt` | 正文 | src/routes/[lang]/(pages)/+page.svelte:174 src/routes/[lang]/(pages)/lookup/+page.svelte:194 | 大于 | 大於 | Greater than | より大きい |
| `lookup.operator.lt` | 正文 | src/routes/[lang]/(pages)/+page.svelte:175 src/routes/[lang]/(pages)/lookup/+page.svelte:195 | 小于 | 小於 | Less than | より小さい |
| `lookup.operator.eq` | 正文 | src/routes/[lang]/(pages)/+page.svelte:176 src/routes/[lang]/(pages)/lookup/+page.svelte:196 | 等于 | 等於 | Equal to | 等しい |
| `lookup.operator.after` | 正文 | src/routes/[lang]/(pages)/+page.svelte:199 src/routes/[lang]/(pages)/lookup/+page.svelte:220 | 晚于 | 晚於 | After | 以降 |
| `lookup.operator.before` | 正文 | src/routes/[lang]/(pages)/+page.svelte:200 src/routes/[lang]/(pages)/lookup/+page.svelte:221 | 早于 | 早於 | Before | 以前 |
| `lookup.sidebar_lang` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:152 | 语言筛选 | 語言篩選 | Language | 言語 |
| `lookup.sort_relevance` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:38 | 相关程度 | 相關程度 | Relevance | 関連度 |
| `lookup.sort_daily_installs` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:39 | 日安装量 | 日安裝量 | Daily Installs | 日次インストール |
| `lookup.sort_total_installs` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:40 | 总安装量 | 總安裝量 | Total Installs | 総インストール数 |
| `lookup.sort_ratings` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:41 | 评分 | 評分 | Rating | 評価 |
| `lookup.sort_created` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:42 | 创建日期 | 建立日期 | Created | 作成日 |
| `lookup.sort_updated` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:43 | 更新日期 | 更新日期 | Updated | 更新日 |
| `lookup.sort_name` | 正文 | src/routes/[lang]/(pages)/lookup/+page.svelte:44 | 名称 | 名稱 | Name | 名前 |
| `lookup.filter_value_placeholder` | 输入框占位 | src/routes/[lang]/(pages)/+page.svelte:184 src/routes/[lang]/(pages)/lookup/+page.svelte:202 | 数值 | 數值 | Value | 値 |
| `lookup.placeholder_title` | 标题 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:34 | 搜索示例 | 搜尋範例 | Search Example | 検索の例 |
| `lookup.placeholder_desc` | 描述 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:41 | 还没有搜索内容。在左侧输入关键词开始搜索，也可以在地址栏的 # 后面直接加搜索参数。 | 還沒有搜尋內容。在左側輸入關鍵字開始搜尋，也可以在位址列的 # 後面直接加搜尋參數。 | No search terms yet. Enter keywords on the left to start searching, or add search parameters after the # in the address bar. | 検索ワードがありません。左側にキーワードを入力して検索するか、アドレスバーの # の後ろに検索パラメータを追加してください。 |
| `lookup.placeholder_example` | 输入框占位 | src/lib/dynamic/blocks/LookupResultsBlock.svelte:41 | #?q=哔哩哔哩 | #?q=嗶哩嗶哩 | #?q=bilibili | #?q=bilibili |

## 脚本详情页（`info.*`，24 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `info.loading` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:227 | 加载中… | 載入中… | Loading… | 読み込み中… |
| `info.loading_notice` | 说明 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:430 | 脚本由第三方发布，可靠性无法保证。安装前请检查代码和相关内容，谨防欺诈。 | 腳本由第三方發布，可靠性無法保證。安裝前請檢查程式碼和相關內容，謹防詐騙。 | Scripts are published by third parties and may not be reliable. Check the code and content before installing, and watch out for scams. | スクリプトは第三者が公開したもので、信頼性は保証できません。インストール前にコードと内容を確認し、詐欺にご注意ください。 |
| `info.error` | 错误提示 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:227 | 加载失败 | 載入失敗 | Load failed | 読み込みに失敗しました |
| `info.placeholder_desc` | 描述 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:266 | 没有识别到有效的脚本或用户链接。在地址栏的 # 后面加上脚本路径或用户链接，就能在这里看到详细信息。 | 沒有辨識到有效的腳本或使用者連結。在位址列的 # 後面加上腳本路徑或使用者連結，就能在這裡看到詳細資訊。 | No valid script or user link found. Add a script path or user link after the # in the address bar to see its details here. | 有効なスクリプトまたはユーザーのリンクが見つかりません。アドレスバーの # の後ろにスクリプトのパスかユーザーのリンクを追加すると、詳細がここに表示されます。 |
| `info.placeholder_example` | 输入框占位 | src/lib/dynamic/blocks/info.svelte.ts:318 · 占位符 {locale} | 在链接末尾添加 #/{locale}/scripts/123456/detail | 在連結末尾新增 #/{locale}/scripts/123456/detail | Append #/{locale}/scripts/123456/detail to the end of a link | リンクの末尾に #/{locale}/scripts/123456/detail を追加 |
| `info.history_invalid_toast` | 错误提示 | src/lib/dynamic/blocks/info.svelte.ts:458 | 这条历史链接已失效，请重新搜索脚本 | 這條歷史連結已失效，請重新搜尋腳本 | This history link has expired. Please search for the script again. | この履歴のリンクは無効になりました。スクリプトを検索し直してください。 |
| `info.history_invalid_title` | 标题 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:85 | [历史记录已失效] | [歷史記錄已失效] | [History link expired] | [履歴のリンクは無効です] |
| `info.retry` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:237 | 刷新重试 | 重新整理重試 | Refresh and retry | ページを更新して再試行 |
| `info.install_help` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:285 | 如何安装 | 如何安裝 | How to install | インストール方法 |
| `info.install_details` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:292 | 查看源站下载链接 | 檢視源站下載連結 | View the source download link | 元サイトのダウンロードリンクを表示 |
| `info.info_tab` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:202 | 信息 | 資訊 | Info | 情報 |
| `info.feedback_tab` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:211 | 反馈 | 回饋 | Feedback | フィードバック |
| `info.source_link` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:189 | 源站链接 | 源站連結 | Source link | ソースリンク |
| `info.proxy_tab` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:219 | 兼容版页面 | 相容版頁面 | Compatible version | 互換ページ |
| `info.notice` | 说明 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:180 | 你看到的是第三方内容的镜像，仅用于加速访问，本站不保证其可靠性。 | 你看到的是第三方內容的鏡像，僅用於加速存取，本站不保證其可靠性。 | This is a mirror of third-party content, provided only to speed up access. GFork can’t vouch for its reliability. | 第三者コンテンツのミラーで、アクセスを高速化する目的でのみ提供しています。当サイトはその信頼性を保証できません。 |
| `info.unknown_user` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:383 | 未知用户 | 未知使用者 | Unknown user | 不明なユーザー |
| `info.scripts` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:407 | 脚本 | 腳本 | Scripts | スクリプト |
| `info.no_scripts` | 空状态 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:421 | 该用户暂无脚本 | 該使用者暫無腳本 | This user has no scripts | このユーザーにはスクリプトがありません |
| `info.fallback_title` | 标题 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:257 | 脚本标题 | 腳本標題 | Script title | スクリプト名 |
| `info.fallback_meta` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:258 | 作者 — · 版本 — · 安装量 — · 好评率 — | 作者 — · 版本 — · 安裝量 — · 好評率 — | Author — · Version — · Installs — · Rating — | 作者 — ・ バージョン — ・ インストール数 — ・ 高評価率 — |
| `info.fallback_desc` | 描述 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:259 | 脚本描述会显示在这里。 | 腳本描述會顯示在這裡。 | The script description appears here. | スクリプトの説明がここに表示されます。 |
| `info.fallback_feedback` | 正文 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:338 | 脚本反馈会显示在这里。 | 腳本回饋會顯示在這裡。 | Script feedback appears here. | スクリプトのフィードバックがここに表示されます。 |
| `info.no_description` | 描述 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:325 | 暂无描述 | 暫無描述 | No description | 説明なし |
| `info.no_feedback` | 空状态 | src/lib/dynamic/blocks/ScriptInfoBlock.svelte:344 | 暂无反馈 | 暫無回饋 | No feedback yet | フィードバックはまだありません |

## 下载加速页（`download.*`，20 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `download.title` | 正文 | src/lib/dynamic/blocks/download.svelte.ts:66 src/lib/dynamic/blocks/DownloadProbeBlock.svelte:40 | 脚本下载加速 | 腳本下載加速 | Script Download Acceleration | スクリプトダウンロード加速 |
| `download.description` | 正文 |  | 正在选择最快的下载节点… | 正在選擇最快的下載節點… | Picking the fastest download node… | 最速のダウンロードノードを選択中… |
| `download.stage_ip` | 正文 | src/lib/dynamic/blocks/download.svelte.ts:67 | 正在获取你的 IP 地址… | 正在獲取你的 IP 地址… | Getting your IP address… | IP アドレスを取得中… |
| `download.stage_probe` | 正文 | src/lib/dynamic/blocks/download.svelte.ts:117 | 正在测试节点连接速度… | 正在測試節點連線速度… | Testing node speeds… | ノードの速度を測定中… |
| `download.stage_analyze` | 正文 | src/lib/dynamic/blocks/download.svelte.ts:140 | 正在分析测速结果… | 正在分析測速結果… | Analyzing results… | 測定結果を分析中… |
| `download.cache_hit` | 正文 | src/lib/dynamic/blocks/download.svelte.ts:110 | 缓存有效，即将跳转 | 快取有效，即將跳轉 | Cache is valid, redirecting shortly | キャッシュが有効です。まもなく移動します |
| `download.best_hit` | 正文 | src/lib/dynamic/blocks/download.svelte.ts:152 | 已选好最快的节点，即将跳转 | 已選好最快的節點，即將跳轉 | Fastest node selected, redirecting shortly | 最速のノードを選択しました。まもなく移動します |
| `download.fallback_pick` | 正文 | src/lib/dynamic/blocks/download.svelte.ts:160 | 测速失败，已改用备用节点 | 測速失敗，已改用備用節點 | Speed test failed, using a backup node | 測定に失敗したため、予備ノードを使用します |
| `download.node_title` | 标题 | src/lib/dynamic/blocks/DownloadProbeBlock.svelte:66 · 占位符 {n} | 测速节点（{n} 个） | 測速節點（{n} 個） | Test nodes ({n}) | 測定ノード（{n} 件） |
| `download.node_pending` | 正文 | src/lib/dynamic/blocks/DownloadProbeBlock.svelte:75 | 等待中 | 等待中 | Pending | 待機中 |
| `download.lowest_latency` | 正文 | src/lib/dynamic/blocks/DownloadProbeBlock.svelte:91 · 占位符 {ms} | 最低延迟 {ms} ms | 最低延遲 {ms} ms | Lowest latency: {ms} ms | 最小遅延 {ms} ms |
| `download.reload_tip` | 说明 | src/lib/dynamic/blocks/DownloadProbeBlock.svelte:107 | 打不开的话，刷新页面再试一次 | 打不開的話，重新整理頁面再試一次 | If it doesn’t open, refresh the page and try again | 開かない場合は、ページを再読み込みしてください |
| `download.testing` | 正文 | src/lib/dynamic/blocks/download.svelte.ts:116 | 测速中 | 測速中 | Testing | テスト中 |
| `download.success` | 正文 | src/lib/dynamic/blocks/download.svelte.ts:165 | 验证成功 | 驗證成功 | Verified | 検証成功 |
| `download.manual` | 正文 | src/lib/dynamic/blocks/DownloadProbeBlock.svelte:104 | 立即前往 | 立即前往 | Go now | 今すぐ移動 |
| `download.cache_days` | 正文 | src/lib/dynamic/blocks/DownloadProbeBlock.svelte:82 · 占位符 {days} | 缓存有效期 {days} 天 | 快取有效期 {days} 天 | Cache valid for {days} days | キャッシュの有効期間：{days} 日 |
| `download.no_path_title` | 标题 | src/lib/dynamic/blocks/download.svelte.ts:86 | 未指定脚本路径 | 未指定腳本路徑 | No script path specified | スクリプトのパスが指定されていません |
| `download.no_path_desc` | 描述 | src/lib/dynamic/blocks/download.svelte.ts:87 | 在地址栏的 # 后面加上脚本的完整路径（含 .user.js）。 | 在位址列的 # 後面加上腳本的完整路徑（含 .user.js）。 | Add the full script path (including .user.js) after the # in the address bar. | アドレスバーの # の後ろに、スクリプトの完全なパス（.user.js を含む）を追加してください。 |
| `download.no_path_example` | 空状态 | src/lib/dynamic/blocks/DownloadProbeBlock.svelte:110 | 示例： | 範例： | Example: | 例： |
| `download.back_home` | 正文 | src/lib/dynamic/blocks/DownloadProbeBlock.svelte:118 | 返回首页 | 返回首頁 | Back to home | ホームへ戻る |

## 帮助页（`help.*`，17 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `help.section_getting_started` | 正文 | src/routes/[lang]/(pages)/help/+page.svelte:95 | 入门指南 | 入門指南 | Getting Started | はじめに |
| `help.section_support` | 正文 | src/routes/[lang]/(pages)/help/+page.svelte:118 | 帮助与支持 | 幫助與支援 | Help & Support | ヘルプとサポート |
| `help.section_community` | 正文 | src/routes/[lang]/(pages)/help/+page.svelte:150 | 社区与开源 | 社群與開源 | Community & Open Source | コミュニティとオープンソース |
| `help.card_install_title` | 标题 | src/routes/[lang]/(pages)/help/+page.svelte:22 | 安装指南 | 安裝指南 | Install Guide | インストールガイド |
| `help.card_install_desc` | 描述 | src/routes/[lang]/(pages)/help/+page.svelte:23 | 装好脚本管理器，开始使用用户脚本。 | 裝好腳本管理器，開始使用使用者腳本。 | Install a userscript manager in your browser and get started. | マネージャーを入れて、ユーザースクリプトを使い始めましょう。 |
| `help.card_managers_title` | 标题 | src/routes/[lang]/(pages)/help/+page.svelte:28 | 脚本管理器 | 腳本管理器 | Script Managers | スクリプトマネージャー |
| `help.card_managers_desc` | 描述 | src/routes/[lang]/(pages)/help/+page.svelte:29 | 各平台（桌面、Android、iOS）能用的脚本管理器。 | 各平台（桌面、Android、iOS）能用的腳本管理器。 | Userscript managers for desktop, Android and iOS. | デスクトップ・Android・iOS で使えるマネージャーの一覧。 |
| `help.card_feedback_title` | 标题 | src/routes/[lang]/(pages)/help/+page.svelte:37 | 问题反馈 | 問題回饋 | Feedback | フィードバック |
| `help.card_feedback_desc` | 描述 | src/routes/[lang]/(pages)/help/+page.svelte:38 | 报告问题、提建议，或直接联系我们。 | 報告問題、提建議，或直接聯絡我們。 | Report a problem, suggest an improvement, or get in touch. | 不具合の報告やご要望、お問い合わせはこちら。 |
| `help.card_docs_title` | 标题 | src/routes/[lang]/(pages)/help/+page.svelte:43 | 文档 | 文件 | Documentation | ドキュメント |
| `help.card_docs_desc` | 描述 | src/routes/[lang]/(pages)/help/+page.svelte:44 | Greasy Fork 官方文档：脚本的安装、使用和发布。 | Greasy Fork 官方文件：腳本的安裝、使用和發布。 | Greasy Fork’s own docs on installing, using and publishing scripts. | Greasy Fork のドキュメント。インストール・使い方・公開方法を確認できます。 |
| `help.card_tampermonkey_title` | 标题 | src/routes/[lang]/(pages)/help/+page.svelte:50 | Tampermonkey 帮助 | Tampermonkey 幫助 | Tampermonkey Help | Tampermonkey ヘルプ |
| `help.card_tampermonkey_desc` | 描述 | src/routes/[lang]/(pages)/help/+page.svelte:51 | Tampermonkey（篡改猴）官方 FAQ 和问题排查。 | Tampermonkey（篡改猴）官方 FAQ 和問題排查。 | Tampermonkey’s official FAQ and troubleshooting guides. | Tampermonkey の公式 FAQ とトラブルシューティング。 |
| `help.card_greasemonkey_title` | 标题 | src/routes/[lang]/(pages)/help/+page.svelte:57 | Greasemonkey 帮助 | Greasemonkey 幫助 | Greasemonkey Help | Greasemonkey ヘルプ |
| `help.card_greasemonkey_desc` | 描述 | src/routes/[lang]/(pages)/help/+page.svelte:58 | Greasemonkey 官方 Wiki 和问题排查。 | Greasemonkey 官方 Wiki 和問題排查。 | Greasemonkey’s official wiki and troubleshooting guides. | Greasemonkey の公式 Wiki とトラブルシューティング。 |
| `help.card_github_title` | 标题 | src/routes/[lang]/(pages)/help/+page.svelte:67 | GitHub | GitHub | GitHub | GitHub |
| `help.card_github_desc` | 描述 | src/routes/[lang]/(pages)/help/+page.svelte:68 | Greasy Fork 是开源的（GPLv3），代码在 GitHub 上。 | Greasy Fork 是開源的（GPLv3），程式碼在 GitHub 上。 | Greasy Fork is open source (GPLv3). The code is on GitHub. | Greasy Fork はオープンソース（GPLv3）です。ソースコードは GitHub で公開されています。 |

## 关于页（`about.*`，15 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `about.title` | 正文 | src/routes/[lang]/(pages)/about/+page.svelte:23 | 关于 | 關於 | About | サイトについて |
| `about.description` | 正文 | src/routes/[lang]/(pages)/about/+page.svelte:28 | GFork Proxy 是 Greasy Fork 的镜像站，让你更顺畅地浏览、搜索和下载用户脚本。 | GFork Proxy 是 Greasy Fork 的鏡像站，讓你更順暢地瀏覽、搜尋和下載使用者腳本。 | GFork Proxy is a mirror of Greasy Fork. It makes browsing, searching and downloading userscripts faster and more reliable. | GFork Proxy は Greasy Fork のミラーサイトです。ユーザースクリプトの閲覧・検索・ダウンロードを、より速く安定して行えます。 |
| `about.features` | 正文 | src/routes/[lang]/(pages)/about/+page.svelte:34 | 功能 | 功能 | What it does | 機能 |
| `about.feature_1` | 正文 | src/routes/[lang]/(pages)/+page.svelte:31 src/routes/[lang]/(pages)/about/+page.svelte:54 | 多节点 CDN：脚本和资源通过亚太地区的边缘节点分发 | 多節點 CDN：腳本和資源透過亞太地區的邊緣節點分發 | Multi-node CDN: scripts and resources are served from edge nodes in the Asia-Pacific region | マルチノード CDN：スクリプトとリソースをアジア太平洋地域のエッジノードから配信 |
| `about.feature_2` | 正文 | src/routes/[lang]/(pages)/+page.svelte:31 src/routes/[lang]/(pages)/about/+page.svelte:74 | 搜索与筛选：可按安装量、评分、日期、语言、域名过滤 | 搜尋與篩選：可按安裝量、評分、日期、語言、網域過濾 | Search and filters: narrow results by installs, rating, date, language or domain | 検索とフィルター：インストール数・評価・日付・言語・ドメインで絞り込み |
| `about.feature_3` | 正文 | src/routes/[lang]/(pages)/+page.svelte:31 src/routes/[lang]/(pages)/about/+page.svelte:94 | 自动选节点：下载时测速，走最快的 CDN 节点 | 自動選節點：下載時測速，走最快的 CDN 節點 | Automatic node selection: downloads are tested and routed to the fastest CDN node | ノードの自動選択：ダウンロード時に測定し、最速の CDN ノードを使用 |
| `about.feature_4` | 正文 | src/routes/[lang]/(pages)/about/+page.svelte:114 | 多语言界面：简体中文、繁體中文、English、日本語 | 多語言介面：简体中文、繁體中文、English、日本語 | Languages: 简体中文, 繁體中文, English, 日本語 | 対応言語：简体中文、繁體中文、English、日本語 |
| `about.opensource_title` | 标题 | src/routes/[lang]/(pages)/about/+page.svelte:126 | 开源 | 開源 | Open Source | オープンソース |
| `about.opensource_desc` | 描述 | src/routes/[lang]/(pages)/about/+page.svelte:128 | 本项目以 GPLv3 开源，代码都在 GitHub 上。 | 本專案以 GPLv3 開源，程式碼都在 GitHub 上。 | This project is open source under the GPLv3. All code is on GitHub. | このプロジェクトは GPLv3 のオープンソースで、コードはすべて GitHub で公開しています。 |
| `about.opensource_link` | 正文 | src/routes/[lang]/(pages)/about/+page.svelte:130 | 在 GitHub 上查看源码 | 在 GitHub 上檢視原始碼 | View the source on GitHub | GitHub でソースコードを見る |
| `about.contact` | 正文 | src/routes/[lang]/(pages)/about/+page.svelte:142 | 联系我们 | 聯絡我們 | Contact | お問い合わせ |
| `about.contact_desc` | 描述 | src/routes/[lang]/(pages)/about/+page.svelte:144 | 有问题或建议，可以通过下面的方式联系我们： | 有問題或建議，可以透過下面的方式聯絡我們： | Questions or feedback? Reach us here: | ご質問・ご意見は、こちらまでお寄せください： |
| `about.tos_title` | 标题 | src/routes/[lang]/(pages)/about/+page.svelte:151 | 用户协议 | 使用者協議 | Terms of Service | 利用規約 |
| `about.tos_desc` | 描述 | src/routes/[lang]/(pages)/about/+page.svelte:153 | 使用前请先阅读 | 使用前請先閱讀 | Before using the site, please read the | ご利用前に、次の規約をお読みください： |
| `about.tos_link` | 正文 | src/routes/[lang]/(pages)/about/+page.svelte:155 | 《GFork Proxy 用户协议》 | 《GFork Proxy 使用者協議》 | GFork Proxy Terms of Service | GFork Proxy 利用規約 |

## 用户协议页（`tos.*`，33 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `tos.title` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:21 | GFork Proxy 用户协议 | GFork Proxy 使用者協議 | GFork Proxy Terms of Service | GFork Proxy 利用規約 |
| `tos.welcome` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:23 | 欢迎使用 GFork Proxy。 | 歡迎使用 GFork Proxy。 | Welcome to GFork Proxy. | GFork Proxy へようこそ。 |
| `tos.preamble` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:24 | 使用 GFork Proxy 用户脚本加速站（以下简称“本站”）前，请先阅读这份《GFork Proxy 用户协议》（以下简称“本协议”）。你使用本站，即表示已阅读、理解并同意本协议。 | 使用 GFork Proxy 使用者腳本加速站（以下簡稱「本站」）前，請先閱讀這份《GFork Proxy 使用者協議》（以下簡稱「本協議」）。你使用本站，即表示已閱讀、理解並同意本協議。 | Please read this GFork Proxy Terms of Service (the “Terms”) before using the GFork Proxy userscript mirror (the “Site”). By using the Site, you confirm that you have read, understood and agreed to the Terms. | GFork Proxy ユーザースクリプトミラー（以下「当サイト」）をご利用になる前に、この利用規約（以下「本規約」）をお読みください。当サイトを利用された時点で、本規約を読み、理解し、同意したものとみなします。 |
| `tos.section1_title` | 标题 | src/routes/[lang]/(pages)/tos/+page.svelte:33 | 一、本站简介 | 一、本站簡介 | 1. About the Site | 第1条 サイトの概要 |
| `tos.section1_1` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:35 | 本站由 GFork 团队运营，提供用户脚本的访问和下载加速服务。 | 本站由 GFork 團隊營運，提供使用者腳本的存取和下載加速服務。 | The Site is run by the GFork team and speeds up access to and downloads of userscripts. | 当サイトは GFork チームが運営し、ユーザースクリプトの閲覧とダウンロードを高速化するサービスを提供します。 |
| `tos.section1_2` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:37 | 本站的脚本数据均镜像自 Greasy Fork，不存储任何用户脚本内容或用户隐私数据。本站只提供技术服务，与任何第三方网站、服务或内容无关。 | 本站的腳本資料均鏡像自 Greasy Fork，不儲存任何使用者腳本內容或使用者隱私資料。本站只提供技術服務，與任何第三方網站、服務或內容無關。 | Script data on the Site is mirrored from Greasy Fork. We don’t store any userscript content or users’ private data. The Site only provides a technical service and has no affiliation with any third-party website, service or content. | 当サイトのスクリプトデータは Greasy Fork からミラーしたものです。ユーザースクリプトの内容や利用者の個人情報は保存しません。当サイトは技術的なサービスのみを提供しており、第三者のサイト・サービス・コンテンツとは関係ありません。 |
| `tos.section2_title` | 标题 | src/routes/[lang]/(pages)/tos/+page.svelte:39 | 二、使用规范 | 二、使用規範 | 2. Usage Rules | 第2条 利用ルール |
| `tos.section2_1` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:40 | 你需要遵守所在国家或地区的法律法规，以及本协议和相关管理规定。 | 你需要遵守所在國家或地區的法律法規，以及本協議和相關管理規定。 | You must comply with the laws and regulations of your country or region, as well as these Terms and related rules. | お客様は、所在する国または地域の法令と、本規約および関連する管理規則を守るものとします。 |
| `tos.section2_2` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:41 | 你不得利用本站从事以下行为：传播恶意软件、病毒或其他有害代码；侵犯他人知识产权或其他合法权益；发起网络攻击或其他破坏行为；发布虚假、误导或欺诈信息；骚扰、恐吓或威胁他人；以及其他违反法律法规或公序良俗的行为。 | 你不得利用本站從事以下行為：傳播惡意軟體、病毒或其他有害程式碼；侵犯他人智慧財產權或其他合法權益；發起網路攻擊或其他破壞行為；發布虛假、誤導或詐騙資訊；騷擾、恐嚇或威脅他人；以及其他違反法律法規或公序良俗的行為。 | You must not use the Site to distribute malware, viruses or other harmful code; infringe intellectual property or other legal rights; carry out network attacks or other destructive activity; post false, misleading or fraudulent information; harass, intimidate or threaten others; or do anything else that violates the law or public order. | 当サイトを次の目的で利用することはできません：マルウェア・ウイルスなどの有害なコードの配布、知的財産権その他の権利の侵害、ネットワーク攻撃などの破壊行為、虚偽・誤解を招く・詐欺的な情報の投稿、嫌がらせや脅迫、その他法令や公序良俗に反する行為。 |
| `tos.section2_3` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:42 | 你不得通过以下方式干扰或破坏本站的正常运行：获取源站服务器 IP、爆破扫描、DDoS、CC 攻击、XSS 等。 | 你不得透過以下方式干擾或破壞本站的正常運作：獲取源站伺服器 IP、爆破掃描、DDoS、CC 攻擊、XSS 等。 | You must not interfere with or disrupt the Site, including by trying to obtain origin server IPs, brute-force scanning, DDoS or CC attacks, or XSS. | 次のような方法で当サイトの運営を妨害してはいけません：オリジンサーバーの IP の取得、ブルートフォーススキャン、DDoS・CC 攻撃、XSS など。 |
| `tos.section2_4` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:43 | 你需要对自己访问期间的所有行为负责。 | 你需要對自己存取期間的所有行為負責。 | You are responsible for everything done through your access. | お客様のアクセスによるすべての行為について、お客様が責任を負います。 |
| `tos.section3_title` | 标题 | src/routes/[lang]/(pages)/tos/+page.svelte:46 | 三、用户权利与义务 | 三、使用者權利與義務 | 3. User Rights and Obligations | 第3条 利用者の権利と義務 |
| `tos.section3_1` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:47 | 你可以按照本协议使用本站，并获得技术支持。 | 你可以按照本協議使用本站，並獲得技術支援。 | You may use the Site under these Terms and receive technical support. | お客様は、本規約に従って当サイトを利用し、技術サポートを受けることができます。 |
| `tos.section3_2` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:48 | 你需要遵守本协议和相关管理规定，共同维护网络秩序和安全；自行判断用户脚本的安全性和合法性，并承担由此产生的全部风险；保护个人信息和隐私，不得泄露或滥用他人的个人信息。 | 你需要遵守本協議和相關管理規定，共同維護網路秩序和安全；自行判斷使用者腳本的安全性和合法性，並承擔由此產生的全部風險；保護個人資訊和隱私，不得洩露或濫用他人的個人資訊。 | You must follow these Terms and related rules and help keep the internet safe and orderly. You must judge the safety and legality of userscripts yourself and accept all resulting risks. You must protect personal information and privacy, and must not disclose or misuse other people’s personal information. | お客様は、本規約と関連規則を守り、インターネットの秩序と安全の維持に協力するものとします。ユーザースクリプトの安全性・合法性は各自で判断し、それに伴うすべてのリスクを負うものとします。個人情報とプライバシーを守り、他人の個人情報を漏らしたり悪用したりしてはいけません。 |
| `tos.section3_3_title` | 标题 | src/routes/[lang]/(pages)/tos/+page.svelte:49 | 重要提醒 | 重要提醒 | Important Notice | 重要なお知らせ |
| `tos.section3_3_content` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:51 | 内容责任：从本站下载的任何内容，请在 24 小时内删除。本站不对你下载的用户脚本的合法性、安全性、适用性承担任何责任，使用脚本产生的全部风险由你自行承担。数据来源：本站的脚本数据均镜像自 Greasy Fork，不存储任何用户脚本内容。登录限制：登录系统来自 Greasy Fork，稳定性无法保证，脚本发布等需要人机验证的功能无法正常使用。登录只在评论、用户功能和举报等功能中生效，其他页面不会传送 Cookie。建议尽量不要在任何镜像站使用登录功能。 | 內容責任：從本站下載的任何內容，請在 24 小時內刪除。本站不對你下載的使用者腳本的合法性、安全性、適用性承擔任何責任，使用腳本產生的全部風險由你自行承擔。資料來源：本站的腳本資料均鏡像自 Greasy Fork，不儲存任何使用者腳本內容。登入限制：登入系統來自 Greasy Fork，穩定性無法保證，腳本發布等需要人機驗證的功能無法正常使用。登入只在評論、使用者功能和檢舉等功能中生效，其他頁面不會傳送 Cookie。建議儘量不要在任何鏡像站使用登入功能。 | Content: Delete anything you download from the Site within 24 hours. We are not responsible for the legality, safety or suitability of any userscript you download through the Site, and you accept all risks of using it. Data source: Script data is mirrored from Greasy Fork, and we don’t store any userscript content. Login: The login system comes from Greasy Fork and may be unstable. Features that require human verification, such as publishing scripts, won’t work. Login only takes effect for comments, user features and reporting, and no cookies are sent on other pages. We recommend not using login on any mirror site. | コンテンツ：当サイトからダウンロードしたものは、24時間以内に削除してください。ダウンロードしたユーザースクリプトの合法性・安全性・適合性について、当サイトは責任を負いません。利用に伴うリスクはすべてお客様が負うものとします。データの出どころ：スクリプトデータは Greasy Fork からミラーしたもので、スクリプトの内容は保存していません。ログイン：ログイン機能は Greasy Fork のものであり、動作が不安定な場合があります。スクリプトの公開など、人間による認証が必要な機能は正常に動作しません。ログインが有効なのはコメント・ユーザー機能・通報のみで、その他のページには Cookie を送信しません。ミラーサイトではログインを使わないことをおすすめします。 |
| `tos.section4_title` | 标题 | src/routes/[lang]/(pages)/tos/+page.svelte:60 | 四、运营与广告 | 四、營運與廣告 | 4. Operations and Advertising | 第4条 運営と広告 |
| `tos.section4_1` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:61 | 本站不接受任何捐赠。 | 本站不接受任何捐贈。 | The Site does not accept donations. | 当サイトは寄付を受け付けていません。 |
| `tos.section4_2` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:62 | 本站可能根据实际情况调整广告的展示方式和内容。使用本站即表示你理解并同意。 | 本站可能根據實際情況調整廣告的展示方式和內容。使用本站即表示你理解並同意。 | We may change how ads are displayed and what they show, depending on circumstances. By using the Site, you agree to this. | 広告の表示方法や内容は、状況に応じて変更することがあります。当サイトを利用することで、これに同意したものとみなします。 |
| `tos.section5_title` | 标题 | src/routes/[lang]/(pages)/tos/+page.svelte:64 | 五、免责声明 | 五、免責宣告 | 5. Disclaimer | 第5条 免責事項 |
| `tos.section5_1` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:65 | 使用过程中可能遇到不可抗力等因素，导致服务受到影响。出现这类情况时我们会尽力处理，但由此造成的损失，本站不承担责任。 | 使用過程中可能遇到不可抗力等因素，導致服務受到影響。出現這類情況時我們會盡力處理，但由此造成的損失，本站不承擔責任。 | Force majeure and other factors may affect the service. We will do our best to deal with them, but we are not liable for any resulting losses. | 不可抗力などによりサービスに影響が出ることがあります。その場合は対応に努めますが、それによる損害について当サイトは責任を負いません。 |
| `tos.section5_2` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:66 | 因以下情形导致的服务中断或受阻，本站不承担责任，包括但不限于：计算机病毒、木马等恶意程序的破坏；双方软硬件或通信线路故障；用户操作不当或通过未经授权的方式使用服务；程序版本过旧、设备老化或兼容性问题；无法控制或无法合理预见的情形；第三方服务商瘫痪；突发流量导致 CDN 欠费；其他不可抗力。 | 因以下情形導致的服務中斷或受阻，本站不承擔責任，包括但不限於：電腦病毒、木馬等惡意程式的破壞；雙方軟硬體或通訊線路故障；使用者操作不當或透過未經授權的方式使用服務；程式版本過舊、裝置老化或相容性問題；無法控制或無法合理預見的情形；第三方服務商癱瘓；突發流量導致 CDN 欠費；其他不可抗力。 | We are not liable for service interruptions or disruptions, including but not limited to those caused by: malware such as viruses and Trojans; hardware, software or network failures on either side; improper operation or unauthorized use; outdated software, aging devices or compatibility problems; events beyond our control or reasonable foresight; outages at third-party providers; CDN overdue fees caused by sudden traffic spikes; and other force majeure events. | 次のような原因によるサービスの中断・障害について、当サイトは責任を負いません（これらに限りません）：ウイルスやトロイの木馬などのマルウェアによる被害、双方のハードウェア・ソフトウェアや通信回線の障害、利用者の誤操作や無許可の方法での利用、ソフトウェアのバージョンの古さ・機器の老朽化・互換性の問題、制御できない、または合理的に予見できない事態、第三者サービス事業者の障害、急なトラフィック増加による CDN 料金の未払い、その他の不可抗力。 |
| `tos.section5_3` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:67 | 本站不对你通过本站下载的用户脚本的合法性、安全性、适用性承担任何责任，使用脚本产生的全部风险由你自行承担。 | 本站不對你透過本站下載的使用者腳本的合法性、安全性、適用性承擔任何責任，使用腳本產生的全部風險由你自行承擔。 | We are not responsible for the legality, safety or suitability of userscripts you download through the Site. You accept all risks of using them. | 当サイト経由でダウンロードしたユーザースクリプトの合法性・安全性・適合性について、当サイトは責任を負いません。利用に伴うリスクはすべてお客様が負うものとします。 |
| `tos.section6_title` | 标题 | src/routes/[lang]/(pages)/tos/+page.svelte:69 | 六、协议修改与争议解决 | 六、協議修改與爭議解決 | 6. Changes and Disputes | 第6条 規約の変更と紛争解決 |
| `tos.section6_1` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:70 | 本协议条款的最终解释权归 GFork Proxy 运营方所有。 | 本協議條款的最終解釋權歸 GFork Proxy 營運方所有。 | The GFork Proxy operator has the final right to interpret these Terms. | 本規約の最終的な解釈権は GFork Proxy の運営者にあります。 |
| `tos.section6_2` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:71 | 本协议部分条款无效或无法执行时，其余条款仍然有效。 | 本協議部分條款無效或無法執行時，其餘條款仍然有效。 | If any provision of these Terms is invalid or unenforceable, the rest remain in effect. | 本規約の一部が無効または執行できない場合でも、残りの条項は引き続き有効です。 |
| `tos.section6_3` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:72 | 我们可能因法律变更或网站功能调整而修改本协议，修改后的内容会发布在本页面，不另行通知。你继续使用本站，即视为接受修改后的条款。 | 我們可能因法律變更或網站功能調整而修改本協議，修改後的內容會發布在本頁面，不另行通知。你繼續使用本站，即視為接受修改後的條款。 | We may update these Terms when laws or site features change. Updates are posted on this page without separate notice. By continuing to use the Site, you accept the updated Terms. | 法令の変更やサイト機能の変更に応じて、本規約を変更することがあります。変更後の内容は本ページに掲載し、個別の通知は行いません。変更後も利用を続けた場合、変更後の規約に同意したものとみなします。 |
| `tos.section6_4` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:73 | 因本协议产生的任何纠纷，各方应通过友好协商解决。 | 因本協議產生的任何糾紛，各方應透過友好協商解決。 | Any dispute arising from these Terms shall be resolved through friendly negotiation. | 本規約に関して紛争が生じた場合は、友好的な協議によって解決するものとします。 |
| `tos.section7_title` | 标题 | src/routes/[lang]/(pages)/tos/+page.svelte:75 | 七、联系我们 | 七、聯絡我們 | 7. Contact | 第7条 お問い合わせ |
| `tos.section7_1` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:76 | 对本协议或本站有任何意见或建议，请通过以下方式联系我们： | 對本協議或本站有任何意見或建議，請透過以下方式聯絡我們： | If you have comments or suggestions about these Terms or the Site, contact us: | 本規約または当サイトに関するご意見・ご要望は、次の連絡先までお寄せください： |
| `tos.email` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:78 | 邮箱： | 電子郵件： | Email: | メール： |
| `tos.thanks` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:93 | 感谢使用 GFork Proxy。 | 感謝使用 GFork Proxy。 | Thank you for using GFork Proxy. | GFork Proxy をご利用いただきありがとうございます。 |
| `tos.email_note` | 正文 | src/routes/[lang]/(pages)/tos/+page.svelte:80 | （请勿直接复制此邮箱） | （請勿直接複製此電子郵件地址） | Please don’t copy this address directly. | （このアドレスを直接コピーしないでください） |

## 反馈页（`feedback.*`，2 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `feedback.title_page` | 正文 | src/routes/[lang]/(pages)/feedback/+page.svelte:23 | GFork Proxy 反馈 | GFork Proxy 回饋 | GFork Proxy Feedback | GFork Proxy フィードバック |
| `feedback.contact` | 正文 | src/routes/[lang]/(pages)/feedback/+page.svelte:26 | 对本站有任何意见或建议，请通过以下方式联系我们： | 對本站有任何意見或建議，請透過以下方式聯絡我們： | If you have comments or suggestions about the site, contact us: | 当サイトに関するご意見・ご要望は、次の連絡先までお寄せください： |

## 脚本管理器页（`applist.*`，3 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `applist.desktop_browsers` | 正文 | src/routes/[lang]/(pages)/applist/+page.svelte:25 | 桌面浏览器列表 | 桌面瀏覽器列表 | Desktop Browsers | デスクトップブラウザ |
| `applist.android_browsers` | 正文 | src/routes/[lang]/(pages)/applist/+page.svelte:168 | Android 浏览器列表 | Android 瀏覽器列表 | Android Browsers | Android ブラウザ |
| `applist.ios_browsers` | 正文 | src/routes/[lang]/(pages)/applist/+page.svelte:270 | iOS 浏览器列表 | iOS 瀏覽器列表 | iOS Browsers | iOS ブラウザ |

## 安装教程页（`installing.*`，12 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `installing.title_page` | 正文 | src/routes/[lang]/(pages)/installing/+page.svelte:26 | 安装与常见问题 | 安裝與常見問題 | Installation and FAQ | インストールとよくある質問 |
| `installing.steps_title` | 标题 | src/routes/[lang]/(pages)/installing/+page.svelte:41 | 安装步骤 | 安裝步驟 | Installation Steps | インストール手順 |
| `installing.what_is` | 正文 | src/routes/[lang]/(pages)/installing/+page.svelte:29 | 用户脚本（油猴脚本）是什么，有什么用？ | 使用者腳本（油猴腳本）是什麼，有什麼用？ | What are userscripts (Tampermonkey scripts), and what are they for? | ユーザースクリプトとは？何ができる？ |
| `installing.step1_title` | 标题 | src/routes/[lang]/(pages)/installing/+page.svelte:43 | 第一步：安装一个用户脚本管理器 | 第一步：安裝一個使用者腳本管理器 | Step 1: Install a user script manager | ステップ1：ユーザースクリプトマネージャーをインストール |
| `installing.step2_title` | 标题 | src/routes/[lang]/(pages)/installing/+page.svelte:48 | 第二步：安装用户脚本 | 第二步：安裝使用者腳本 | Step 2: Install a user script | ステップ2：ユーザースクリプトをインストール |
| `installing.step3_title` | 标题 | src/routes/[lang]/(pages)/installing/+page.svelte:62 | 第三步：使用脚本 | 第三步：使用腳本 | Step 3: Using scripts | ステップ3：スクリプトの使用 |
| `installing.notes_title` | 标题 | src/routes/[lang]/(pages)/installing/+page.svelte:74 | 注意事项 | 注意事項 | Notes | 注意事項 |
| `installing.qa_title` | 标题 | src/routes/[lang]/(pages)/installing/+page.svelte:82 | Q&A | Q&A | Q&A | Q&A |
| `installing.qa_manage` | 正文 | src/routes/[lang]/(pages)/installing/+page.svelte:84 | 如何管理已安装脚本 | 如何管理已安裝腳本 | How to manage installed scripts | インストール済みスクリプトの管理方法 |
| `installing.qa_download` | 正文 | src/routes/[lang]/(pages)/installing/+page.svelte:99 | 为什么只显示代码或下载文件，没有安装按钮 | 為什麼只顯示程式碼或下載檔案，沒有安裝按鈕 | Why do I see code or a file download instead of an install button? | インストールボタンではなく、コードやファイルのダウンロードが表示される |
| `installing.qa_baidu` | 正文 | src/routes/[lang]/(pages)/installing/+page.svelte:109 | 为什么会跳到百度搜索页面 | 為什麼會跳到百度搜尋頁面 | Why does a Baidu search page open? | Baidu の検索ページが開くのはなぜ？ |
| `installing.qa_win7` | 正文 | src/routes/[lang]/(pages)/installing/+page.svelte:114 | Windows 7 怎么安装用户脚本 | Windows 7 怎麼安裝使用者腳本 | How to install userscripts on Windows 7 | Windows 7 でユーザースクリプトをインストールするには |

## 中间页 /s /l（`redirect.*`，4 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `redirect.title` | 正文 | src/lib/components/RedirectInterstitial.svelte:35 | 正在跳转 - GFork Proxy | 正在跳轉 - GFork Proxy | Redirecting - GFork Proxy | 移動中 - GFork Proxy |
| `redirect.waiting` | 正文 | src/lib/dynamic/blocks/countdown.svelte.ts:47 · 占位符 {countdown} | 正在载入 Greasy Fork 内容，{countdown} 秒后跳转 | 正在載入 Greasy Fork 內容，{countdown} 秒後跳轉 | Loading Greasy Fork content. Redirecting in {countdown}s | Greasy Fork を読み込み中です。{countdown} 秒後に移動します |
| `redirect.loading` | 正文 | src/lib/dynamic/blocks/countdown.svelte.ts:83 | 加载中… | 載入中… | Loading… | 読み込み中… |
| `redirect.skip` | 正文 | src/lib/components/RedirectInterstitial.svelte:23 | 刷新重试 | 重新整理重試 | Refresh | 再読み込み |

## 广告位（无障碍标签）（`ads.*`，1 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `ads.label` | 标签 / 无障碍 | src/lib/components/Ad.svelte:185 | 广告 | 廣告 | Advertisement | 広告 |

## 联系方式（`contact.*`，5 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `contact.email` | 正文 | src/lib/components/ContactChannels.svelte:29 | 邮箱 | 電子郵件 | Email | メール |
| `contact.github` | 正文 | src/lib/components/ContactChannels.svelte:37 src/lib/components/Footer.svelte:99 | GitHub 仓库 | GitHub 儲存庫 | GitHub repository | GitHub リポジトリ |
| `contact.email_hint` | 说明 | src/lib/components/ContactChannels.svelte:31 | 一般咨询、侵权和隐私问题 | 一般諮詢、侵權和隱私問題 | General enquiries, takedown and privacy requests | 一般的なお問い合わせ・権利侵害・プライバシーに関するご連絡 |
| `contact.github_label` | 标签 / 无障碍 | src/routes/[lang]/(pages)/tos/+page.svelte:83 | GitHub 仓库： | GitHub 儲存庫： | GitHub repository: | GitHub リポジトリ： |
| `contact.github_hint` | 说明 | src/lib/components/ContactChannels.svelte:42 | 功能建议、Bug 反馈、查看源码 | 功能建議、Bug 回報、查看原始碼 | Feature requests, bug reports and source code | 機能のご要望・不具合の報告・ソースコード |

## 指标条（安装量/评分…）（`stat.*`，6 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `stat.total_installs` | 正文 | src/lib/components/StatBar.svelte:42 | 总安装量 | 總安裝量 | Total installs | 総インストール数 |
| `stat.installs` | 正文 | src/lib/components/StatBar.svelte:45 | 安装 | 安裝 | installs | インストール |
| `stat.daily_installs` | 正文 | src/lib/components/StatBar.svelte:47 | 今日安装 | 今日安裝 | Today’s installs | 本日のインストール |
| `stat.daily` | 正文 | src/lib/components/StatBar.svelte:50 | 今日 | 今日 | today | 本日 |
| `stat.good_rating` | 正文 | src/lib/components/StatBar.svelte:55 | 好评 | 好評 | positive | 高評価 |
| `stat.updated` | 正文 | src/lib/components/StatBar.svelte:59 | 更新 | 更新 | updated | 更新 |

## 安装按钮（`install.*`，10 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `install.label` | 正文 | src/lib/components/InstallButton.svelte:31 | 安装脚本 | 安裝腳本 | Install script | スクリプトをインストール |
| `install.started` | 正文 | src/lib/components/InstallButton.svelte:42 | 已发出安装请求，请在脚本管理器里确认 | 已發出安裝請求，請在腳本管理器裡確認 | Install requested. Check your userscript manager. | インストールを要求しました。スクリプトマネージャーをご確認ください |
| `install.not_popped` | 正文 | src/lib/components/InstallButton.svelte:42 | 安装弹窗没出现？ | 安裝彈窗沒出現？ | Installation dialog didn’t appear? | インストール画面が出ませんか？ |
| `install.guide` | 正文 | src/lib/components/InstallButton.svelte:44 | 安装指引 | 安裝指引 | How to install | インストールガイド |
| `install.copied` | 正文 | src/lib/components/InstallButton.svelte:56 | 已复制 | 已複製 | Copied | コピーしました |
| `install.copy_failed` | 错误提示 | src/lib/components/InstallButton.svelte:58 | 复制失败，请手动复制 | 複製失敗，請手動複製 | Copy failed, please copy manually | コピーに失敗しました。手動でコピーしてください |
| `install.more` | 正文 | src/lib/components/InstallButton.svelte:90 | 更多操作 | 更多操作 | More options | その他の操作 |
| `install.menu_copy` | 正文 | src/lib/components/InstallButton.svelte:100 | 复制安装链接 | 複製安裝連結 | Copy install link | インストールリンクをコピー |
| `install.menu_source` | 正文 | src/lib/components/InstallButton.svelte:111 | 打开原始页面 | 開啟原始頁面 | Open original page | 元のページを開く |
| `install.menu_help` | 正文 | src/lib/components/InstallButton.svelte:116 | 安装帮助 | 安裝幫助 | Installation help | インストールのヘルプ |

## 语言名（`lang.*`，4 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `lang.zh-hans` | 正文 |  | 简体中文 | 简体中文 | 简体中文 | 简体中文 |
| `lang.zh-hant` | 正文 |  | 繁體中文 | 繁體中文 | 繁體中文 | 繁體中文 |
| `lang.en` | 正文 |  | English | English | English | English |
| `lang.ja` | 正文 |  | 日本語 | 日本語 | 日本語 | 日本語 |

## 主题切换（`theme.*`，7 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `theme.picker_title` | 标题 |  | 主题配色 | 主題配色 | Theme Color | テーマ配色 |
| `theme.default_scheme` | 正文 |  | 默认配色 | 預設配色 | Default | デフォルト |
| `theme.custom_scheme` | 正文 |  | 自定义配色 | 自定義配色 | Custom | カスタム |
| `theme.light` | 正文 |  | 浅色 | 淺色 | Light | ライト |
| `theme.dark` | 正文 |  | 深色 | 深色 | Dark | ダーク |
| `theme.theme` | 正文 | src/lib/components/Nav.svelte:135 | 外观 | 外觀 | Appearance | 表示モード |
| `theme.system` | 正文 |  | 跟随系统 | 跟隨系統 | System | システムに合わせる |

## 站点名（`site.*`，2 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `site.name` | 正文 | src/lib/components/Footer.svelte:42 src/routes/[lang]/(pages)/installing/+page.svelte:51 | GFork Proxy | GFork Proxy | GFork Proxy | GFork Proxy |
| `site.tagline` | 正文 | src/lib/components/Footer.svelte:43 | GreasyFork脚本加速访问网站 | Greasy Fork 鏡像站 - 用戶腳本CDN加速下載服務 | Greasy Fork Mirror - User Script CDN Acceleration & Download Service | Greasy Fork ミラーサイト - ユーザースクリプトCDN高速アクセss・ダウンロードサービス |

## 语言切换（`language.*`，1 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `language.select` | 正文 | src/lib/components/Footer.svelte:127 | 选择语言 | 選擇語言 | Select language | 言語を選択 |

## 搜索（通用 / 建议）（`search.*`，1 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `search.site.placeholder` | 输入框占位 | src/routes/[lang]/(pages)/+page.svelte:135 | 网站域名（可选），如 bilibili.com | 網站網域（可選），如 bilibili.com | Site domain (optional), e.g. bilibili.com | サイトのドメイン（任意）例：bilibili.com |

## Cookie 提示（`cookie.*`，5 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `cookie.title` | 正文 | src/lib/components/CookieConsent.svelte:26 | Cookie 与用户协议 | Cookie 與使用者協議 | Cookies & User Agreement | Cookie と利用規約 |
| `cookie.text` | 正文 | src/lib/components/CookieConsent.svelte:28 | 本站会使用 Cookie，你可以随时在浏览器中管理或清除。继续使用即表示你已阅读并同意 | 本站會使用 Cookie，你可以隨時在瀏覽器中管理或清除。繼續使用即表示你已閱讀並同意 | This site uses cookies. You can manage or clear them in your browser at any time. By continuing, you confirm that you have read and agree to our | 当サイトでは Cookie を使用します。Cookie はブラウザからいつでも管理・削除できます。サイトの利用を続けると、次の規約を読み、同意したものとみなします： |
| `cookie.tos_link` | 正文 | src/lib/components/CookieConsent.svelte:30 | 《GFork Proxy 用户协议》 | 《GFork Proxy 使用者協議》 | GFork Proxy Terms of Service | GFork Proxy 利用規約 |
| `cookie.accept` | 正文 | src/lib/components/CookieConsent.svelte:35 | 同意 | 同意 | Accept | 同意する |
| `cookie.decline` | 正文 | src/lib/components/CookieConsent.svelte:38 | 不同意 | 不同意 | Decline | 同意しない |

## 脚本卡片（`card.*`，1 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `card.by` | 正文 | src/lib/components/ScriptCard.svelte:97 | 作者 | 作者 | by | 投稿者 |

## 镜像状态（已关闭）（`mirror.*`，8 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `mirror.ok` | 正文 | src/lib/dynamic/blocks/mirror.ts:58 | 镜像正常 | 鏡像正常 | Mirror online | ミラー正常 |
| `mirror.degraded` | 正文 | src/lib/dynamic/blocks/mirror.ts:57 | 镜像响应偏慢 | 鏡像回應偏慢 | Mirror responding slowly | ミラー応答が遅い |
| `mirror.down` | 正文 | src/lib/dynamic/blocks/mirror.ts:59 | 镜像暂不可用 | 鏡像暫不可用 | Mirror temporarily unavailable | ミラー一時停止 |
| `mirror.checking` | 正文 | src/lib/dynamic/blocks/mirror.ts:34 | 镜像状态检测中… | 鏡像狀態檢測中… | Checking mirror status… | ミラー状態を確認中… |
| `mirror.unknown` | 正文 | src/lib/dynamic/blocks/mirror.ts:91 | 镜像状态未知 | 鏡像狀態未知 | Mirror status unknown | ミラー状態不明 |
| `mirror.latency` | 正文 | src/lib/dynamic/blocks/MirrorStatusBlock.svelte:41 | 延迟 | 延遲 | Latency | 遅延 |
| `mirror.synced` | 正文 | src/lib/dynamic/blocks/MirrorStatusBlock.svelte:45 | 上游同步 | 上游同步 | Upstream synced | 上流との同期 |
| `mirror.node` | 正文 | src/lib/dynamic/blocks/MirrorStatusBlock.svelte:47 | 当前节点 | 目前節點 | Active node | 現在のノード |

## 时间与相对时间（`time.*`，6 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `time.justNow` | 正文 | src/lib/format.ts:67 | 刚刚 | 剛剛 | just now | たった今 |
| `time.minutesAgo` | 正文 | src/lib/format.ts:68 · 占位符 {n} | {n} 分钟前 | {n} 分鐘前 | {n} minutes ago | {n} 分前 |
| `time.hoursAgo` | 正文 | src/lib/format.ts:69 · 占位符 {n} | {n} 小时前 | {n} 小時前 | {n} hours ago | {n} 時間前 |
| `time.daysAgo` | 正文 | src/lib/format.ts:70 · 占位符 {n} | {n} 天前 | {n} 天前 | {n} days ago | {n} 日前 |
| `time.monthsAgo` | 正文 | src/lib/format.ts:71 · 占位符 {n} | {n} 个月前 | {n} 個月前 | {n} months ago | {n} か月前 |
| `time.yearsAgo` | 正文 | src/lib/format.ts:72 · 占位符 {n} | {n} 年前 | {n} 年前 | {n} years ago | {n} 年前 |

## 使用引导步骤（`guide.*`，12 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `guide.title` | 正文 | src/lib/components/InstallGuideDialog.svelte:68 | 安装指引 | 安裝指引 | How to install | インストールガイド |
| `guide.close` | 正文 | src/lib/components/InstallGuideDialog.svelte:71 | 关闭 | 關閉 | Close | 閉じる |
| `guide.for_script` | 正文 | src/lib/components/InstallGuideDialog.svelte:78 | 脚本： | 腳本： | Script: | スクリプト： |
| `guide.step1_title` | 标题 | src/lib/components/InstallGuideDialog.svelte:59 | 安装脚本管理器 | 安裝腳本管理器 | Install a userscript manager | スクリプトマネージャーをインストール |
| `guide.step1_desc` | 描述 | src/lib/components/InstallGuideDialog.svelte:59 | 先安装 Tampermonkey、Violentmonkey 或 ScriptCat 等脚本管理器。 | 先安裝 Tampermonkey、Violentmonkey 或 ScriptCat 等腳本管理器。 | Start with Tampermonkey, Violentmonkey, or ScriptCat. | まず Tampermonkey、Violentmonkey、ScriptCat などのマネージャーをインストールします。 |
| `guide.step2_title` | 标题 | src/lib/components/InstallGuideDialog.svelte:60 | 点击安装按钮 | 點選安裝按鈕 | Click the install button | インストールボタンをクリック |
| `guide.step2_desc` | 描述 | src/lib/components/InstallGuideDialog.svelte:60 | 在脚本详情页点击「安装脚本」，脚本管理器会弹出安装确认。 | 在腳本詳情頁點選「安裝腳本」，腳本管理器會彈出安裝確認。 | On the script page, click Install script — your manager asks for confirmation. | スクリプトページで「スクリプトをインストール」をクリックすると、確認が表示されます。 |
| `guide.step3_title` | 标题 | src/lib/components/InstallGuideDialog.svelte:61 | 确认安装 | 確認安裝 | Confirm the install | インストールを確認 |
| `guide.step3_desc` | 描述 | src/lib/components/InstallGuideDialog.svelte:61 | 在管理器里确认后脚本即可生效；以后更新脚本重复以上步骤即可。 | 在管理器裡確認後腳本即可生效；以後更新腳本重複以上步驟即可。 | Confirm in your manager and the script is active. Repeat these steps to update it later. | マネージャー内で確認すると有効になります。更新もこの手順です。 |
| `guide.recommended` | 正文 | src/lib/components/InstallGuideDialog.svelte:96 | 推荐管理器 | 推薦管理器 | Recommended managers | おすすめのマネージャー |
| `guide.direct_install` | 正文 | src/lib/components/InstallGuideDialog.svelte:132 | 直接安装 | 直接安裝 | Install now | 今すぐインストール |
| `guide.note` | 正文 | src/lib/components/InstallGuideDialog.svelte:116 | 本站只提供安装加速，不修改脚本内容，也不会读取你的浏览数据。 | 本站只提供安裝加速，不修改腳本內容，也不會讀取你的瀏覽資料。 | This site only accelerates downloads. Script contents are never modified and no browsing data is collected. | 当サイトはダウンロードの高速化のみを行います。スクリプト内容は変更せず、閲覧データも取得しません。 |

## 首次使用引导（`onboarding.*`，10 条）

| key | 类型 | 位置 | zh-hans | zh-hant | en | ja |
| --- | --- | --- | --- | --- | --- | --- |
| `onboarding.title` | 正文 | src/lib/components/Onboarding.svelte:37 | 三步装上脚本 | 三步裝上腳本 | Install a script in three steps | 3 ステップでインストール |
| `onboarding.step1_title` | 标题 | src/lib/components/Onboarding.svelte:21 | 装一个脚本管理器 | 裝一個腳本管理器 | Get a userscript manager | マネージャーを入れる |
| `onboarding.step1_desc` | 描述 | src/lib/components/Onboarding.svelte:21 | Tampermonkey、Violentmonkey 或 ScriptCat 任选其一。 | Tampermonkey、Violentmonkey 或 ScriptCat 任選其一。 | Pick Tampermonkey, Violentmonkey, or ScriptCat. | Tampermonkey、Violentmonkey、ScriptCat から選びます。 |
| `onboarding.step2_title` | 标题 | src/lib/components/Onboarding.svelte:22 | 找到想要的脚本 | 找到想要的腳本 | Find your script | スクリプトを探す |
| `onboarding.step2_desc` | 描述 | src/lib/components/Onboarding.svelte:22 | 在站内搜索脚本名称或功能关键词。 | 在站內搜尋腳本名稱或功能關鍵字。 | Search by script name or feature keyword. | 名前や機能のキーワードで検索します。 |
| `onboarding.step3_title` | 标题 | src/lib/components/Onboarding.svelte:23 | 点击安装即可 | 點選安裝即可 | Click install | クリックするだけ |
| `onboarding.step3_desc` | 描述 | src/lib/components/Onboarding.svelte:23 | 本站会加速下载，安装仍由脚本管理器完成。 | 本站會加速下載，安裝仍由腳本管理器完成。 | We speed up the download; your manager still does the install. | 当サイトがダウンロードを高速化し、インストールはマネージャーが行います。 |
| `onboarding.dismiss` | 正文 | src/lib/components/Onboarding.svelte:41 | 关闭提示 | 關閉提示 | Dismiss | 閉じる |
| `onboarding.dont_show` | 正文 | src/lib/components/Onboarding.svelte:60 | 不再显示 | 不再顯示 | Don’t show again | 今後表示しない |
| `onboarding.got_it` | 正文 | src/lib/components/Onboarding.svelte:63 | 知道了 | 知道了 | Got it | OK |

## 站点配置文案（`src/config/config.json`）

| key | 说明 | 值 |
| --- | --- | --- |
| `site.name` | 站点名（全语言共用） | GFork Proxy |
| `site.tagline` | 副标题（全语言共用，英文） | Greasy Fork Script Accelerated Access Service |
| `site.description.zh-hans` | 站点级描述（OG / JSON-LD 兜底） | Greasy Fork 的加速镜像：脚本能看、能搜、能装，下载走加速通道。 |
| `site.description.zh-hant` | 站点级描述（OG / JSON-LD 兜底） | Greasy Fork 的加速鏡像：腳本能看、能搜、能裝，下載走加速通道。 |
| `site.description.en` | 站点级描述（OG / JSON-LD 兜底） | An accelerated mirror of Greasy Fork: browse, search and install userscripts without the wait. |
| `site.description.ja` | 站点级描述（OG / JSON-LD 兜底） | Greasy Fork の高速ミラー。閲覧・検索・インストールをストレスなく。 |

## 写死的英文串（根 `/s`、`/l` 中转页）

| key | 位置 | 说明 | 值 |
| --- | --- | --- | --- |
| `s.skip` | src/routes/s/+page.svelte | 中转页兜底按钮 | Click here if not redirected |
| `s.kw1` | src/routes/s/+page.svelte | 装饰关键词（opacity:0） | CDN加速 / 代理服务器 / 智能路由 / 全球加速 |
| `s.kw2` | src/routes/s/+page.svelte | 装饰关键词（opacity:0） | 边缘节点 / 跨境网络 / 负载均衡 / 反向代理 |
| `s.kw3` | src/routes/s/+page.svelte | 装饰关键词（opacity:0） | Shadowsocks / V2Ray / Trojan / WireGuard / SOCKS5 / HTTP代理 / VPN隧道 / 隧道协议 |
| `s.kw4` | src/routes/s/+page.svelte | 装饰关键词（opacity:0） | 智能DNS / 流量调度 / 零信任 / 端到端加密 / 传输优化 / 链路聚合 / 边缘计算 / 内容分发 |

## 不要改的内容

- `src/lib/content-defaults.ts`：把真实接口结果写进页面给爬虫看的机读文案（视觉隐藏），改了会和线上内容对不上。
- `src/config/config.json` 里的 `keywords`、`contactEmailCipher`、各广告位 slot id。
- 任何 `{#if}` / `data-*` / class 名里的英文字符串。
