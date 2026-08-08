<script lang="ts">
	import { siteConfig } from '$lib/config';
	import Ad from '$components/Ad.svelte';
</script>

<svelte:head>
	<script async src="https://pagead2.googlesyndication-cn.com/pagead/js/adsbygoogle.js?client=ca-pub-3758644447684310" crossorigin="anonymous"></script>
	<title>404 - ZGF</title>
</svelte:head>

<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:40px 20px;background:var(--md-sys-color-surface, #fff8f6);color:var(--md-sys-color-on-surface, #201a17);text-align:center">
	<h1 style="font-size:72px;font-weight:200;color:var(--md-sys-color-primary, #7f3300);margin:0">404</h1>
	<p style="font-size:var(--md-sys-typescale-headline-medium);color:var(--md-sys-color-on-surface-variant, #52443c)">Page Not Found</p>

	<div style="width:100%;max-width:600px">
		<!-- Ad: autorelaxed -->
		<Ad type="autorelaxed" />
	</div>

	<a href="/" style="display:inline-block;margin-top:24px;padding:10px 24px;background:var(--md-sys-color-primary, #7f3300);color:var(--md-sys-color-on-primary, #fff);text-decoration:none;border-radius:var(--md-sys-shape-corner-full, 20px);font-size:14px">
		Go Home
	</a>

	<!-- Sponsor -->
	<p style="margin-top:40px;font-size:14px;color:var(--md-sys-color-on-surface-variant, #52443c)">
		Sponsored by <a href={siteConfig.sponsor.url} target="_blank" rel="noopener noreferrer" style="color:var(--md-sys-color-primary, #7f3300)">{siteConfig.sponsor.name}</a>
	</p>
	<a href={siteConfig.sponsor.url} target="_blank" rel="noopener noreferrer">
		<img src={siteConfig.sponsor.image} alt="Sponsor" loading="lazy" width="400" height="60" style="max-width:100%;height:auto" />
	</a>

	<!-- Footer Ad -->
	<div style="width:100%;max-width:600px;margin-top:24px">
		<Ad type="auto" />
	</div>
</div>