<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { t, type Lang, i18nConfig } from '$i18n';
	import { siteConfig, siteProxyUrl } from '$lib/config';
	import { showSnackbar } from '$lib/ui-state.svelte';
	import Ad from '$components/Ad.svelte';
	import Icon from '$components/Icon.svelte';
	import InstallButton from '$components/InstallButton.svelte';
	import ScriptCard from '$components/ScriptCard.svelte';
	import StatBar from '$components/StatBar.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);
	let gfLocale: string = $derived(i18nConfig.langNames[lang]);

	// ─── Hash route parsing ──────────────────────────────────────────────
	interface RouteInfo {
		locale: string;
		scriptId: string | null;
		userId: string | null;
		pageType: 'detail' | 'feedback' | 'redirect' | 'users';
		fullPath: string;
	}

	let lastValidHash = $state('');
	let initialParamChecked = $state(false);
	let abortController: AbortController | null = $state(null);

	function isHashValid(hash: string): boolean {
		return (
			!!hash &&
			hash !== '#' &&
			hash !== '#google_vignette' &&
			hash.startsWith('#') &&
			hash.length > 1
		);
	}

	function parseHash(hashStr: string): RouteInfo | null {
		if (!hashStr) return null;
		const raw = hashStr.startsWith('#') ? hashStr.substring(1) : hashStr;
		if (!raw) return null;
		const path = raw.trim().replace(/^\/+|\/+$/g, '');
		if (!path) return null;

		const patterns: { regex: RegExp; pageType: RouteInfo['pageType'] }[] = [
			{
				regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?\/detail$/,
				pageType: 'detail'
			},
			{
				regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?\/feedback$/,
				pageType: 'feedback'
			},
			{
				regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?\/(code|versions|stats)$/,
				pageType: 'redirect'
			},
			{ regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?$/, pageType: 'redirect' },
			{ regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/users\/(.+)$/, pageType: 'users' }
		];

		for (const { regex, pageType } of patterns) {
			const m = path.match(regex);
			if (m) {
				const locale = (m[1] || '').toLowerCase();
				const normLocale =
					locale === 'zh-cn' || locale === 'zh-hans'
						? 'zh-CN'
						: locale === 'zh-tw' || locale === 'zh-hant'
							? 'zh-TW'
							: m[1];
				const rest = path.slice(m[1].length);
				return {
					locale: normLocale,
					scriptId: pageType !== 'users' ? m[2] : null,
					userId: pageType === 'users' ? m[2] : null,
					pageType,
					fullPath: '/' + normLocale + rest
				};
			}
		}
		return null;
	}

	function getRoute(): RouteInfo | null {
		const hash = window.location.hash;
		if (isHashValid(hash)) {
			const route = parseHash(hash);
			if (route) {
				lastValidHash = hash;
				return route;
			}
		}
		const fallback = lastValidHash;
		return isHashValid(fallback) ? parseHash(fallback) : null;
	}

	function setHashRoute(route: RouteInfo): void {
		// 仅用于拼 hash 后交给 history.replaceState，函数结束即丢弃
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const url = new URL(window.location.href);
		if (route.pageType === 'users') {
			url.hash = `#/${gfLocale}/users/${route.userId}`;
		} else {
			const suffix = route.pageType === 'detail' ? '/detail' : `/${route.pageType}`;
			url.hash = `#/${gfLocale}/scripts/${route.scriptId}${suffix}`;
		}
		url.search = '';
		lastValidHash = url.hash;
		window.history.pushState({}, '', url);
	}

	function showHashInvalidWarning(): void {
		showSnackbar(t(lang, 'info.history_invalid_toast'), undefined, 5000);
	}

	// ─── Base64 decode ───────────────────────────────────────────────────
	function decodeBase64(str: string): string {
		if (!str) return '';
		try {
			const raw = atob(str);
			const bytes = new Uint8Array(raw.length);
			for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
			return new TextDecoder('utf-8').decode(bytes);
		} catch {
			return str;
		}
	}

	// ─── API config ──────────────────────────────────────────────────────
	const INFO_API = siteConfig.infoApi.primary;
	const FETCH_TIMEOUT_MS = 5000;
	const RETRY_DELAYS_MS = [600, 1500];

	async function fetchJson(url: string, signal: AbortSignal): Promise<Response> {
		const res = await fetch(url, {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)])
		});
		return res;
	}

	function isTransientError(e: unknown): boolean {
		const err = e as Error;
		const msg = err?.message || '';
		const name = err?.name || '';
		if (name === 'AbortError') return false;
		const isTimeout =
			name === 'TimeoutError' || msg.includes('timeout') || msg.includes('timed out');
		const isNetworkFail =
			name === 'TypeError' ||
			msg.includes('Failed to fetch') ||
			msg.includes('NetworkError') ||
			msg.includes('fetch failed');
		const isServerError = /HTTP 5\d\d/.test(msg);
		return isTimeout || isNetworkFail || isServerError;
	}

	async function withRetry<T>(fn: () => Promise<T>, signal: AbortSignal): Promise<T> {
		let attempt = 0;
		while (true) {
			try {
				return await fn();
			} catch (e) {
				if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
				if (!isTransientError(e) || attempt >= RETRY_DELAYS_MS.length) throw e;
				await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt++]));
				if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
			}
		}
	}

	// ─── Page state ──────────────────────────────────────────────────────
	let route = $state<RouteInfo | null>(null);
	let activeTab = $state<'info' | 'feedback'>('info');
	let loading = $state(true);
	let error = $state('');
	let placeholderMode = $state(false);
	let placeholderExample = $state('');

	// detail
	let scriptTitle = $state('');
	let scriptHeaderHtml = $state('');
	let scriptMetaHtml = $state('');
	let additionalInfoHtml = $state('');
	let installLink = $state('');
	let installPath = $derived(
		installLink ? installLink.replace('https://update.greasyfork.org/scripts/', '') : ''
	);

	// feedback
	let feedbackTitle = $state('');
	let feedbackListHtml = $state('');
	let feedbackPage = $state(1);
	let feedbackTotalPages = $state(1);
	let feedbackLoading = $state(false);

	// users
	interface GithubIdentity {
		name: string;
		url?: string;
	}
	interface UserScript {
		id: number;
		name?: string;
		description?: string;
		daily_installs?: number;
		total_installs?: number;
		good_ratings?: number;
		ok_ratings?: number;
		bad_ratings?: number;
		fan_score?: number;
		created_at?: string;
		code_updated_at?: string;
		code_url?: string;
		deleted?: boolean;
	}
	interface UserInfo {
		id: number;
		name?: string;
		created_at?: string;
		bio?: string;
		github_identities?: GithubIdentity[];
		scripts?: UserScript[];
	}
	let userData = $state<UserInfo | null>(null);
	/** 作者脚本列表：过滤已删除，补齐 ScriptCard 需要的必填字段（缺字段留空串 / null，不编造数值） */
	let userScripts = $derived(
		(userData?.scripts || [])
			.filter((s) => !s.deleted)
			.map((s) => ({
				id: s.id,
				name: s.name || '',
				description: s.description || '',
				daily_installs: s.daily_installs ?? null,
				total_installs: s.total_installs ?? null,
				good_ratings: s.good_ratings ?? null,
				ok_ratings: s.ok_ratings ?? null,
				bad_ratings: s.bad_ratings ?? null,
				fan_score: s.fan_score ?? null,
				created_at: s.created_at || '',
				code_updated_at: s.code_updated_at || '',
				code_url: s.code_url || ''
			}))
	);

	/**
	 * 作者维度汇总：只在「所有脚本都缺该字段」时返回 null。
	 * 缺字段的脚本不参与累加，但只要有一个脚本报了数，就说明这批数据是有值的。
	 */
	function sumKnown(
		scripts: UserScript[] | undefined,
		key: 'total_installs' | 'good_ratings' | 'ok_ratings' | 'bad_ratings'
	): number | null {
		let sum = 0;
		let seen = false;
		for (const s of scripts || []) {
			if (s.deleted) continue;
			const v = s[key];
			if (v == null) continue;
			sum += v;
			seen = true;
		}
		return seen ? sum : null;
	}

	// ─── Link processing ─────────────────────────────────────────────────
	function processAllLinks(container: HTMLElement | null, locale: string): void {
		if (!container) return;
		container.querySelectorAll('a[href]').forEach((a) => {
			if (a.hasAttribute('data-processed')) return;
			const href = a.getAttribute('href');
			if (!href) return;
			// Skip already absolute/external URLs and internal anchors
			if (
				href.startsWith('http://') ||
				href.startsWith('https://') ||
				href.startsWith('javascript:') ||
				href.startsWith('mailto:') ||
				href.startsWith('tel:') ||
				href.startsWith('#')
			)
				return;

			// User profile links → internal info page
			const userMatch = href.match(/\/users\/([^/?]+)/);
			if (userMatch) {
				a.setAttribute('href', `#/${locale}/users/${userMatch[1]}`);
				a.setAttribute('data-processed', 'true');
				return;
			}

			// By-site links → lookup page
			const siteMatch = href.match(/\/scripts\/by-site\/([^/?]+)/);
			if (siteMatch) {
				a.setAttribute('href', `/${lang}/lookup#?site=${siteMatch[1]}`);
				a.setAttribute('data-processed', 'true');
				return;
			}

			// Skip internal app links (e.g., /zh-hans/installing)
			if (/^\/(zh-hans|zh-hant|en|ja|zh-CN|zh-TW)\//.test(href)) return;

			// All other relative links → proxy
			const proxy = siteProxyUrl();
			a.setAttribute('href', proxy + (href.startsWith('/') ? href : '/' + href));
			a.setAttribute('data-processed', 'true');
			if (!a.hasAttribute('target')) a.setAttribute('target', '_blank');
		});
	}

	function processFeedbackLinks(container: HTMLElement, locale: string): void {
		const discussionList = container.querySelector('.script-discussion-list');
		const target = discussionList || container;
		target.querySelectorAll('a[href]').forEach((a) => {
			if (a.hasAttribute('data-processed')) return;
			const href = a.getAttribute('href');
			if (!href) return;
			if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('?')) return;

			// User profile links → internal info page
			const userMatch = href.match(/\/users\/([^/?]+)/);
			if (userMatch) {
				a.setAttribute('href', `#/${locale}/users/${userMatch[1]}`);
				a.setAttribute('data-processed', 'true');
				return;
			}

			// Discussion links and other relative paths → compatible mirror
			const proxy = siteProxyUrl();
			a.setAttribute('href', proxy + (href.startsWith('/') ? href : '/' + href));
			a.setAttribute('data-processed', 'true');
			if (!a.hasAttribute('target')) a.setAttribute('target', '_blank');
		});
	}

	function processLinks(node: HTMLElement, locale: string): { destroy(): void } {
		tick().then(() => {
			if (node.id === 'feedback-list' || node.classList.contains('if-gf-feedback')) {
				processFeedbackLinks(node, locale);
			}
			processAllLinks(node, locale);
		});
		return { destroy() {} };
	}

	// ─── Data loading ────────────────────────────────────────────────────
	async function loadContent(r: RouteInfo): Promise<void> {
		abortController?.abort();
		abortController = new AbortController();
		const signal = abortController.signal;
		loading = true;
		error = '';

		try {
			if (r.pageType === 'users') {
				await withRetry(() => loadUserPage(r, signal), signal);
			} else if (r.pageType === 'feedback') {
				await withRetry(() => loadFeedbackPage(r, signal), signal);
			} else if (r.pageType === 'redirect') {
				// 同上：局部 URL，改完立刻 replaceState
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				const url = new URL(window.location.href);
				url.hash = `#/${gfLocale}/scripts/${r.scriptId}/detail`;
				url.search = '';
				window.history.replaceState({}, '', url);
				lastValidHash = url.hash;
				await loadContent({ ...r, pageType: 'detail', fullPath: url.hash.substring(1) });
				return;
			} else {
				await withRetry(() => loadDetailPage(r, signal), signal);
			}
		} catch (e) {
			if ((e as Error).name !== 'AbortError') {
				const msg = (e as Error).message || '';
				error = isTransientError(e)
					? t(lang, 'info.error_502')
					: `${t(lang, 'info.generic_error')}: ${msg}`;
			}
		} finally {
			loading = false;
		}
	}

	/* ------------------------------------------------------------------
	 * XSS 说明（c1/c2/c3 为何可以直接 {@html}）
	 *
	 * c1/c2/c3 是 Greasy Fork 静态站下发的 HTML 原文（base64），本项目把它当作
	 * 镜像透传展示，这是「用户脚本详情页」的产品前提 —— 脚本作者写的说明本身就是
	 * 富文本，转义成纯文本会让页面失去意义。
	 *
	 * 已知风险：当前没有任何 HTML 消毒（无 DOMPurify 等依赖），若上游 API 被入侵或
	 * 传输链路被劫持，注入的 <script> / onerror 会在本站执行。
	 * use:processLinks 只是重写站内链接与 target，不会消毒。
	 *
	 * 正确修法是在 {@html} 之前接一层白名单消毒器（DOMPurify / isomorphic-dompurify）。
	 * 该方案需要新增依赖，未纳入本次改动 —— 不要在此处改用正则剥标签，正则消毒比不消毒更危险。
	 * ------------------------------------------------------------------ */
	async function loadDetailPage(r: RouteInfo, signal: AbortSignal): Promise<void> {
		activeTab = 'info';
		const url = `${INFO_API}/${gfLocale}/scripts/${r.scriptId}/detail.json`;
		const res = await fetchJson(url, signal);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json = await res.json();
		scriptTitle = json.title || '';
		scriptHeaderHtml = decodeBase64(json.c1);
		scriptMetaHtml = decodeBase64(json.c2);
		additionalInfoHtml = decodeBase64(json.c3);
		installLink = json.install || '';
		document.title = scriptTitle ? `${scriptTitle} - ZGF` : `Script Info - ZGF`;
	}

	async function loadFeedbackPage(r: RouteInfo, signal: AbortSignal, page = 1): Promise<void> {
		activeTab = 'feedback';
		const url = `${INFO_API}/${gfLocale}/scripts/${r.scriptId}/feedback.json?page=${page}`;
		const res = await fetchJson(url, signal);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json = await res.json();
		feedbackTitle = json.title || '';
		feedbackPage = json.page || 1;
		feedbackTotalPages = json.totalPages || 1;
		feedbackListHtml =
			decodeBase64(json.c1) ||
			`<p style="text-align:center;color:var(--md-sys-color-on-surface-variant);padding:40px">${t(lang, 'info.no_feedback')}</p>`;
		document.title = feedbackTitle ? `${feedbackTitle} - ZGF` : `Feedback - ZGF`;
	}

	async function goToFeedbackPage(page: number): Promise<void> {
		const target = route;
		if (!target || page < 1 || page > feedbackTotalPages || feedbackLoading) return;
		feedbackLoading = true;
		try {
			abortController?.abort();
			abortController = new AbortController();
			const signal = abortController.signal;
			await withRetry(() => loadFeedbackPage(target, signal, page), signal);
			document.getElementById('feedback-list')?.scrollIntoView({ behavior: 'smooth' });
		} catch (e) {
			if ((e as Error).name !== 'AbortError') {
				const msg = (e as Error).message || '';
				error = isTransientError(e)
					? t(lang, 'info.error_502')
					: `${t(lang, 'info.generic_error')}: ${msg}`;
			}
		} finally {
			feedbackLoading = false;
		}
	}

	async function loadUserPage(r: RouteInfo, signal: AbortSignal): Promise<void> {
		const url = `${INFO_API}/${gfLocale}/users/${r.userId}.json`;
		const res = await fetchJson(url, signal);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json = await res.json();
		userData = json.user && typeof json.user === 'object' && json.user.name ? json.user : json;
		const name = userData?.name;
		document.title = name ? `${name} - ZGF` : `Script Info - ZGF`;
	}

	// ─── Lifecycle ──────────────────────────────────────────────────────
	let debounceTimer: ReturnType<typeof setTimeout>;

	onMount(() => {
		if (window.location.hash === '#google_vignette') return;

		const onHashChange = () => {
			const hash = window.location.hash;
			if (hash === '#google_vignette') return;
			if (isHashValid(hash)) lastValidHash = hash;
			// 哈希变化（脚本名 / 用户链接等内部跳转）时重载内容
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(initPage, 100);
		};
		window.addEventListener('hashchange', onHashChange);

		const onPop = () => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				if (window.location.hash === '#google_vignette') return;
				initPage();
			}, 100);
		};
		window.addEventListener('popstate', onPop);

		document.addEventListener('visibilitychange', () => {
			if (document.hidden && abortController) abortController.abort();
		});

		const observer = new MutationObserver((mutations) => {
			for (const m of mutations) {
				if (m.type === 'childList') {
					m.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE) {
							const el = node as HTMLElement;
							if (el.tagName === 'A') processAllLinks(el.parentElement, gfLocale);
							else processAllLinks(el, gfLocale);
						}
					});
				}
				if (
					m.type === 'attributes' &&
					m.attributeName === 'href' &&
					m.target.nodeType === Node.ELEMENT_NODE
				) {
					const el = m.target as HTMLElement;
					if (el.tagName === 'A') {
						el.removeAttribute('data-processed');
						processAllLinks(el.parentElement, gfLocale);
					}
				}
			}
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['href']
		});

		initPage();

		return () => {
			window.removeEventListener('hashchange', onHashChange);
			window.removeEventListener('popstate', onPop);
			observer.disconnect();
		};
	});

	function initPage(): void {
		const r = getRoute();
		if (!r) {
			initialParamChecked = true;
			loading = false;
			error = '';
			placeholderExample = t(lang, 'info.placeholder_example').replace('{locale}', gfLocale);
			placeholderMode = true;
			return;
		}

		placeholderMode = false;
		if (!initialParamChecked) {
			if (!isHashValid(window.location.hash) && isHashValid(lastValidHash)) {
				showHashInvalidWarning();
				if (!document.title.startsWith('[')) {
					document.title = `${t(lang, 'info.history_invalid_title')} ${document.title}`;
				}
			}
			initialParamChecked = true;
		}

		route = r;
		loadContent(r);
	}

	function switchTab(tab: 'info' | 'feedback'): void {
		if (!route) return;
		const newRoute = {
			...route,
			pageType: tab === 'info' ? ('detail' as const) : ('feedback' as const)
		};
		setHashRoute(newRoute);
		loadContent(newRoute);
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

<section class="info-page-root">
	<div class="info-container">
		{#if loading}
			<div class="ui-card if-center-box" aria-busy="true">
				<span class="if-spinner"><Icon name="refresh" size={40} /></span>
				<p class="if-center-text">{t(lang, 'info.loading')}</p>
			</div>
		{:else if placeholderMode}
			<div class="ui-card if-placeholder-box">
				<span class="ui-badge ui-badge--primary">{t(lang, 'info.placeholder_badge')}</span>
				<h1 class="if-ph-title">{t(lang, 'info.placeholder_title')}</h1>
				<p class="if-ph-desc">{t(lang, 'info.placeholder_desc')}</p>

				<div class="if-ph-example">
					<h2 class="if-ph-ex-head">{t(lang, 'info.placeholder_example_head')}</h2>
					<code class="if-ph-code">{placeholderExample}</code>
					<p class="if-ph-hint">
						<Icon name="info" size={16} />
						<span>{t(lang, 'info.placeholder_desc')}</span>
					</p>
				</div>
			</div>
		{:else if error}
			<div class="ui-card if-center-box">
				<span class="if-error-icon"><Icon name="alert" size={40} /></span>
				<h2 class="if-center-title">{t(lang, 'info.error')}</h2>
				<p class="if-center-text">{error}</p>
				<button
					class="ui-btn ui-btn--filled"
					onclick={() => {
						error = '';
						if (route) loadContent(route);
						else initPage();
					}}
				>
					<Icon name="refresh" size={18} />
					{t(lang, 'info.retry')}
				</button>
			</div>
		{:else if route?.pageType === 'users' && userData}
			<article class="ui-card if-user-card">
				<header class="if-user-header">
					<h1 class="if-user-name">{userData.name || t(lang, 'info.unknown_user')}</h1>
					<StatBar
						{lang}
						totalInstalls={sumKnown(userData.scripts, 'total_installs')}
						goodRatings={sumKnown(userData.scripts, 'good_ratings')}
						okRatings={sumKnown(userData.scripts, 'ok_ratings')}
						badRatings={sumKnown(userData.scripts, 'bad_ratings')}
					/>
				</header>

				{#if userData.bio}
					<p class="if-user-bio">{userData.bio}</p>
				{/if}

				{#if userData.github_identities?.length}
					<p class="if-user-github">
						<span class="if-user-github__label">GitHub:</span>
						{#each userData.github_identities as gh, i (gh.name + i)}
							{#if gh.url}
								<a href={gh.url} target="_blank" rel="noopener noreferrer">{gh.name}</a>
							{:else}
								<span>{gh.name}</span>
							{/if}
							{#if i < userData.github_identities.length - 1}<span>, </span>{/if}
						{/each}
					</p>
				{/if}

				<h2 class="if-section-title">{t(lang, 'info.scripts')}</h2>

				{#if userScripts.length > 0}
					<ul class="if-script-list">
						{#each userScripts as script (script.id)}
							{@const dl = script.code_url
								? `/${lang}/l#/${script.code_url.replace('https://update.greasyfork.org/scripts/', '')}`
								: null}
							<li>
								<ScriptCard {lang} {script} variant="list" showInstall={!!dl} sites={[]} />
							</li>
						{/each}
					</ul>
				{:else}
					<p class="if-no-content">{t(lang, 'info.no_scripts')}</p>
				{/if}
			</article>
		{:else if route}
			<div class="if-notice-bar">
				<span>{t(lang, 'info.notice')}</span>
				<a
					id="source-link"
					class="if-source-link"
					href="https://greasyfork.org{route.fullPath.replace(/\/detail$/, '')}"
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
					class:is-active={activeTab === 'info'}
					role="tab"
					aria-selected={activeTab === 'info'}
					onclick={() => switchTab('info')}
				>
					{t(lang, 'info.info_tab')}
				</button>
				<button
					class="if-tab"
					class:is-active={activeTab === 'feedback'}
					role="tab"
					aria-selected={activeTab === 'feedback'}
					onclick={() => switchTab('feedback')}
				>
					{t(lang, 'info.feedback_tab')}
				</button>
				<a
					class="if-tab"
					href="{siteProxyUrl()}{route.fullPath.replace(/\/detail$/, '')}"
					target="_blank"
					rel="noopener noreferrer"
				>
					{t(lang, 'info.proxy_tab')}
					<Icon name="external" size={14} />
				</a>
			</div>

			{#if activeTab === 'info'}
				<article class="ui-card if-script-card">
					<!-- eslint-disable svelte/no-at-html-tags -- 远程 Greasy Fork API 原文，未经消毒，XSS 风险见文末说明 -->
					{#if scriptHeaderHtml}
						<div
							class="if-content-area if-gf-header"
							id="script-header"
							use:processLinks={gfLocale}
						>
							{@html scriptHeaderHtml}
						</div>
					{:else if scriptTitle}
						<h1 class="if-script-page-title">{scriptTitle}</h1>
					{/if}

					{#if installPath}
						<div class="if-install-row">
							<InstallButton
								{lang}
								installHref={`/${lang}/l#/${installPath}`}
								sourceUrl={`https://greasyfork.org${route.fullPath.replace(/\/detail$/, '')}`}
								scriptName={scriptTitle}
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
							{#if installLink}
								<details class="if-install-details">
									<summary>{t(lang, 'info.install_details')}</summary>
									<code>{installLink}</code>
								</details>
							{/if}
						</div>
					{/if}

					{#if scriptMetaHtml}
						<div class="if-content-area if-gf-meta" id="script-meta" use:processLinks={gfLocale}>
							{@html scriptMetaHtml}
						</div>
					{/if}

					{#if additionalInfoHtml}
						<div
							class="if-content-area if-gf-content"
							id="additional-info"
							use:processLinks={gfLocale}
						>
							{@html additionalInfoHtml}
						</div>
					{/if}

					{#if !scriptHeaderHtml && !scriptMetaHtml && !additionalInfoHtml}
						<p class="if-no-content">{t(lang, 'info.no_description')}</p>
					{/if}
				</article>
			{:else}
				<div class="ui-card if-script-card">
					{#if feedbackListHtml}
						<div
							class="if-content-area if-gf-feedback"
							id="feedback-list"
							use:processLinks={gfLocale}
						>
							{@html feedbackListHtml}
						</div>
						{#if feedbackTotalPages > 1}
							<nav class="if-pagination">
								<button
									class="ui-btn ui-btn--outlined"
									disabled={feedbackPage === 1 || feedbackLoading}
									onclick={() => goToFeedbackPage(1)}
								>
									{t(lang, 'lookup.pagination.first')}
								</button>
								<button
									class="ui-btn ui-btn--outlined"
									disabled={feedbackPage === 1 || feedbackLoading}
									onclick={() => goToFeedbackPage(feedbackPage - 1)}
								>
									{t(lang, 'lookup.pagination.prev')}
								</button>
								<span class="if-page-indicator">{feedbackPage} / {feedbackTotalPages}</span>
								<button
									class="ui-btn ui-btn--outlined"
									disabled={feedbackPage === feedbackTotalPages || feedbackLoading}
									onclick={() => goToFeedbackPage(feedbackPage + 1)}
								>
									{t(lang, 'lookup.pagination.next')}
								</button>
								{#if feedbackLoading}
									<span class="if-spinner-sm"><Icon name="refresh" size={18} /></span>
								{/if}
							</nav>
						{/if}
					{/if}
				</div>
			{/if}
			<!-- eslint-enable svelte/no-at-html-tags -->

			<div class="if-ad"><Ad type="fluid" /></div>
		{/if}

		{#if route?.pageType !== 'users' && !placeholderMode}
			<div class="if-ad"><Ad type="auto" /></div>
		{/if}

		<p class="if-perm-notice">
			<Icon name="info" size={16} />
			<span>{t(lang, 'info.loading_notice')}</span>
		</p>
	</div>

	<!-- 移动端吸底安装条 -->
	{#if installPath && route?.pageType !== 'users'}
		<div class="if-install-bar">
			<InstallButton
				{lang}
				installHref={`/${lang}/l#/${installPath}`}
				sourceUrl={`https://greasyfork.org${route?.fullPath.replace(/\/detail$/, '') ?? ''}`}
				scriptName={scriptTitle}
				size="lg"
			/>
		</div>
	{/if}
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

	/* ─── Loading / Error / Placeholder ─────────────────────────────── */
	.if-center-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 56px 24px;
		text-align: center;
	}
	.if-center-title {
		margin: 0;
		font-size: var(--md-sys-typescale-title-medium-size);
		font-weight: 600;
	}
	.if-center-text {
		margin: 0;
		max-width: 52ch;
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.7;
		color: var(--md-sys-color-on-surface-variant);
	}
	.if-spinner,
	.if-spinner-sm {
		display: inline-flex;
		color: var(--md-sys-color-primary);
		animation: if-spin 1.1s linear infinite;
	}
	@keyframes if-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.if-spinner,
		.if-spinner-sm {
			animation: none;
		}
	}
	.if-error-icon {
		color: var(--md-sys-color-error);
	}

	.if-placeholder-box {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
		padding: 28px;
	}
	.if-ph-title {
		margin: 0;
		font-size: var(--md-sys-typescale-headline-small-size);
		font-weight: 600;
	}
	.if-ph-desc {
		margin: 0;
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.7;
		color: var(--md-sys-color-on-surface-variant);
	}
	.if-ph-example {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
		margin-top: 8px;
		padding: 16px;
		background: var(--md-sys-color-surface-container-low);
		border-radius: var(--md-sys-shape-corner-medium);
	}
	.if-ph-ex-head {
		margin: 0;
		font-size: var(--md-sys-typescale-title-small-size);
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}
	.if-ph-code {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: var(--md-sys-typescale-body-small-size);
		word-break: break-all;
		color: var(--md-sys-color-on-surface);
	}
	.if-ph-hint {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin: 0;
		font-size: var(--md-sys-typescale-body-small-size);
		line-height: 1.6;
		color: var(--md-sys-color-on-surface-variant);
	}
	.if-ph-hint :global(svg) {
		margin-top: 2px;
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
		border-radius: var(--md-sys-shape-corner-small);
	}

	/* ─── Script detail ─────────────────────────────────────────────── */
	.if-script-card {
		padding: 24px;
		background: var(--md-sys-color-surface);
	}
	.if-script-page-title {
		margin: 0 0 12px;
		font-size: var(--md-sys-typescale-headline-small-size);
		font-weight: 600;
		line-height: 1.35;
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
		.if-user-card,
		.if-placeholder-box {
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
		.info-container {
			padding-bottom: 8px;
		}
	}
</style>
