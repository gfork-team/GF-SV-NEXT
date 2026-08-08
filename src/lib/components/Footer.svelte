<script lang="ts">
	import { t } from '$lib/i18n';
	import { getCurrentYear } from '$lib/utils';
	import { i18nConfig } from '$lib/i18n';
	import type { Lang } from '$lib/i18n';
	import { siteConfig } from '$lib/config';
	import Ad from '$components/Ad.svelte';
	import { goto } from '$app/navigation';

	let { lang }: { lang: Lang } = $props();
	const year = getCurrentYear();

	const footerLinks = [
		{ href: '/', key: 'nav.home' },
		{ href: '/search', key: 'nav.search' },
		{ href: '/download', key: 'nav.download' },
		{ href: '/lookup', key: 'nav.lookup' },
		{ href: '/help', key: 'nav.help' },
		{ href: '/about', key: 'nav.about' }
	];

	function switchLanguage(e: Event) {
		const select = e.target as HTMLSelectElement;
		const selectedOption = select.options[select.selectedIndex];
		const url = selectedOption.getAttribute('data-language-url');
		if (url) {
			goto(url);
		}
	}
</script>

<footer class="m3-footer">
	<div class="m3-footer-inner">

		<!-- Brand + Quick Links -->
		<div class="m3-footer-top">
			<a class="m3-footer-brand" href="/{lang}" data-sveltekit-preload-data="hover" aria-label={t(lang, 'site.name')}>
				<img
					src="/img/gforkg.svg"
					alt=""
					width="44"
					height="44"
					loading="lazy"
					class="m3-footer-brand-img"
				/>
				<span class="m3-footer-brand-text">
					<span class="m3-footer-brand-name">{t(lang, 'site.name')}</span>
					<span class="m3-footer-brand-tagline">{t(lang, 'site.tagline')}</span>
				</span>
			</a>

			<nav class="m3-footer-links" aria-label={t(lang, 'site.name')}>
				{#each footerLinks as link}
					<a href="/{lang}{link.href}" class="m3-footer-link" data-sveltekit-preload-data="hover">
						{t(lang, link.key)}
					</a>
				{/each}
			</nav>
		</div>

		<!-- Sponsor Section -->
		<div class="m3-footer-sponsor">
			<h4 class="m3-footer-sponsor-text">
				{t(lang, 'footer.sponsor_title')}
				<a href={siteConfig.sponsor.url} target="_blank" rel="noopener noreferrer" class="m3-footer-link">
					{siteConfig.sponsor.name}
				</a>
				{t(lang, 'footer.sponsor_title_suffix') || ''}
			</h4>

			<a href={siteConfig.sponsor.url} target="_blank" rel="noopener noreferrer" class="m3-footer-sponsor-anchor">
				<img
					src={siteConfig.sponsor.image}
					alt={t(lang, 'footer.sponsor_alt')}
					loading="lazy"
					class="m3-footer-sponsor-img"
				/>
			</a>
		</div>

		<div class="m3-footer-ad">
			<Ad type="fluid" />
		</div>

		<!-- Bottom Bar -->
		<hr class="m3-footer-divider" />

		<div class="m3-footer-bottom">
			<div class="m3-footer-bottom-meta">
				<a href="/{lang}/feedback" class="m3-footer-link" data-sveltekit-preload-data="hover">
					{t(lang, 'footer.feedback')}
				</a>
				<span class="m3-footer-sep" aria-hidden="true">·</span>
				<span class="m3-footer-copyright">
					{t(lang, 'footer.copyright').replace('{year}', String(year))}
					{#if __APP_VERSION__ && __APP_VERSION__ !== 'dev'}
						<span class="m3-footer-version">
							<a href={`${siteConfig.github.org}/commit/${__APP_VERSION__}`} target="_blank" rel="noopener noreferrer">
								v{__APP_VERSION__}
							</a>
						</span>
					{/if}
				</span>
			</div>

			<form class="m3-footer-lang-form" onsubmit={(e) => e.preventDefault()}>
				<select
					id="locale-select"
					class="m3-footer-lang-select"
					aria-label={t(lang, 'language.select')}
					onchange={switchLanguage}
				>
					<option value="" disabled selected>
						{t(lang, 'language.select')}
					</option>
					{#each i18nConfig.supportedLangs as l}
						<option value={l} data-language-url="/{l}" selected={l === lang}>
							{t(lang, `lang.${l}`)}
						</option>
					{/each}
				</select>
			</form>

			<div class="m3-footer-bottom-meta">
				<img
					src={siteConfig.footer.ratingImage}
					alt={t(lang, 'footer.rating_alt')}
					loading="lazy"
					width="40"
					height="40"
					class="m3-footer-rating-img"
				/>
				<span class="m3-footer-sep" aria-hidden="true">·</span>
				<span class="m3-footer-icp">
					{siteConfig.footer.icpNumber}｜
					<a
						href={siteConfig.footer.icpLink}
						target="_blank"
						rel="noopener noreferrer"
						class="m3-footer-link"
					>
						{siteConfig.footer.icpLink}
					</a>
				</span>
			</div>
		</div>
	</div>
</footer>

<style>
	.m3-footer {
		border-top: 1px solid var(--md-sys-color-outline-variant);
		background: var(--md-sys-color-surface-container-lowest);
		margin-top: auto;
		font-size: var(--md-sys-typescale-body-small-size);
	}

	.m3-footer-inner {
		max-width: var(--md-sys-layout-max-width);
		margin: 0 auto;
		padding: 40px var(--md-sys-layout-side-margin) 28px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	/* Brand + quick links */
	.m3-footer-top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 20px 32px;
	}

	.m3-footer-brand {
		display: inline-flex;
		align-items: center;
		gap: 14px;
		color: inherit;
		text-decoration: none;
	}

	.m3-footer-brand-img {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: var(--md-sys-color-surface);
		box-shadow: 0 1px 2px rgba(0, 0, 0, .03), 0 8px 24px rgba(0, 0, 0, .04);
	}

	.m3-footer-brand-text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		line-height: 1.3;
	}

	.m3-footer-brand-name {
		font-size: var(--md-sys-typescale-title-medium-size);
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}

	.m3-footer-brand-tagline {
		font-size: var(--md-sys-typescale-body-small-size);
		color: var(--md-sys-color-on-surface-variant);
	}

	.m3-footer-links {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 2px;
	}

	/* Link */
	.m3-footer-link {
		color: var(--md-sys-color-primary);
		text-decoration: none;
		transition: color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
	}
	.m3-footer-link:hover {
		color: var(--md-sys-color-secondary);
		text-decoration: underline;
	}

	.m3-footer-links .m3-footer-link {
		display: inline-flex;
		align-items: center;
		padding: 6px 12px;
		border-radius: var(--md-sys-shape-corner-full);
		font-size: var(--md-sys-typescale-body-medium-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.m3-footer-links .m3-footer-link:hover {
		background: var(--md-sys-color-surface-variant);
		color: var(--md-sys-color-on-surface);
		text-decoration: none;
	}

	/* Sponsor */
	.m3-footer-sponsor {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		text-align: center;
	}

	.m3-footer-sponsor-text {
		margin: 0;
		font-size: var(--md-sys-typescale-label-large-size);
		font-weight: 500;
		color: var(--md-sys-color-on-surface-variant);
		line-height: 1.5;
	}

	.m3-footer-sponsor-img {
		width: 360px;
		max-width: 90vw;
		height: auto;
		aspect-ratio: 360 / 54;
		object-fit: contain;
	}

	.m3-footer-sponsor-anchor {
		display: inline-block;
	}

	/* AdSense */
	.m3-footer-ad {
		width: 100%;
		max-width: 672px;
		margin: 0 auto;
	}

	/* Divider */
	.m3-footer-divider {
		border: none;
		border-top: 1px solid var(--md-sys-color-outline-variant);
		margin: 4px 0 0;
	}

	/* Bottom bar */
	.m3-footer-bottom {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 14px 24px;
	}

	.m3-footer-bottom-meta {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: var(--md-sys-typescale-body-small-size);
		color: var(--md-sys-color-on-surface-variant);
		line-height: 1.5;
	}

	.m3-footer-sep {
		opacity: .6;
		user-select: none;
	}

	.m3-footer-copyright {
		opacity: .7;
	}

	.m3-footer-version {
		margin-left: 6px;
		opacity: .8;
	}
	.m3-footer-version a {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.92em;
		text-decoration: none;
	}
	.m3-footer-version a:hover {
		text-decoration: underline;
	}

	.m3-footer-icp {
		word-break: break-all;
	}

	.m3-footer-rating-img {
		width: 40px;
		height: 40px;
		user-select: none;
		pointer-events: none;
	}

	/* Language select */
	.m3-footer-lang-select {
		padding: 8px 12px;
		font-size: var(--md-sys-typescale-body-medium-size);
		font-family: inherit;
		color: var(--md-sys-color-on-surface);
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-outline);
		border-radius: var(--md-sys-shape-corner-extra-small);
		cursor: pointer;
		transition: border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
		outline: none;
	}
	.m3-footer-lang-select:focus {
		border-color: var(--md-sys-color-primary);
		border-width: 2px;
	}

	@media (max-width: 720px) {
		.m3-footer-top {
			flex-direction: column;
			align-items: center;
			justify-content: center;
		}
		.m3-footer-links {
			justify-content: center;
		}
		.m3-footer-bottom {
			flex-direction: column;
			justify-content: center;
		}
		.m3-footer-bottom-meta {
			justify-content: center;
		}
	}
</style>
