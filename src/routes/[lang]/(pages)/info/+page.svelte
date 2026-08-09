<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { t, type Lang, i18nConfig } from '$i18n';
	import { siteConfig, siteProxyUrl } from '$lib/config';
	import Ad from '$components/Ad.svelte';
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
	let hashInvalidWarningShown = $state(false);
	let initialParamChecked = $state(false);
	let abortController: AbortController | null = $state(null);

	function isHashValid(hash: string): boolean {
		return !!hash && hash !== '#' && hash !== '#google_vignette' && hash.startsWith('#') && hash.length > 1;
	}

	function parseHash(hashStr: string): RouteInfo | null {
		if (!hashStr) return null;
		const raw = hashStr.startsWith('#') ? hashStr.substring(1) : hashStr;
		if (!raw) return null;
		const path = raw.trim().replace(/^\/+|\/+$/g, '');
		if (!path) return null;

		const patterns: { regex: RegExp; pageType: RouteInfo['pageType'] }[] = [
			{ regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?\/detail$/, pageType: 'detail' },
			{ regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?\/feedback$/, pageType: 'feedback' },
			{ regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?\/(code|versions|stats)$/, pageType: 'redirect' },
			{ regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/scripts\/(\d+)(?:-[^/]+)?$/, pageType: 'redirect' },
			{ regex: /^([a-z]{2}(?:-[A-Za-z]{2,})?)\/users\/(.+)$/, pageType: 'users' }
		];

		for (const { regex, pageType } of patterns) {
			const m = path.match(regex);
			if (m) {
				const locale = (m[1] || '').toLowerCase();
				const normLocale =
					locale === 'zh-cn' || locale === 'zh-hans' ? 'zh-CN' :
					locale === 'zh-tw' || locale === 'zh-hant' ? 'zh-TW' : m[1];
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
			if (route) { lastValidHash = hash; return route; }
		}
		const fallback = lastValidHash;
		return isHashValid(fallback) ? parseHash(fallback) : null;
	}

	function setHashRoute(route: RouteInfo): void {
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
		if (hashInvalidWarningShown) return;
		hashInvalidWarningShown = true;
		const toast = document.createElement('div');
		toast.style.cssText = 'position:fixed;top:20px;right:20px;background:var(--md-sys-color-error-container);color:var(--md-sys-color-on-error-container);padding:16px 24px;border-radius:var(--md-sys-shape-corner-medium);box-shadow:var(--md-sys-elevation-3);z-index:10000;display:flex;align-items:center;gap:12px;font-size:14px;animation:if-toast-in 0.3s ease';
		toast.innerHTML = `<span class="material-icons" style="font-size:20px">warning</span><span>${t(lang, 'info.history_invalid_toast')}</span>`;
		const style = document.createElement('style');
		style.textContent = '@keyframes if-toast-in{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}';
		document.head.appendChild(style);
		document.body.appendChild(toast);
		setTimeout(() => {
			toast.style.animation = 'if-toast-in 0.3s ease reverse';
			setTimeout(() => toast.remove(), 300);
		}, 5000);
	}

	// ─── Base64 decode ───────────────────────────────────────────────────
	function decodeBase64(str: string): string {
		if (!str) return '';
		try {
			const raw = atob(str);
			const bytes = new Uint8Array(raw.length);
			for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
			return new TextDecoder('utf-8').decode(bytes);
		} catch { return str; }
	}

	// ─── API config ──────────────────────────────────────────────────────
	const INFO_API = siteConfig.infoApi.primary;
	const FETCH_TIMEOUT_MS = 5000;
	const BACKUP_SITE = 'https://gfork.zh-hk.eu.org';

	async function fetchJson(url: string, signal: AbortSignal): Promise<Response> {
		const res = await fetch(url, {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)])
		});
		return res;
	}

	function redirectToMirror(r: RouteInfo, redirectDelay = 1000): void {
		const mirrorUrl = BACKUP_SITE + r.fullPath.replace(/\/detail$/, '');
		error = t(lang, 'info.error_502').replace('{mirror}', mirrorUrl);
		setTimeout(() => { window.location.href = mirrorUrl; }, redirectDelay);
	}

	// ─── Page state ──────────────────────────────────────────────────────
	let route = $state<RouteInfo | null>(null);
	let activeTab = $state<'info' | 'feedback'>('info');
	let loading = $state(true);
	let error = $state('');

	// detail
	let scriptTitle = $state('');
	let scriptHeaderHtml = $state('');
	let scriptMetaHtml = $state('');
	let additionalInfoHtml = $state('');
	let installLink = $state('');
	let installPath = $derived(installLink ? installLink.replace('https://update.greasyfork.org/scripts/', '') : '');

	// feedback
	let feedbackTitle = $state('');
	let feedbackListHtml = $state('');
		let feedbackPage = $state(1);
		let feedbackTotalPages = $state(1);
		let feedbackLoading = $state(false);

	// users
	interface GithubIdentity { name: string; url?: string }
	interface UserScript { id: number; name?: string; description?: string; daily_installs?: number; total_installs?: number; good_ratings?: number; ok_ratings?: number; bad_ratings?: number; fan_score?: number; created_at?: string; code_updated_at?: string; code_url?: string; deleted?: boolean }
	interface UserInfo { id: number; name?: string; created_at?: string; bio?: string; github_identities?: GithubIdentity[]; scripts?: UserScript[] }
	let userData = $state<UserInfo | null>(null);

	// ─── Link processing ─────────────────────────────────────────────────
	function processAllLinks(container: HTMLElement | null, locale: string): void {
		if (!container) return;
		container.querySelectorAll('a[href]').forEach((a) => {
			if (a.hasAttribute('data-processed')) return;
			const href = a.getAttribute('href');
			if (!href) return;
			// Skip already absolute/external URLs and internal anchors
			if (href.startsWith('http://') || href.startsWith('https://') ||
				href.startsWith('javascript:') || href.startsWith('mailto:') ||
				href.startsWith('tel:') || href.startsWith('#')) return;

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
			if (href.startsWith('http://') || href.startsWith('https://') ||
				href.startsWith('?')) return;

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

	// ─── Formatting ──────────────────────────────────────────────────────
	function formatDateTime(raw: string): string {
		if (!raw) return '—';
		try {
			const localeTag = i18nConfig.langNames[lang] || 'zh-CN';
			return new Date(raw).toLocaleString(localeTag, {
				year: 'numeric', month: '2-digit', day: '2-digit',
				hour: '2-digit', minute: '2-digit', hour12: false
			});
		} catch { return raw; }
	}

	function escapeHtml(text: string): string {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
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
				await loadUserPage(r, signal);
			} else if (r.pageType === 'feedback') {
				await loadFeedbackPage(r, signal);
			} else if (r.pageType === 'redirect') {
				const url = new URL(window.location.href);
				url.hash = `#/${gfLocale}/scripts/${r.scriptId}/detail`;
				url.search = '';
				window.history.replaceState({}, '', url);
				lastValidHash = url.hash;
				await loadContent({ ...r, pageType: 'detail', fullPath: url.hash.substring(1) });
				return;
			} else {
				await loadDetailPage(r, signal);
			}
		} catch (e) {
			if ((e as Error).name !== 'AbortError') {
				const msg = (e as Error).message || '';
				const name = (e as Error).name || '';
				const isTimeout = name === 'TimeoutError' || msg.includes('timeout') || msg.includes('timed out');
				const isNetworkFail = name === 'TypeError' || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed');
				if ((isTimeout || isNetworkFail || msg.includes('502') || msg.includes('503') || msg.includes('504')) && route) {
					redirectToMirror(route);
				} else {
					error = `${t(lang, 'info.generic_error')}: ${msg}`;
				}
			}
		} finally {
			loading = false;
		}
	}

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
			feedbackListHtml = decodeBase64(json.c1) || `<p style="text-align:center;color:var(--md-sys-color-on-surface-variant);padding:40px">${t(lang, 'info.no_feedback')}</p>`;
		document.title = feedbackTitle ? `${feedbackTitle} - ZGF` : `Feedback - ZGF`;
	}

		async function goToFeedbackPage(page: number): Promise<void> {
			if (!route || page < 1 || page > feedbackTotalPages || feedbackLoading) return;
			feedbackLoading = true;
			try {
				abortController?.abort();
				abortController = new AbortController();
				await loadFeedbackPage(route, abortController.signal, page);
				document.getElementById('feedback-list')?.scrollIntoView({ behavior: 'smooth' });
			} catch (e) {
				if ((e as Error).name !== 'AbortError') {
					const msg = (e as Error).message || '';
					const name = (e as Error).name || '';
					const isTimeout = name === 'TimeoutError' || msg.includes('timeout') || msg.includes('timed out');
					const isNetworkFail = name === 'TypeError' || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed');
					if (isTimeout || isNetworkFail || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
						redirectToMirror(route);
					} else {
						error = `${t(lang, 'info.generic_error')}: ${msg}`;
					}
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
				if (m.type === 'attributes' && m.attributeName === 'href' && m.target.nodeType === Node.ELEMENT_NODE) {
					const el = m.target as HTMLElement;
					if (el.tagName === 'A') {
						el.removeAttribute('data-processed');
						processAllLinks(el.parentElement, gfLocale);
					}
				}
			}
		});
		observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });

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
			error = t(lang, 'info.invalid_hash');
			loading = false;
			return;
		}

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
		const newRoute = { ...route, pageType: tab === 'info' ? 'detail' as const : 'feedback' as const };
		setHashRoute(newRoute);
		loadContent(newRoute);
	}
</script>

<svelte:head>
	<title>Script Info - ZGF</title>
	<meta name="description" content="Detailed information about user scripts on Greasy Fork, including descriptions, ratings, install links and user feedback." />
	<meta name="keywords" content="script info, userscript details, greasyfork script, script page, user script, script feedback" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
</svelte:head>

<section class="info-page-root">
	<div class="width-constraint">
		{#if loading}
			<div class="md3-card if-loading-box">
				<span class="material-icons if-spinner">autorenew</span>
				<div class="if-loading-tip">
					{t(lang, 'info.loading')}
				</div>
			</div>
		{:else if error}
			<div class="md3-card if-error-box">
				<span class="material-icons" style="font-size:48px;color:var(--md-sys-color-error)">error_outline</span>
				<h3 class="title-large" style="margin:12px 0">{t(lang, 'info.error')}</h3>
				<p style="color:var(--md-sys-color-on-surface-variant);margin-bottom:20px">{error}</p>
				<button onclick={() => { error = ''; if (route) loadContent(route); else initPage(); }} class="md3-button">{t(lang, 'info.retry')}</button>
			</div>
		{:else if route?.pageType === 'users' && userData}
			<!-- User page -->
			<section class="md3-card if-user-card">
				<header class="if-user-header">
					<h1 class="headline-large">{escapeHtml(userData.name || t(lang, 'info.unknown_user'))}</h1>
					<dl class="if-user-stats">
						<dt>{t(lang, 'info.script_count')}</dt>
						<dd>{userData.scripts?.filter(s => !s.deleted).length || 0}</dd>
						<dt>{t(lang, 'info.total_installs')}</dt>
						<dd>{((userData.scripts?.reduce((sum, s) => sum + (s.total_installs || 0), 0) || 0)).toLocaleString()}</dd>
						<dt>{t(lang, 'info.good_ratings')}</dt>
						<dd class="if-good">{userData.scripts?.reduce((sum, s) => sum + (s.good_ratings || 0), 0) || 0}</dd>
						<dt>{t(lang, 'info.ok_ratings')}</dt>
						<dd class="if-ok">{userData.scripts?.reduce((sum, s) => sum + (s.ok_ratings || 0), 0) || 0}</dd>
						<dt>{t(lang, 'info.bad_ratings')}</dt>
						<dd class="if-bad">{userData.scripts?.reduce((sum, s) => sum + (s.bad_ratings || 0), 0) || 0}</dd>
						<dt>{t(lang, 'info.registered')}</dt>
						<dd>{formatDateTime(userData.created_at || '')}</dd>
					</dl>
				</header>

				{#if userData.bio}
					<div class="if-user-bio" style="color:var(--md-sys-color-on-surface-variant);font-size:14px;line-height:1.6;margin-bottom:16px;padding:12px 16px;background:var(--md-sys-color-surface-container-low);border-radius:var(--md-sys-shape-corner-small)">
						{escapeHtml(userData.bio)}
					</div>
				{/if}

				{#if userData.github_identities && userData.github_identities.length > 0}
					<div class="if-user-github" style="margin-bottom:16px;font-size:13px">
						<span style="color:var(--md-sys-color-on-surface-variant)">GitHub: </span>
						{#each userData.github_identities as gh, i}
							{#if gh.url}
								<a href={gh.url} target="_blank" rel="noopener noreferrer" style="color:var(--md-sys-color-primary);text-decoration:none">{gh.name}</a>
							{:else}
								<span style="color:var(--md-sys-color-on-surface-variant)">{gh.name}</span>
							{/if}
							{#if i < userData.github_identities.length - 1}, {/if}
						{/each}
					</div>
				{/if}

				<div>
					<h3 class="title-large" style="margin-bottom:16px">{t(lang, 'info.scripts')}</h3>
					{#if userData.scripts && userData.scripts.filter(s => !s.deleted).length > 0}
						<ol class="if-script-list">
							{#each userData.scripts.filter(s => !s.deleted) as script, i (script.id)}
								<li class="if-result-item" style="animation-delay: {Math.min(0.05 * i, 0.5)}s;">
									<article>
										<h2>
											<a class="if-script-link" href={`#/${route?.locale || i18nConfig.langNames[lang]}/scripts/${script.id}/detail`}>
												{script.name || t(lang, 'info.unnamed')}
											</a>
											<span class="if-badge-js">JS</span>
											<span class="if-sep">-</span>
											<span class="if-script-desc">{escapeHtml(script.description || t(lang, 'info.no_description'))}</span>
										</h2>
										<div class="if-script-meta">
											<dl class="if-stats">
												<dt>{t(lang, 'lookup.author')}</dt>
												<dd>{escapeHtml(userData.name || t(lang, 'info.unknown_author'))}</dd>
												<dt>{t(lang, 'lookup.daily_installs')}</dt>
												<dd>{script.daily_installs || 0}</dd>
												<dt>{t(lang, 'lookup.total_installs')}</dt>
												<dd>{script.total_installs || 0}</dd>
												<dt>{t(lang, 'lookup.ratings')}</dt>
												<dd>
													<span class="if-good">{script.good_ratings || 0}</span>
													<span class="if-ok">{script.ok_ratings || 0}</span>
													<span class="if-bad">{script.bad_ratings || 0}</span>
												</dd>
												<dt>{t(lang, 'lookup.created')}</dt>
												<dd>{formatDateTime(script.created_at || '')}</dd>
												<dt>{t(lang, 'lookup.updated')}</dt>
												<dd>{formatDateTime(script.code_updated_at || '')}</dd>
											</dl>
											<div style="margin-top:12px">
												{#if script.code_url}
													{@const dl = `/${lang}/l#/` + script.code_url.replace('https://update.greasyfork.org/scripts/', '')}
													<a href={dl} class="md3-button" target="_blank" rel="noopener noreferrer">{t(lang, 'info.install')}</a>
												{:else}
													<a href="/{lang}/installing" class="md3-button">{t(lang, 'info.install')}</a>
												{/if}
											</div>
										</div>
									</article>
								</li>
							{/each}
						</ol>
					{:else}
						<p class="if-no-content">{t(lang, 'info.no_scripts')}</p>
					{/if}
				</div>
			</section>
		{:else if route}
			<!-- Script page -->
			<section>
				<!-- Notice bar -->
				<div class="if-notice-bar">
					{t(lang, 'info.notice')}
					<a id="source-link" href="https://greasyfork.org{route.fullPath.replace(/\/detail$/, '')}" target="_blank" rel="noopener noreferrer" class="if-source-link">
						{t(lang, 'info.source_link')}
					</a>
				</div>

				<!-- Tabs -->
				<div class="md3-tabs">
					<button class="md3-tab" class:active={activeTab === 'info'} onclick={e => { e.preventDefault(); switchTab('info'); }}>
						{t(lang, 'info.info_tab')}
					</button>
					<button class="md3-tab" class:active={activeTab === 'feedback'} onclick={e => { e.preventDefault(); switchTab('feedback'); }}>
						{t(lang, 'info.feedback_tab')}
					</button>
					<a class="md3-tab" href="{siteProxyUrl()}{route.fullPath.replace(/\/detail$/, '')}" target="_blank" rel="noopener noreferrer">
						{t(lang, 'info.proxy_tab')}
					</a>
				</div>

				{#if activeTab === 'info'}
				<!-- Install row -->
				<div class="if-install-row">
					<a href="/{lang}/l#/{installPath}" class="md3-button" target="_blank" rel="noopener noreferrer">
						{t(lang, 'info.install')}
					</a>
					<a href="/{lang}/installing" class="if-help-link" title={t(lang, 'info.install_help')} rel="nofollow">?</a>
					{#if installLink}
						<details class="if-install-details">
							<summary>{t(lang, 'info.install_details')}</summary>
							<code>{installLink}</code>
						</details>
					{/if}
				</div>
			{/if}

				<!-- Info Tab — ads fill empty content spots -->
				{#if activeTab === 'info'}
					{#if scriptHeaderHtml}
						<div class="if-content-area if-gf-header" id="script-header" use:processLinks={gfLocale}>{@html scriptHeaderHtml}</div>
					{:else if scriptTitle}
						<h2 class="if-script-page-title">{scriptTitle}</h2>
					{/if}

					{#if scriptMetaHtml}
						<div class="if-content-area if-gf-meta" id="script-meta" use:processLinks={gfLocale}>{@html scriptMetaHtml}</div>
					{/if}

					{#if additionalInfoHtml}
						<div class="if-content-area if-gf-content" id="additional-info" use:processLinks={gfLocale}>{@html additionalInfoHtml}</div>
					{/if}

					<div style="text-align:center;padding:16px 0"><Ad type="fluid" /></div>

					{#if !scriptHeaderHtml && !scriptMetaHtml && !additionalInfoHtml}
						<div class="md3-card if-no-content">
							<p>{t(lang, 'info.no_description')}</p>
						</div>
					{/if}

					<div style="margin-top:16px"><Ad type="auto" /></div>
				{:else}
					<!-- Feedback Tab — ad fills empty spot -->
					{#if feedbackListHtml}
						<div class="if-content-area if-gf-feedback" id="feedback-list" use:processLinks={gfLocale}>{@html feedbackListHtml}</div>
					{#if feedbackTotalPages > 1}
						<nav class="if-pagination">
							<button class="md3-outlined-button if-page-btn" disabled={feedbackPage === 1} style="opacity:{feedbackPage === 1 ? '0.4' : '1'}" onclick={() => goToFeedbackPage(1)}>
								{t(lang, 'lookup.pagination.first')}
							</button>
							<button class="md3-outlined-button if-page-btn" disabled={feedbackPage === 1} style="opacity:{feedbackPage === 1 ? '0.4' : '1'}" onclick={() => goToFeedbackPage(feedbackPage - 1)}>
								{t(lang, 'lookup.pagination.prev')}
							</button>
							<span class="if-page-indicator">{feedbackPage} / {feedbackTotalPages}</span>
							<button class="md3-outlined-button if-page-btn" disabled={feedbackPage === feedbackTotalPages} style="opacity:{feedbackPage === feedbackTotalPages ? '0.4' : '1'}" onclick={() => goToFeedbackPage(feedbackPage + 1)}>
								{t(lang, 'lookup.pagination.next')}
							</button>
							{#if feedbackLoading}
								<span class="material-icons if-spinner-sm">autorenew</span>
							{/if}
						</nav>
					{/if}
					{/if}

					<div style="text-align:center;padding:16px 0"><Ad type="fluid" /></div>

					<div style="margin-top:16px"><Ad type="autorelaxed" /></div>
				{/if}
			</section>
		{/if}

		<div class="if-perm-notice">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;margin-top:1px"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></svg>
			<span>{t(lang, 'info.loading_notice')}</span>
		</div>
	</div>
</section>

<style>
	.info-page-root {
		background: transparent;
		min-height: 100vh;
		color: var(--md-sys-color-on-surface);
		padding: 24px 0;
	}

	/* ─── Loading / Error ─────────────────────────────── */
	.if-loading-box {
		display: flex; flex-direction: column; align-items: center; justify-content: center;
		padding: 60px 20px; min-height: 400px; text-align: center;
	}
	.if-spinner {
		font-size: 80px; animation: if-spin 0.5s linear infinite; display: inline-block;
		color: var(--md-sys-color-primary);
	}
	.if-loading-tip {
		text-align: center; line-height: 1.6; margin-top: 20px;
		color: var(--md-sys-color-on-surface-variant); max-width: 500px;
	}

	.if-error-box {
		text-align: center; padding: 40px;
		display: flex; flex-direction: column; align-items: center;
	}

	.if-no-content {
		text-align: center; color: var(--md-sys-color-on-surface-variant);
		padding: 40px;
	}

	/* ─── User page ───────────────────────────────────── */
	.if-user-card { margin-bottom: 16px; padding: 24px; background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)) saturate(180%); -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%); box-shadow: var(--glass-shadow); }
	.if-user-header { margin-bottom: 24px; }
	.if-user-header h1 { margin-bottom: 16px; }

	.if-user-stats {
		display: flex; flex-wrap: wrap; gap: 4px 16px;
		font-size: 14px; margin: 0;
	}
	.if-user-stats dt { color: var(--md-sys-color-on-surface-variant); }
	.if-user-stats dd { margin: 0 12px 0 4px; }

	.if-good { color: #4caf50; }
	.if-ok { color: #ff9800; margin: 0 4px; }
	.if-bad { color: var(--md-sys-color-error); }

	.if-script-list { list-style: none; padding: 0; margin: 0; }
	.if-result-item {
		border: 1px solid var(--glass-border);
		border-radius: var(--md-sys-shape-corner-medium);
		padding: 16px;
		margin-bottom: 12px;
		opacity: 0;
		animation: if-fadeIn 0.3s ease-out forwards;
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		box-shadow: var(--glass-shadow);
		transition: box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
	}
	.if-result-item:hover { box-shadow: var(--md-sys-elevation-1); }
	.if-result-item h2 {
		margin: 0 0 10px; font-size: 16px;
		display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;
	}
	.if-script-link { color: var(--md-sys-color-primary); text-decoration: none; font-weight: 600; }
	.if-script-link:hover { text-decoration: underline; }
	.if-badge-js { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); padding: 1px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; }
	.if-sep { color: var(--md-sys-color-outline-variant); }
	.if-script-desc { color: var(--md-sys-color-on-surface-variant); font-size: 14px; font-weight: normal; }
	.if-script-meta { margin-top: 8px; }
	.if-stats {
		display: flex; flex-wrap: wrap; gap: 4px 16px;
		font-size: 13px; margin: 0 0 10px; padding: 0;
	}
	.if-stats dt { color: var(--md-sys-color-on-surface-variant); }
	.if-stats dd { margin: 0 12px 0 4px; }

	/* ─── Script page chrome ──────────────────────────── */
	.if-notice-bar {
		padding: 10px 16px;
		background: var(--md-sys-color-surface-container-highest);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
		font-size: 13px;
		color: var(--md-sys-color-on-surface-variant);
		margin-bottom: 16px;
	}
	.if-source-link { color: var(--md-sys-color-primary); margin-left: 4px; }

	.if-install-row {
		display: flex; align-items: center; gap: 8px; margin: 12px 0 20px;
		flex-wrap: wrap;
	}
	.if-help-link {
		color: var(--md-sys-color-on-surface-variant);
		text-decoration: none; font-size: 18px; padding: 8px;
	}
	.if-install-details {
		font-size: 13px;
		color: var(--md-sys-color-on-surface-variant);
		margin-left: auto;
	}
	.if-install-details summary { cursor: pointer; }
	.if-install-details code {
		display: block; margin-top: 8px; padding: 8px;
		background: var(--md-sys-color-surface-container-highest);
		border-radius: var(--md-sys-shape-corner-small);
		word-break: break-all; font-size: 12px;
		color: var(--md-sys-color-on-surface);
		max-width: 600px;
	}

	.if-script-page-title {
		font-size: var(--md-sys-typescale-headline-medium);
		font-weight: 500;
		margin: 0 0 16px;
		color: var(--md-sys-color-on-surface);
	}

	/* ─── GF content containers ───────────────────────── */
	.if-content-area {
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		border: 1px solid var(--glass-border);
		border-radius: var(--md-sys-shape-corner-medium);
		padding: 24px;
		margin-bottom: 16px;
		box-shadow: var(--glass-shadow);
		overflow-x: auto;
	}

	/* ===================================================
	   Greasy Fork HTML fragment styles
	   These match the original GF look within our MD3 theme
	   =================================================== */

	/* ── Header block (c1) ─────────────────────────────── */
	.if-gf-header {
		font-size: 14px;
		line-height: 1.6;
	}

	.if-gf-header :global(h2) {
		font-size: var(--md-sys-typescale-headline-medium);
		font-weight: 500;
		margin: 0 0 8px;
		color: var(--md-sys-color-on-surface);
	}

	.if-gf-header :global(p.script-description) {
		color: var(--md-sys-color-on-surface-variant);
		margin: 0;
	}

	/* ── Meta block (c2) ─────────────────────────────── */
	.if-gf-meta :global(.script-meta-block) {
		font-size: 14px;
	}

	.if-gf-meta :global(.inline-script-stats) {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 8px 16px;
		align-items: baseline;
		margin: 0;
	}

	.if-gf-meta :global(.inline-script-stats dt) {
		color: var(--md-sys-color-on-surface-variant);
		font-weight: 500;
		font-size: 13px;
		white-space: nowrap;
	}

	.if-gf-meta :global(.inline-script-stats dd) {
		margin: 0;
		color: var(--md-sys-color-on-surface);
	}

	.if-gf-meta :global(.inline-script-stats a) {
		color: var(--md-sys-color-primary);
		text-decoration: none;
	}
	.if-gf-meta :global(.inline-script-stats a:hover) {
		text-decoration: underline;
	}

	/* Rating counts */
	.if-gf-meta :global(.good-rating-count) {
		color: #4caf50;
		font-weight: 600;
	}
	.if-gf-meta :global(.ok-rating-count) {
		color: #ff9800;
		margin: 0 6px;
		font-weight: 600;
	}
	.if-gf-meta :global(.bad-rating-count) {
		color: var(--md-sys-color-error);
		font-weight: 600;
	}

	/* Antifeatures */
	.if-gf-meta :global(.script-antifeatures) {
		color: var(--md-sys-color-error);
	}

	/* Applies-to site list */
	.if-gf-meta :global(.block-list) {
		list-style: none;
		padding: 0;
		margin: 4px 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 8px;
	}

	.if-gf-meta :global(.block-list li) {
		display: inline;
	}

	.if-gf-meta :global(.block-list a) {
		color: var(--md-sys-color-primary);
		text-decoration: none;
		font-size: 13px;
	}
	.if-gf-meta :global(.block-list a:hover) {
		text-decoration: underline;
	}

	.if-gf-meta :global(.expandable) {
		max-height: none;
	}

	/* ── User content / additional info (c3) ─────────── */
	.if-gf-content {
		font-size: 14px;
		line-height: 1.7;
		color: var(--md-sys-color-on-surface);
	}

	.if-gf-content :global(h3) {
		font-size: var(--md-sys-typescale-title-medium);
		font-weight: 500;
		margin: 24px 0 12px;
		color: var(--md-sys-color-on-surface);
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
		padding-bottom: 8px;
	}

	.if-gf-content :global(h3:first-child) {
		margin-top: 0;
	}

	.if-gf-content :global(p) {
		margin: 0 0 12px;
	}

	.if-gf-content :global(strong) {
		font-weight: 600;
	}

	.if-gf-content :global(a) {
		color: var(--md-sys-color-primary);
		text-decoration: none;
		word-break: break-all;
	}
	.if-gf-content :global(a:hover) {
		text-decoration: underline;
	}

	.if-gf-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--md-sys-shape-corner-small);
		margin: 12px 0;
		border: 1px solid var(--md-sys-color-outline-variant);
	}

	.if-gf-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 12px 0;
		font-size: 13px;
	}

	.if-gf-content :global(th) {
		background: var(--md-sys-color-surface-container-highest);
		color: var(--md-sys-color-on-surface);
		font-weight: 600;
		padding: 10px 14px;
		text-align: left;
		border-bottom: 2px solid var(--md-sys-color-outline-variant);
	}

	.if-gf-content :global(td) {
		padding: 10px 14px;
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
		vertical-align: top;
	}

	.if-gf-content :global(tr:hover td) {
		background: var(--md-sys-color-surface-container-low);
	}

	.if-gf-content :global(code) {
		background: var(--md-sys-color-surface-container-highest);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.9em;
		font-family: 'Consolas', 'Monaco', monospace;
	}

	.if-gf-content :global(pre) {
		background: var(--md-sys-color-surface-container-highest);
		padding: 16px;
		border-radius: var(--md-sys-shape-corner-small);
		overflow-x: auto;
		font-size: 13px;
		line-height: 1.5;
		margin: 12px 0;
	}

	.if-gf-content :global(blockquote) {
		border-left: 3px solid var(--md-sys-color-primary);
		padding: 8px 16px;
		margin: 12px 0;
		color: var(--md-sys-color-on-surface-variant);
		background: var(--md-sys-color-surface-container-low);
		border-radius: 0 var(--md-sys-shape-corner-small) var(--md-sys-shape-corner-small) 0;
	}

	.if-gf-content :global(ul), .if-gf-content :global(ol) {
		margin: 8px 0;
		padding-left: 24px;
	}

	.if-gf-content :global(li) {
		margin-bottom: 4px;
	}

	/* Hide non-functional GF elements */
	.if-gf-content :global(.install-link),
	.if-gf-content :global(.install-help-link),
	.if-gf-content :global(dialog),
	.if-gf-meta :global(dialog),
	.if-gf-header :global(dialog) {
		display: none !important;
	}

	/* ── Feedback list (c1 from feedback endpoint) ───── */
	.if-gf-feedback {
		font-size: 14px;
		line-height: 1.6;
	}

	.if-gf-feedback :global(.script-discussion-list) {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.if-gf-feedback :global(.discussion-list-container) {
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
	}

	.if-gf-feedback :global(.discussion-list-item) {
		padding: 16px 4px;
		transition: background var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
	}

	.if-gf-feedback :global(.discussion-list-item:hover) {
		background: var(--md-sys-color-surface-container-low);
	}

	.if-gf-feedback :global(.discussion-meta) {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 16px;
		margin-bottom: 6px;
		font-size: 13px;
	}

	.if-gf-feedback :global(.discussion-meta-item) {
		color: var(--md-sys-color-on-surface-variant);
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.if-gf-feedback :global(.discussion-title) {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		color: var(--md-sys-color-on-surface);
		text-decoration: none;
		font-size: 14px;
		line-height: 1.5;
		word-break: break-word;
	}

	.if-gf-feedback :global(.discussion-title:hover) {
		color: var(--md-sys-color-primary);
	}

	.if-gf-feedback :global(.rating-icon) {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		border-radius: var(--md-sys-shape-corner-full);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 600;
		color: #fff;
		margin-top: 2px;
		text-indent: -9999px;
		overflow: hidden;
	}

	.if-gf-feedback :global(.rating-icon-good) { background: #4caf50; }
	.if-gf-feedback :global(.rating-icon-ok)   { background: #ff9800; }
	.if-gf-feedback :global(.rating-icon-bad)  { background: var(--md-sys-color-error); }

	.if-gf-feedback :global(.discussion-snippet) {
		color: var(--md-sys-color-on-surface-variant);
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}

	.if-gf-feedback :global(.user-link) {
		color: var(--md-sys-color-primary);
		text-decoration: none;
		font-weight: 500;
	}

	.if-gf-feedback :global(.user-link:hover) {
		text-decoration: underline;
	}

	.if-gf-feedback :global(.badge-author) {
		background: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
		padding: 1px 8px;
		border-radius: var(--md-sys-shape-corner-full);
		font-size: 11px;
		font-weight: 600;
	}

	.if-gf-feedback :global(.discussion) {
		padding: 16px;
		border: 1px solid var(--glass-border);
		border-radius: var(--md-sys-shape-corner-small);
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
	}

	.if-gf-feedback :global(.discussion-header) {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
		font-size: 13px;
		color: var(--md-sys-color-on-surface-variant);
	}

	.if-gf-feedback :global(.discussion-rating) {
		font-weight: 600;
	}

	.if-gf-feedback :global(.good-rating-count) {
		color: #4caf50;
	}
	.if-gf-feedback :global(.ok-rating-count) {
		color: #ff9800;
		margin: 0 4px;
	}
	.if-gf-feedback :global(.bad-rating-count) {
		color: var(--md-sys-color-error);
	}

	.if-gf-feedback :global(a) {
		color: var(--md-sys-color-primary);
		text-decoration: none;
	}
	.if-gf-feedback :global(a:hover) {
		text-decoration: underline;
	}

	.if-gf-feedback :global(p) {
		margin: 0 0 8px;
	}

	.if-gf-feedback :global(code) {
		background: var(--md-sys-color-surface-container-highest);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.9em;
	}

	.if-gf-feedback :global(pre) {
		background: var(--md-sys-color-surface-container-highest);
		padding: 12px;
		border-radius: var(--md-sys-shape-corner-small);
		overflow-x: auto;
		font-size: 13px;
		margin: 8px 0;
	}

	/* ── Responsive ───────────────────────────────────── */
	@media (max-width: 600px) {
		.if-gf-meta :global(.inline-script-stats) {
			grid-template-columns: 1fr;
			gap: 2px 0;
		}
		.if-gf-meta :global(.inline-script-stats dt) {
			margin-top: 8px;
		}

		.if-install-details {
			margin-left: 0;
			width: 100%;
		}
		.if-install-details code {
			max-width: 100%;
		}
	}

	@keyframes if-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
	@keyframes if-fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

	.if-perm-notice {
		display: flex; align-items: flex-start; gap: 8px;
		margin-top: 24px; padding: 12px 16px;
		background: var(--md-sys-color-surface-container-low);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-sys-shape-corner-small);
		font-size: 13px; line-height: 1.5;
		color: var(--md-sys-color-on-surface-variant);
	}

	/* ── Pagination ─────────────────────────────────── */
	.if-pagination {
		display: flex; align-items: center; justify-content: center; gap: 12px;
		margin-top: 16px; padding: 8px 0;
	}
	.if-page-btn {
		min-width: auto; padding: 6px 14px; font-size: 13px;
	}
	.if-page-indicator {
		font-size: 14px; font-weight: 500;
		color: var(--md-sys-color-on-surface);
	}
	.if-spinner-sm {
		font-size: 28px; animation: if-spin 0.5s linear infinite;
		color: var(--md-sys-color-primary);
	}
</style>
