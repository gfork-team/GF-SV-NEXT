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

		<!-- Language Selector -->
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

		<!-- Feedback Link -->
		<p class="m3-footer-meta">
			<a href="/{lang}/feedback" class="m3-footer-link" data-sveltekit-preload-data="hover">
				{t(lang, 'footer.feedback')}
			</a>
		</p>

		<!-- Rating Image -->
		<img
			src={siteConfig.footer.ratingImage}
			alt={t(lang, 'footer.rating_alt')}
			loading="lazy"
			width="65"
			height="65"
			class="m3-footer-rating-img"
		/>

		<!-- ICP / Moe Union -->
		<p class="m3-footer-meta">
			{siteConfig.footer.icpNumber}｜
			<a
				href={siteConfig.footer.icpLink}
				target="_blank"
				rel="noopener noreferrer"
				class="m3-footer-link"
			>
				{siteConfig.footer.icpLink}
			</a>
		</p>

		<!-- Copyright -->
		<p class="m3-footer-meta m3-footer-copyright">
			{t(lang, 'footer.copyright').replace('{year}', String(year))}
		</p>
	</div>
</footer>

<style>
	.m3-footer {
		border-top: 1px solid var(--md-sys-color-outline-variant);
		background: var(--md-sys-color-surface-container-lowest);
		margin-top: auto;
		font-size: var(--md-sys-typescale-body-small-size);
		text-align: center;
	}

	.m3-footer-inner {
		max-width: var(--md-sys-layout-max-width);
		margin: 0 auto;
		padding: 40px var(--md-sys-layout-side-margin) 32px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	/* Sponsor */
	.m3-footer-sponsor {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;
	}

	.m3-footer-sponsor-text {
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

	.m3-footer-link {
		color: var(--md-sys-color-primary);
		text-decoration: none;
		transition: color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
	}
	.m3-footer-link:hover {
		color: var(--md-sys-color-secondary);
		text-decoration: underline;
	}

	/* AdSense */
	.m3-footer-ad {
		width: 100%;
		max-width: 672px;
		margin: 8px 0;
	}

	/* Language select */
	.m3-footer-lang-form {
		display: flex;
		align-items: center;
		justify-content: center;
	}

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

	/* Meta */
	.m3-footer-meta {
		font-size: var(--md-sys-typescale-body-small-size);
		color: var(--md-sys-color-on-surface-variant);
		line-height: 1.5;
	}

	.m3-footer-copyright {
		margin-top: 4px;
		opacity: 0.7;
	}

	/* Rating */
	.m3-footer-rating-img {
		width: 65px;
		height: 65px;
		user-select: none;
		pointer-events: none;
	}
</style>
