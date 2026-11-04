<script lang="ts">
	/**
	 * 区块 script-info · text + html（视图）
	 *
	 * 冷加载：构建期写出完整骨架（标题 / 作者 / 版本 / 安装量 / 评分 / 描述各占一行，
	 * 文案来自 i18n）。水合后读 hash 取数，只覆盖文字与属性；
	 * 骨架节点用 `hidden` 收起而不是被 `{#if}` 删除，DOM 结构始终不变。
	 * 远端 HTML 片段一律先 sanitize 再注入到固定的容器里。
	 */
	import { untrack } from 'svelte';
	import { siteProxyUrl } from '$config';
	import { t, type Lang } from '$i18n';
	import { setDocumentTitle } from '../core/patch';
	import Slot from '../core/Slot.svelte';
	import Ad from '$components/Ad.svelte';
	import Icon from '$components/Icon.svelte';
	import InstallButton from '$components/InstallButton.svelte';
	import ScriptCard from '$components/ScriptCard.svelte';
	import StatBar from '$components/StatBar.svelte';
	import { createScriptInfo, placeholderExample } from './info.svelte';

	let { lang, locale }: { lang: Lang; locale: string } = $props();

	const info = $derived(createScriptInfo(lang, locale));

	const detail = $derived(info.detail);
	const feedback = $derived(info.feedback);
	const user = $derived(info.user);

	const isUser = $derived(info.route?.pageType === 'users');
	const hasRoute = $derived(info.route !== null);
	const example = $derived(placeholderExample(lang, locale));
	/**
	 * 构建期在详情卡里预留的骨架行数。
	 * 远端描述是成品 HTML、长度不可预知，所以先把卡片撑到接近真实高度；
	 * 数据到达后整块 `.if-fallback` 只切 `hidden`，不再改变结构。
	 */
	const infoLines = 10;

	const headerHtml = $derived(detail.data.header);
	const metaHtml = $derived(detail.data.meta);
	const additionalHtml = $derived(detail.data.additional);
	const feedbackHtml = $derived(feedback.data.list);

	const sourceHref = $derived(
		info.route ? `https://greasyfork.org${info.route.fullPath.replace(/\/detail$/, '')}` : undefined
	);

	/** 状态行：加载中 / 失败（失败时显示原因与重试） */
	const statusState = $derived.by(() => {
		if (isUser) {
			if (user.state === 'error') return 'error';
			return user.state === 'loading' ? 'loading' : 'idle';
		}
		if (info.tab === 'feedback') {
			if (feedback.state === 'error') return 'error';
			return feedback.state === 'loading' ? 'loading' : 'idle';
		}
		if (detail.state === 'error') return 'error';
		return detail.state === 'loading' ? 'loading' : 'idle';
	});
	const statusError = $derived(
		isUser
			? (user.error ?? '')
			: info.tab === 'feedback'
				? (feedback.error ?? '')
				: (detail.error ?? '')
	);

	// 水合后才初始化（读 hash + 挂监听 + 取数）
	$effect(() => {
		const current = info;
		untrack(() => current.init());
		return () => current.destroy();
	});

	// 文档标题跟随数据覆盖，SSR 阶段是空操作
	$effect(() => {
		const base = isUser
			? user.data.name
			: info.tab === 'feedback'
				? feedback.data.title
				: detail.data.title;
		const prefix = info.invalidHash ? `${t(lang, 'info.history_invalid_title')} ` : '';
		setDocumentTitle(base ? `${prefix}${base} - ZGF` : `${prefix}Script Info - ZGF`);
	});

	// ─── 链接改写：站内作者 / 适用站点 / 代理相对链接 ─────────────────────
	function rewriteLinks(container: HTMLElement | null): void {
		if (!container) return;
		container.querySelectorAll('a[href]').forEach((a) => {
			if (a.hasAttribute('data-processed')) return;
			const href = a.getAttribute('href');
			if (!href) return;

			/*
			 * 源站 HTML 里的用户链接是绝对地址（https://greasyfork.org/users/668710-k1995），
			 * 直接放行会让「点作者」跳出到 greasyfork.org。必须先改写到本站 info 页的用户路由，
			 * 并且只取数字 id（API 不认 -name 后缀）。
			 */
			const absUser = href.match(
				/^https?:\/\/(?:www\.)?(?:greasyfork|sleazyfork)\.org\/users\/(\d+)(?:-[^/?#]*)?/
			);
			if (absUser) {
				a.setAttribute('href', `/${lang}/info#/${locale}/users/${absUser[1]}`);
				a.setAttribute('data-processed', 'true');
				a.setAttribute('target', '_self');
				return;
			}

			if (
				href.startsWith('http://') ||
				href.startsWith('https://') ||
				href.startsWith('javascript:') ||
				href.startsWith('mailto:') ||
				href.startsWith('tel:') ||
				href.startsWith('#')
			) {
				return;
			}

			const userMatch = href.match(/\/users\/([^/?#]+)/);
			if (userMatch) {
				a.setAttribute('href', `/${lang}/info#/${locale}/users/${userMatch[1]!.split('-')[0]}`);
				a.setAttribute('data-processed', 'true');
				return;
			}

			const siteMatch = href.match(/\/scripts\/by-site\/([^/?]+)/);
			if (siteMatch) {
				a.setAttribute('href', `/${lang}/lookup#?site=${siteMatch[1]}`);
				a.setAttribute('data-processed', 'true');
				return;
			}

			if (/^\/(zh-hans|zh-hant|en|ja|zh-CN|zh-TW)\//.test(href)) return;

			const proxy = siteProxyUrl();
			a.setAttribute('href', proxy + (href.startsWith('/') ? href : '/' + href));
			a.setAttribute('data-processed', 'true');
			if (!a.hasAttribute('target')) a.setAttribute('target', '_blank');
		});
	}

	/**
	 * 链接改写必须跟着 `{@html}` 内容一起走：
	 * 详情数据是水合后才填进来的，action 只在挂载时跑一次，
	 * 所以这里用节点级 MutationObserver 盯住内容变化，否则远端 HTML 里的
	 * 作者链接（/users/xxx、https://greasyfork.org/users/xxx）永远改不到。
	 */
	function processLinks(node: HTMLElement): { destroy(): void } {
		rewriteLinks(node);
		const observer = new MutationObserver(() => rewriteLinks(node));
		observer.observe(node, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['href']
		});
		return { destroy: () => observer.disconnect() };
	}
</script>

<svelte:head>
	<title>Script Info - ZGF</title>
	<meta
		name="description"
		content="Detailed information about user scripts on Greasy Fork, including descriptions, ratings, install links and user feedback."
	/>
	<meta
		name="keywords"
		content="script info, userscript details, greasyfork script, script page, user script, script feedback"
	/>
</svelte:head>

<section class="info-page-root" data-block="script-info" data-state={statusState}>
	<div class="info-container">
		<div class="if-notice-bar">
			<span>{t(lang, 'info.notice')}</span>
			<a
				class="if-source-link"
				id="source-link"
				href={sourceHref}
				hidden={!hasRoute}
				target="_blank"
				rel="noopener noreferrer"
			>
				{t(lang, 'info.source_link')}
				<Icon name="external" size={14} />
			</a>
		</div>

		<div class="if-tabs" role="tablist">
			<button
				class="if-tab"
				class:is-active={info.tab === 'info'}
				role="tab"
				aria-selected={info.tab === 'info'}
				onclick={() => info.switchTab('info')}
			>
				{t(lang, 'info.info_tab')}
			</button>
			<button
				class="if-tab"
				class:is-active={info.tab === 'feedback'}
				role="tab"
				aria-selected={info.tab === 'feedback'}
				onclick={() => info.switchTab('feedback')}
			>
				{t(lang, 'info.feedback_tab')}
			</button>
			<a
				class="if-tab"
				href="{siteProxyUrl()}{info.route?.fullPath.replace(/\/detail$/, '') ?? ''}"
				target="_blank"
				rel="noopener noreferrer"
			>
				{t(lang, 'info.proxy_tab')}
				<Icon name="external" size={14} />
			</a>
		</div>

		<!-- 状态行：加载中 / 失败，结构固定 -->
		<div class="if-status" hidden={statusState === 'idle'}>
			<span class="if-status__label">
				{statusState === 'error' ? t(lang, 'info.error') : t(lang, 'info.loading')}
			</span>
			<span class="if-status__detail">{statusError}</span>
			<button
				type="button"
				class="ui-btn ui-btn--outlined"
				hidden={statusState !== 'error'}
				onclick={() => info.reload()}
			>
				<Icon name="refresh" size={18} />
				{t(lang, 'info.retry')}
			</button>
		</div>

		<!-- 详情面板 -->
		<article class="ui-card if-script-card" hidden={isUser || info.tab !== 'info'}>
			<!--
				加载遮罩：与 lookup 同一套做法 —— 只盖住视口可见的那一段（sticky + 负 margin），
				骨架（下面的 .if-fallback）本身完整留在 DOM 里，数据到达后只切 hidden。
			-->
			<div class="if-shield" hidden={statusState !== 'loading'} aria-hidden="true">
				<span class="if-shield__spinner"><Icon name="refresh" size={26} /></span>
				<span class="if-shield__text">{t(lang, 'info.loading')}</span>
			</div>

			<div class="if-content-area if-gf-header" id="script-header">
				<!-- 字段级默认内容：标题先被 json.title 覆盖，再被远端 header HTML 整段替换 -->
				<Slot resource={detail}>
					{#snippet children(view)}
						<div class="if-fallback" hidden={view.header !== ''}>
							<h1 class="if-fallback__title">{view.title || t(lang, 'info.fallback_title')}</h1>
							<p class="if-fallback__meta">{t(lang, 'info.fallback_meta')}</p>
							<p class="if-fallback__desc">{t(lang, 'info.fallback_desc')}</p>
							<!-- 预留行：把卡片撑到接近真实描述的高度，数据到了整块 hidden，不留高度跳变 -->
							{#each Array(Math.max(0, infoLines - 1)) as _, i (i)}
								<p class="if-fallback__reserve">&nbsp;</p>
							{/each}
							<p class="if-fallback__hint" hidden={hasRoute}>
								<Icon name="info" size={16} />
								<span>{t(lang, 'info.placeholder_desc')} <code>{example}</code></span>
							</p>
						</div>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- 远端 HTML 已在 info.svelte.ts 里经 core/patch.sanitize 白名单消毒 -->
						<div class="if-remote" use:processLinks>{@html view.header}</div>
					{/snippet}
				</Slot>
			</div>

			<div class="if-install-row" hidden={!detail.data.installPath}>
				<InstallButton
					{lang}
					installHref={`/${lang}/l#/${detail.data.installPath}`}
					sourceUrl={sourceHref}
					scriptName={detail.data.title}
				/>
				<a
					class="if-help-link"
					href="/{lang}/installing"
					title={t(lang, 'info.install_help')}
					rel="nofollow"
				>
					<Icon name="help-circle" size={18} />
					{t(lang, 'info.install_help')}
				</a>
				<details class="if-install-details" hidden={!detail.data.install}>
					<summary>{t(lang, 'info.install_details')}</summary>
					<code>{detail.data.install}</code>
				</details>
			</div>

			<div class="if-content-area if-gf-meta" id="script-meta">
				<div class="if-fallback" hidden={metaHtml !== ''}>
					<p class="if-fallback__meta">{t(lang, 'info.fallback_meta')}</p>
				</div>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- 同上，已消毒 -->
				<div class="if-remote" use:processLinks>{@html metaHtml}</div>
			</div>

			<!-- 正文内单元：详情页是最高意图页，脚本描述通常很长，这里是最可见的位置 -->
			<div class="if-ad if-ad--inline"><Ad type="horizontal" /></div>

			<div class="if-content-area if-gf-content" id="additional-info">
				<div class="if-fallback" hidden={additionalHtml !== ''}>
					<p class="if-fallback__desc">{t(lang, 'info.fallback_desc')}</p>
				</div>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- 同上，已消毒 -->
				<div class="if-remote" use:processLinks>{@html additionalHtml}</div>
			</div>

			<p
				class="if-no-content"
				hidden={!(
					detail.state === 'ready' &&
					headerHtml === '' &&
					metaHtml === '' &&
					additionalHtml === ''
				)}
			>
				{t(lang, 'info.no_description')}
			</p>
		</article>

		<!-- 反馈面板 -->
		<div hidden={isUser || info.tab !== 'feedback'}>
			<div class="ui-card if-script-card">
				<div class="if-content-area if-gf-feedback" id="feedback-list">
					<div class="if-fallback" hidden={feedbackHtml !== ''}>
						<p
							class="if-fallback__desc"
							hidden={feedback.state !== 'idle' && feedback.state !== 'loading'}
						>
							{t(lang, 'info.fallback_feedback')}
						</p>
						<p
							class="if-fallback__desc"
							hidden={!(feedback.state === 'ready' && feedbackHtml === '')}
						>
							{t(lang, 'info.no_feedback')}
						</p>
					</div>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- 同上，已消毒 -->
					<div class="if-remote" use:processLinks>{@html feedbackHtml}</div>
				</div>

				<nav class="if-pagination" hidden={feedback.data.totalPages <= 1}>
					<button
						class="ui-btn ui-btn--outlined"
						disabled={feedback.data.page === 1 || feedback.state === 'loading'}
						onclick={() => info.goToFeedbackPage(1)}
					>
						{t(lang, 'lookup.pagination.first')}
					</button>
					<button
						class="ui-btn ui-btn--outlined"
						disabled={feedback.data.page === 1 || feedback.state === 'loading'}
						onclick={() => info.goToFeedbackPage(feedback.data.page - 1)}
					>
						{t(lang, 'lookup.pagination.prev')}
					</button>
					<span class="if-page-indicator">{feedback.data.page} / {feedback.data.totalPages}</span>
					<button
						class="ui-btn ui-btn--outlined"
						disabled={feedback.data.page === feedback.data.totalPages ||
							feedback.state === 'loading'}
						onclick={() => info.goToFeedbackPage(feedback.data.page + 1)}
					>
						{t(lang, 'lookup.pagination.next')}
					</button>
				</nav>
			</div>
			<Ad type="horizontal" />
		</div>

		<!-- 作者面板：hash 路由是 users 时才显示 -->
		<article class="ui-card if-user-card" hidden={!isUser}>
			<header class="if-user-header">
				<h1 class="if-user-name">{user.data.name || t(lang, 'info.unknown_user')}</h1>
				<StatBar
					{lang}
					totalInstalls={user.data.totalInstalls}
					goodRatings={user.data.goodRatings}
					okRatings={user.data.okRatings}
					badRatings={user.data.badRatings}
				/>
			</header>

			<p class="if-user-bio" hidden={!user.data.bio}>{user.data.bio}</p>

			<p class="if-user-github" hidden={user.data.github.length === 0}>
				<span class="if-user-github__label">GitHub:</span>
				{#each user.data.github as gh, i (gh.name + i)}
					{#if gh.url}
						<a href={gh.url} target="_blank" rel="noopener noreferrer">{gh.name}</a>
					{:else}
						<span>{gh.name}</span>
					{/if}
					{#if i < user.data.github.length - 1}<span>, </span>{/if}
				{/each}
			</p>

			<h2 class="if-section-title">{t(lang, 'info.scripts')}</h2>

			<ul class="if-script-list" hidden={user.data.scripts.length === 0}>
				{#each user.data.scripts as script (script.id)}
					{@const dl = script.code_url
						? `/${lang}/l#/${script.code_url.replace('https://update.greasyfork.org/scripts/', '')}`
						: null}
					<li>
						<ScriptCard {lang} {script} variant="list" showInstall={!!dl} sites={[]} />
					</li>
				{/each}
			</ul>

			<p class="if-no-content" hidden={user.data.scripts.length > 0}>
				{t(lang, 'info.no_scripts')}
			</p>
		</article>

		<div class="if-ad"><Ad type="fluid" /></div>
		<div class="if-ad"><Ad type="auto" /></div>

		<p class="if-perm-notice">
			<Icon name="info" size={16} />
			<span>{t(lang, 'info.loading_notice')}</span>
		</p>
	</div>

	<!-- 移动端吸底安装条 -->
	<div class="if-install-bar" hidden={isUser || !detail.data.installPath}>
		<InstallButton
			{lang}
			installHref={`/${lang}/l#/${detail.data.installPath}`}
			sourceUrl={sourceHref}
			scriptName={detail.data.title}
			size="lg"
		/>
	</div>
</section>

<style>
	.info-page-root {
		color: var(--md-sys-color-on-surface);
	}
	.info-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 960px;
		margin: 0 auto;
		padding-bottom: 32px;
	}

	/* ─── 状态行 ────────────────────────────────────────────────────── */
	.if-status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 12px;
		min-height: 32px;
		font-size: var(--md-sys-typescale-body-small-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.if-status__label {
		font-weight: 500;
		color: var(--md-sys-color-on-surface);
	}
	.if-status__detail {
		flex: 1;
		min-width: 0;
	}
	.if-status__detail:empty {
		display: none;
	}

	/* ─── 默认骨架（构建期写进 HTML 的字段级默认内容） ──────────────── */
	.if-fallback {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.if-fallback__title {
		margin: 0 0 4px;
		font-size: var(--md-sys-typescale-headline-small-size);
		font-weight: 600;
		line-height: 1.35;
		color: var(--md-sys-color-on-surface);
	}
	.if-fallback__meta {
		margin: 0;
		font-size: var(--md-sys-typescale-body-small-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.if-fallback__desc {
		margin: 0;
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.75;
		color: var(--md-sys-color-on-surface-variant);
	}
	.if-fallback__hint {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin: 8px 0 0;
		font-size: var(--md-sys-typescale-body-small-size);
		line-height: 1.6;
		color: var(--md-sys-color-on-surface-variant);
	}
	.if-fallback__hint :global(svg) {
		margin-top: 2px;
	}
	.if-fallback__hint code {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		word-break: break-all;
	}

	.if-no-content {
		margin: 0;
		padding: 24px 0;
		text-align: center;
		color: var(--md-sys-color-on-surface-variant);
	}

	/* ─── Notice / Tabs ─────────────────────────────────────────────── */
	.if-notice-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px 16px;
		padding: 12px 16px;
		background: var(--md-sys-color-secondary-container);
		color: var(--md-sys-color-on-secondary-container);
		border-radius: var(--md-sys-shape-corner-medium);
		font-size: var(--md-sys-typescale-body-small-size);
		line-height: 1.6;
	}
	.if-source-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-weight: 600;
		color: inherit;
		text-decoration: none;
	}
	.if-source-link:hover {
		text-decoration: underline;
	}

	.if-tabs {
		display: flex;
		gap: 4px;
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
		overflow-x: auto;
	}
	.if-tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		padding: 0 16px;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--md-sys-typescale-title-small-size);
		font-weight: 500;
		color: var(--md-sys-color-on-surface-variant);
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		border-bottom: 2px solid transparent;
	}
	.if-tab:hover {
		color: var(--md-sys-color-on-surface);
	}
	.if-tab.is-active {
		color: var(--md-sys-color-primary);
		border-bottom-color: var(--md-sys-color-primary);
	}
	.if-tab:focus-visible {
		outline: 2px solid var(--md-sys-color-primary);
		outline-offset: -2px;
		border-radius: var(--md-shape-corner-small, 4px);
	}

	/* ─── Script detail ─────────────────────────────────────────────── */
	.if-script-card {
		padding: 24px;
		/* 与其它页卡片同色：surface 在浅色主题下偏灰，用 lowest 才是纯白 */
		background: var(--md-sys-color-surface-container-lowest);
	}
	.if-install-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		margin: 16px 0;
		padding: 14px 16px;
		background: var(--md-sys-color-surface-container-low);
		border-radius: var(--md-sys-shape-corner-medium);
	}
	.if-help-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 40px;
		font-size: var(--md-sys-typescale-label-large-size);
		color: var(--md-sys-color-primary);
		text-decoration: none;
	}
	.if-help-link:hover {
		text-decoration: underline;
	}
	.if-install-details {
		flex: 1 1 100%;
		min-width: 0;
		font-size: var(--md-sys-typescale-label-small-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.if-install-details summary {
		cursor: pointer;
	}
	.if-install-details code {
		display: block;
		margin-top: 6px;
		word-break: break-all;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	}

	.if-content-area {
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.75;
		color: var(--md-sys-color-on-surface);
	}
	.if-content-area :global(h1),
	.if-content-area :global(h2),
	.if-content-area :global(h3) {
		margin: 20px 0 10px;
		line-height: 1.4;
	}
	.if-content-area :global(h1) {
		font-size: var(--md-sys-typescale-title-large-size);
	}
	.if-content-area :global(h2) {
		font-size: var(--md-sys-typescale-title-medium-size);
	}
	.if-content-area :global(h3) {
		font-size: var(--md-sys-typescale-title-small-size);
	}
	.if-content-area :global(p) {
		margin: 10px 0;
	}
	.if-content-area :global(a) {
		color: var(--md-sys-color-primary);
	}
	.if-content-area :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--md-sys-shape-corner-small);
	}
	.if-content-area :global(pre) {
		overflow-x: auto;
		padding: 12px;
		background: var(--md-sys-color-surface-container-high);
		border-radius: var(--md-sys-shape-corner-small);
	}
	.if-content-area :global(code) {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.92em;
	}
	.if-content-area :global(table) {
		width: 100%;
		border-collapse: collapse;
		display: block;
		overflow-x: auto;
	}
	.if-content-area :global(th),
	.if-content-area :global(td) {
		padding: 8px 10px;
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
		text-align: start;
	}
	.if-content-area :global(ul),
	.if-content-area :global(ol) {
		padding-inline-start: 22px;
	}

	.if-ad {
		display: flex;
		justify-content: center;
	}
	.if-ad--inline {
		margin: 20px 0;
		padding: 16px 0;
		border-top: 1px solid var(--md-sys-color-outline-variant);
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
	}

	/* 预留骨架行：只有高度，没有内容（真实文案不知道，等远端 HTML） */
	.if-fallback__reserve {
		margin: 0;
		min-height: 1.7em;
		border-radius: var(--md-sys-shape-corner-extra-small);
		background: var(--md-sys-color-surface-container);
	}

	/* 加载遮罩：与 lookup 同一套（sticky 覆盖视口可见段，负 margin 不占位） */
	.if-shield {
		position: sticky;
		top: 88px;
		z-index: 6;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		height: min(52vh, 420px);
		margin-bottom: calc(-1 * min(52vh, 420px));
		background: var(--md-sys-color-surface-container-lowest);
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-body-medium-size);
	}
	.if-shield__spinner {
		display: inline-flex;
		color: var(--md-sys-color-primary);
		animation: if-shield-spin 0.9s linear infinite;
	}
	@keyframes if-shield-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.if-shield__spinner {
			animation: none;
		}
	}

	.if-perm-notice {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: 6px;
		margin: 0;
		padding: 4px 8px;
		font-size: var(--md-sys-typescale-label-small-size);
		line-height: 1.6;
		color: var(--md-sys-color-on-surface-variant);
		text-align: center;
	}
	.if-perm-notice :global(svg) {
		margin-top: 2px;
	}

	/* ─── Feedback pagination ───────────────────────────────────────── */
	.if-pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 20px;
	}
	.if-page-indicator {
		min-width: 56px;
		text-align: center;
		font-size: var(--md-sys-typescale-body-medium-size);
		font-variant-numeric: tabular-nums;
	}

	/* ─── User page ─────────────────────────────────────────────────── */
	.if-user-card {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 24px;
	}
	.if-user-header {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.if-user-name {
		margin: 0;
		font-size: var(--md-sys-typescale-headline-small-size);
		font-weight: 600;
	}
	.if-user-bio {
		margin: 0;
		padding: 12px 16px;
		background: var(--md-sys-color-surface-container-low);
		border-radius: var(--md-sys-shape-corner-small);
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.7;
		color: var(--md-sys-color-on-surface-variant);
	}
	.if-user-github {
		margin: 0;
		font-size: var(--md-sys-typescale-body-small-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.if-user-github__label {
		margin-inline-end: 4px;
	}
	.if-section-title {
		margin: 8px 0 0;
		font-size: var(--md-sys-typescale-title-medium-size);
		font-weight: 600;
	}
	.if-script-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* ─── Mobile install bar ────────────────────────────────────────── */
	.if-install-bar {
		display: none;
	}

	@media (max-width: 599px) {
		.if-script-card,
		.if-user-card {
			padding: 16px;
		}
		.if-install-bar {
			position: sticky;
			bottom: 0;
			z-index: 20;
			display: block;
			padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
			background: var(--md-sys-color-surface-container);
			border-top: 1px solid var(--md-sys-color-outline-variant);
		}
		.if-install-bar[hidden] {
			display: none;
		}
		.info-container {
			padding-bottom: 8px;
		}
	}
</style>
