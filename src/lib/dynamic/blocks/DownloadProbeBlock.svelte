<script lang="ts">
	/**
	 * 区块 download-probe · probe + list（视图）
	 *
	 * 冷加载：构建期写出标题、状态文案、进度条、固定数量的节点行与提示语。
	 * 水合后逐个探测节点，只覆盖节点延迟、状态图标与进度条宽度，结构不变。
	 */
	import { untrack } from 'svelte';
	import { siteConfig } from '$config';
	import { t, type Lang } from '$i18n';
	import Ad from '$components/Ad.svelte';
	import Icon from '$components/Icon.svelte';
	import { DOWNLOAD_DEFAULTS } from '$lib/content-defaults';
	import type { IconName } from '$lib/icons';
	import { createDownloadProbe, DOWNLOAD_BLOCK_ID } from './download.svelte';

	let { lang, showAds = false }: { lang: Lang; showAds?: boolean } = $props();

	const probe = $derived(createDownloadProbe(lang));

	const busy = $derived(probe.stage === 'ip' || probe.stage === 'testing');
	const done = $derived(probe.stage === 'success' || probe.stage === 'fallback');
	const icon = $derived<IconName>(
		probe.stage === 'no-path' ? 'link' : done ? 'check-circle' : busy ? 'refresh' : 'gauge'
	);
	const examplePath = $derived(
		siteConfig.download.useQueryString
			? '?path=example/your-script.user.js'
			: '#/example/your-script.user.js'
	);

	// 水合后才开跑；prerender / SSR 不执行 effect
	$effect(() => {
		const current = probe;
		untrack(() => current.start());
	});
</script>

<svelte:head>
	<title>{t(lang, 'download.title')} - ZGF</title>
	<meta name="description" content={t(lang, 'download.description')} />
</svelte:head>

<section class="download-page">
	<div class="dl-grid">
		<div class="dl-main">
			<div
				class="md3-card"
				id="download-app"
				data-block={DOWNLOAD_BLOCK_ID}
				data-state={probe.stage}
			>
				<div class="dl-icon">
					<span class="dl-icon__glyph" class:dl-spin={busy} class:ok={done}>
						<Icon name={icon} size={64} />
					</span>
				</div>

				<h1>{probe.title}</h1>
				<p class="dl-desc">{probe.status}</p>

				<div class="dl-url" hidden={!probe.scriptPath}>{probe.scriptPath}</div>

				<div class="dl-st" hidden={probe.stage === 'no-path'}>
					<div class="dl-st-t">
						{t(lang, 'download.node_title', { n: String(probe.nodes.length) })}
					</div>
					{#each probe.nodes as row (row.domain)}
						<div class="dl-st-i" class:ok={row.latency !== null}>
							<Icon name={row.latency !== null ? 'check-circle' : 'clock'} size={18} />
							{probe.nodeLabel(row)}
							<span class="lat">
								{row.latency !== null
									? `${row.latency.toFixed(0)}ms`
									: t(lang, 'download.node_pending')}
							</span>
						</div>
					{/each}
				</div>

				<div class="dl-tip" hidden={!probe.cacheHit}>
					{t(lang, 'download.cache_days', { days: String(siteConfig.download.cacheDays) })}
				</div>

				<div class="dl-progress-bar">
					<div class="dl-progress-fill" style="width:{probe.progress}%"></div>
				</div>

				<div class="dl-badge" hidden={!done || probe.cacheHit || probe.bestLatency <= 0}>
					<Icon name="gauge" size={18} />
					{t(lang, 'download.lowest_latency', { ms: probe.bestLatency.toFixed(0) })}
				</div>

				<div class="dl-url" hidden={!probe.finalUrl}>{probe.finalUrl}</div>

				<a
					class="dl-btn"
					href={probe.finalUrl || undefined}
					hidden={!probe.finalUrl}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Icon name="external" size={18} />
					{t(lang, 'download.manual')}
				</a>

				<div class="dl-tip" hidden={!done}>{t(lang, 'download.reload_tip')}</div>

				<div class="dl-tip" hidden={probe.stage !== 'no-path'}>
					{t(lang, 'download.no_path_example')}
					<code>{examplePath}</code>
					<a href="/{lang}/l#/amidist/example.user.js" class="dl-example-link" rel="nofollow"
						>#/.../example.user.js</a
					>
				</div>

				<div class="dl-back" hidden={probe.stage !== 'no-path'}>
					<a href="/{lang}" class="md3-outlined-button">{t(lang, 'download.back_home')}</a>
				</div>
			</div>
		</div>

		{#if showAds}
			<aside class="dl-side">
				<!--
					桌面：300×600 竖版单元；
					窄屏侧栏塌成单列，固定宽竖版会报 availableWidth=0（旧实现是直接 display:none
					→ 留下一个 250px 空玻璃框、完全不赚），这里改成全宽横版顶上。
					两者互斥显示，被隐藏的那个不会发起投放（Ad 的"结构性隐藏不投"）。
				-->
				<div class="dl-ad-box dl-ad-box--wide"><Ad type="sidebar" /></div>
				<div class="dl-ad-box dl-ad-box--narrow"><Ad type="horizontal" /></div>
				<div class="dl-ad-box"><Ad type="auto" /></div>
			</aside>
		{/if}
	</div>

	<!-- 机读默认内容：脚本路径在 hash（#/xxx.user.js）里，静态 HTML 里必须有实质说明 -->
	<div class="sr-defaults" aria-hidden="true">
		<h2>{DOWNLOAD_DEFAULTS.title}</h2>
		<p>{DOWNLOAD_DEFAULTS.description}</p>
		<h3>中转节点</h3>
		<ul>
			{#each DOWNLOAD_DEFAULTS.nodeHosts as host (host)}
				<li>{host}</li>
			{/each}
		</ul>
		<h3>使用步骤</h3>
		<ol>
			{#each DOWNLOAD_DEFAULTS.steps as step, i (i)}
				<li>{step}</li>
			{/each}
		</ol>
		<p>示例安装路径：{DOWNLOAD_DEFAULTS.examplePath}</p>
	</div>
</section>

<style>
	.download-page {
		padding: 32px 0;
	}
	.dl-grid {
		display: grid;
		/* 340px：容纳 sidebar 槽位 300px 定宽 + 广告框 16px 内边距与 1px 边框 */
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: 24px;
		max-width: 1160px;
		margin: 0 auto;
		padding: 0 var(--md-sys-layout-side-margin, 16px);
		align-items: start;
	}
	.dl-main {
		min-width: 0;
	}
	.dl-main #download-app {
		max-width: 720px;
		margin: 0 auto;
	}
	/* 骨架与最终态同一套盒子：min-height 固定，阶段切换不改变卡片尺寸 */
	#download-app {
		min-height: 400px;
		padding: 48px 32px;
		text-align: center;
	}
	.dl-side {
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 96px;
	}
	.dl-ad-box:not(:has(:global(.ad--collapsed))) ~ .dl-ad-box:not(:has(:global(.ad--collapsed))) {
		margin-top: 16px;
	}
	.dl-ad-box {
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur));
		-webkit-backdrop-filter: blur(var(--glass-blur));
		border: 1px solid var(--glass-border);
		border-radius: var(--md-sys-shape-corner-medium);
		padding: 16px;
		box-shadow: var(--glass-shadow);
		min-height: 250px;
	}
	.dl-ad-box:has(:global(.ad--collapsed)) {
		min-height: 0;
		padding: 0;
		background: transparent;
		border-color: transparent;
		box-shadow: none;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}
	/* 窄屏专用槽位：桌面不显示，窄屏替换掉竖版 */
	.dl-ad-box--narrow {
		display: none;
		min-height: 0;
	}
	@media (max-width: 839px) {
		.dl-ad-box--wide {
			display: none;
		}
		.dl-ad-box--narrow {
			display: block;
		}
	}
	.dl-ad-box :global(ins.adsbygoogle) {
		max-width: 100%;
	}
	.dl-icon {
		margin-bottom: 24px;
	}
	/* 图标统一走 Icon.svelte（内联 SVG），不再依赖 Material Icons 字体 */
	.dl-icon__glyph {
		display: inline-flex;
		color: var(--md-sys-color-on-surface-variant);
	}
	.dl-icon__glyph.ok {
		color: var(--md-sys-color-primary);
	}
	.dl-icon__glyph.dl-spin {
		color: var(--md-sys-color-primary);
		animation: dl-spin 0.5s linear infinite;
	}
	@keyframes dl-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	#download-app h1 {
		font-family: var(--md-sys-typescale-headline-medium-font, inherit);
		font-size: 24px;
		font-weight: 600;
		margin: 0 0 12px;
		color: var(--md-sys-color-on-surface);
	}
	.dl-desc {
		font-size: 15px;
		color: var(--md-sys-color-on-surface-variant);
		margin: 0 0 20px;
	}
	.dl-url {
		font-size: 13px;
		color: var(--md-sys-color-outline);
		background: var(--md-sys-color-surface-container);
		padding: 8px 16px;
		border-radius: var(--md-sys-shape-corner-small);
		word-break: break-all;
		display: inline-block;
		max-width: 100%;
		margin-bottom: 16px;
	}
	.dl-tip {
		font-size: 13px;
		color: var(--md-sys-color-outline);
		background: var(--md-sys-color-surface-container);
		padding: 12px 16px;
		border-radius: var(--md-sys-shape-corner-small);
		margin-top: 12px;
		word-break: break-all;
	}
	.dl-tip code {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		word-break: break-all;
	}
	.dl-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		color: var(--md-sys-color-primary);
		background: var(--md-sys-color-primary-container);
		padding: 6px 16px;
		border-radius: var(--md-sys-shape-corner-full);
		margin: 0 0 16px;
	}
	.dl-badge :global(svg) {
		flex: none;
	}
	.dl-st {
		text-align: left;
		max-width: 500px;
		margin: 16px auto;
	}
	.dl-st-t {
		font-size: 13px;
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
		margin-bottom: 8px;
		padding: 0 4px;
	}
	.dl-st-i {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: var(--md-sys-shape-corner-small);
		font-size: 13px;
		color: var(--md-sys-color-on-surface-variant);
		background: var(--md-sys-color-surface-container);
		margin-bottom: 4px;
	}
	.dl-st-i :global(svg) {
		flex: none;
		color: var(--md-sys-color-outline);
	}
	.dl-st-i.ok :global(svg) {
		color: var(--md-sys-color-primary);
	}
	.dl-st-i .lat {
		margin-left: auto;
		font-variant-numeric: tabular-nums;
		color: var(--md-sys-color-outline);
		font-size: 12px;
	}
	.dl-st-i.ok .lat {
		color: var(--md-sys-color-primary);
	}
	.dl-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 24px;
		padding: 10px 24px;
		background: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
		border-radius: var(--md-sys-shape-corner-full);
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
	}
	.dl-btn:hover {
		filter: brightness(1.1);
	}
	.dl-btn :global(svg) {
		flex: none;
	}
	.dl-example-link {
		display: inline-block;
		margin-top: 6px;
		color: var(--md-sys-color-primary);
		font-family: var(--md-sys-code-font, monospace);
		font-size: 13px;
		word-break: break-all;
	}
	.dl-back {
		margin-top: 20px;
	}
	.dl-progress-bar {
		width: 100%;
		max-width: 400px;
		height: 4px;
		background: var(--md-sys-color-surface-container-highest);
		border-radius: 2px;
		margin: 16px auto 0;
		overflow: hidden;
	}
	.dl-progress-fill {
		height: 100%;
		background: var(--md-sys-color-primary);
		border-radius: 2px;
		transition: width 0.3s ease;
	}
	@media (max-width: 899px) {
		.dl-grid {
			grid-template-columns: 1fr;
		}
		.dl-side {
			position: static;
		}
	}
	@media (max-width: 600px) {
		#download-app {
			padding: 32px 16px;
		}
	}
</style>
