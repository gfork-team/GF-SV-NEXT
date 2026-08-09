<script lang="ts">
	import { page } from '$app/state';
	import { siteConfig } from '$lib/config';
	import Ad from '$components/Ad.svelte';

	$: lang = page.url.pathname.split('/')[1] || '';
	$: isZh = lang.startsWith('zh');
	$: homeHref = lang ? `/${lang}/` : '/';
	$: homeLabel = isZh ? '返回首页' : 'Go Home';
</script>

<svelte:head>
	<script async src="https://pagead2.googlesyndication-cn.com/pagead/js/adsbygoogle.js?client=ca-pub-3758644447684310" crossorigin="anonymous"></script>
	<title>404 - ZGF</title>
</svelte:head>

<div class="e404">
	<div class="e404-blob a"></div>
	<div class="e404-blob b"></div>
	<div class="e404-blob c"></div>

	<main class="e404-card">
		<h1 class="e404-code">404</h1>
		<p class="e404-title">Page Not Found</p>
		<p class="e404-desc">
			The page you are looking for does not exist or has been moved.
		</p>
		<a class="e404-btn" href={homeHref}>{homeLabel}</a>
	</main>

	<aside class="e404-extra">
		<Ad type="autorelaxed" />

		<p class="e404-sponsor">
			Sponsored by <a href={siteConfig.sponsor.url} target="_blank" rel="noopener noreferrer">{siteConfig.sponsor.name}</a>
		</p>
		<a href={siteConfig.sponsor.url} target="_blank" rel="noopener noreferrer">
			<img src={siteConfig.sponsor.image} alt="Sponsor" loading="lazy" width="400" height="60" class="e404-sponsor-img" />
		</a>

		<div class="e404-footer-ad">
			<Ad type="auto" />
		</div>
	</aside>
</div>

<style>
	.e404 {
		position: relative;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 20px;
		background: var(--md-sys-color-surface, #fafafa);
		color: var(--md-sys-color-on-surface, #1f1f1f);
		text-align: center;
	}
	/* 环境光斑：让玻璃卡片有可模糊的色彩 */
	.e404-blob {
		position: fixed;
		border-radius: 50%;
		filter: blur(70px);
		pointer-events: none;
		z-index: 0;
	}
	.e404-blob.a { width: 400px; height: 400px; top: -100px; right: -80px; background: #ddaacc; opacity: 0.5; }
	.e404-blob.b { width: 440px; height: 440px; bottom: -140px; left: -120px; background: #1d5fa8; opacity: 0.32; }
	.e404-blob.c { width: 260px; height: 260px; top: 42%; left: 56%; background: #eed3e5; opacity: 0.4; }

	.e404-card {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 480px;
		padding: 56px 32px 44px;
		border-radius: 24px;
		background: var(--glass-bg, rgba(255,255,255,0.6));
		border: 1px solid var(--glass-border, rgba(0,0,0,0.12));
		box-shadow: var(--glass-shadow, 0 8px 32px rgba(0,0,0,0.06));
		-webkit-backdrop-filter: blur(24px) saturate(180%);
		backdrop-filter: blur(24px) saturate(180%);
	}
	.e404-code {
		font-size: 88px;
		font-weight: 200;
		color: var(--md-sys-color-primary, #1d5fa8);
		margin: 0;
		line-height: 1;
		letter-spacing: 2px;
	}
	.e404-title {
		font-size: 24px;
		font-weight: 600;
		margin: 14px 0 8px;
		color: var(--md-sys-color-on-surface, #1f1f1f);
	}
	.e404-desc {
		font-size: 14px;
		color: var(--md-sys-color-on-surface-variant, #5f5f5f);
		margin: 0 0 32px;
		line-height: 1.7;
	}
	.e404-btn {
		display: inline-block;
		padding: 14px 44px;
		border-radius: 999px;
		background: linear-gradient(135deg, var(--md-sys-color-primary, #1d5fa8), var(--md-sys-color-primary-container, #6b93c2));
		color: #fff;
		font-size: 15px;
		font-weight: 600;
		text-decoration: none;
		box-shadow: 0 6px 16px rgba(29,95,168,0.30);
		transition: transform 160ms ease-out, box-shadow 160ms ease-out, filter 160ms ease-out;
	}
	.e404-btn:hover {
		transform: translateY(-2px);
		filter: brightness(1.06);
		box-shadow: 0 10px 24px rgba(29,95,168,0.35);
	}
	.e404-btn:active {
		transform: translateY(0) scale(0.96);
	}
	.e404-btn:focus-visible {
		outline: 2px solid var(--md-sys-color-primary, #1d5fa8);
		outline-offset: 3px;
	}

	.e404-extra {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 600px;
		margin-top: 36px;
	}
	.e404-sponsor {
		margin: 36px 0 8px;
		font-size: 14px;
		color: var(--md-sys-color-on-surface-variant, #5f5f5f);
	}
	.e404-sponsor a { color: var(--md-sys-color-primary, #1d5fa8); }
	.e404-sponsor-img { max-width: 100%; height: auto; }
	.e404-footer-ad { width: 100%; margin-top: 24px; }

	@media (max-width: 480px) {
		.e404-code { font-size: 64px; }
		.e404-card { padding: 44px 22px 36px; }
	}
</style>
