<script lang="ts">
	import { t, type Lang } from '$i18n';
	import Ad from '$components/Ad.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);


	interface HelpCard {
		icon: string;
		titleKey: string;
		descKey: string;
		href: string;
		external?: boolean;
	}

	let gettingStarted = $derived([
		{ icon: 'download', titleKey: 'help.card_install_title', descKey: 'help.card_install_desc', href: `/${lang}/installing` } as HelpCard,
		{ icon: 'extension', titleKey: 'help.card_managers_title', descKey: 'help.card_managers_desc', href: `/${lang}/applist` } as HelpCard,
		{ icon: 'search', titleKey: 'help.card_search_title', descKey: 'help.card_search_desc', href: `/${lang}/search` } as HelpCard
	]);

	let support = $derived([
		{ icon: 'feedback', titleKey: 'help.card_feedback_title', descKey: 'help.card_feedback_desc', href: `/${lang}/feedback` } as HelpCard,
		{ icon: 'menu_book', titleKey: 'help.card_docs_title', descKey: 'help.card_docs_desc', href: 'https://doc.greasyfork.org.cn', external: true } as HelpCard,
		{ icon: 'build', titleKey: 'help.card_tampermonkey_title', descKey: 'help.card_tampermonkey_desc', href: 'https://www.tampermonkey.net/faq.php', external: true } as HelpCard,
		{ icon: 'extension', titleKey: 'help.card_greasemonkey_title', descKey: 'help.card_greasemonkey_desc', href: 'https://wiki.greasemonkey.net/Troubleshooting_(Users)', external: true } as HelpCard
	]);

	let community = $derived([
		{ icon: 'code', titleKey: 'help.card_github_title', descKey: 'help.card_github_desc', href: 'https://github.com/greasfork-org/greasyfork', external: true } as HelpCard
	]);
</script>

<svelte:head>
<title>{t(lang, 'meta.help_title')}</title>
	<meta name="description" content={t(lang, 'meta.help_desc')} />
	<meta name="keywords" content="greasyfork help, userscript help, script installation help, tampermonkey help, greasemonkey help, user script support" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
</svelte:head>

<div class="width-constraint">
	<section class="hp-page">
		<!-- ── Getting Started ───────────────────────────── -->
		<section class="hp-section">
			<h2 class="hp-section-title">
				<span class="material-icons hp-section-icon">rocket_launch</span>
				{t(lang, 'help.section_getting_started')}
			</h2>
			<div class="hp-card-grid">
				{#each gettingStarted as card}
					<a href={card.href} class="hp-card">
						<span class="material-icons hp-card-icon">{card.icon}</span>
						<div class="hp-card-body">
							<h3 class="hp-card-title">{t(lang, card.titleKey)}</h3>
							<p class="hp-card-desc">{t(lang, card.descKey)}</p>
						</div>
						<span class="material-icons hp-card-arrow">arrow_forward</span>
					</a>
				{/each}
			</div>
		</section>

		<!-- ── Help & Support ────────────────────────────── -->
		<section class="hp-section">
			<h2 class="hp-section-title">
				<span class="material-icons hp-section-icon">support</span>
				{t(lang, 'help.section_support')}
			</h2>
			<div class="hp-card-grid hp-card-grid--four">
				{#each support as card}
					<a href={card.href} class="hp-card" target={card.external ? '_blank' : undefined} rel={card.external ? 'noopener noreferrer' : undefined}>
						<span class="material-icons hp-card-icon">{card.icon}</span>
						<div class="hp-card-body">
							<h3 class="hp-card-title">{t(lang, card.titleKey)}</h3>
							<p class="hp-card-desc">{t(lang, card.descKey)}</p>
						</div>
						<span class="material-icons hp-card-arrow">{card.external ? 'open_in_new' : 'arrow_forward'}</span>
					</a>
				{/each}
			</div>
		</section>

		<!-- ── Community & Open Source ───────────────────── -->
		<section class="hp-section">
			<h2 class="hp-section-title">
				<span class="material-icons hp-section-icon">diversity_3</span>
				{t(lang, 'help.section_community')}
			</h2>
			<div class="hp-card-grid">
				{#each community as card}
					<a href={card.href} class="hp-card" target="_blank" rel="noopener noreferrer">
						<span class="material-icons hp-card-icon">{card.icon}</span>
						<div class="hp-card-body">
							<h3 class="hp-card-title">{t(lang, card.titleKey)}</h3>
							<p class="hp-card-desc">{t(lang, card.descKey)}</p>
						</div>
						<span class="material-icons hp-card-arrow">open_in_new</span>
					</a>
				{/each}
			</div>
		</section>
	</section>

	<div style="margin-top:24px">
		<Ad type="autorelaxed" />
	</div>
</div>

<style>
	.hp-page {
		padding: 40px 0;
		color: var(--md-sys-color-on-surface);
	}

	/* ── Sections ─────────────────────────────────────── */
	.hp-section {
		margin-bottom: 40px;
	}

	.hp-section-title {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: var(--md-sys-typescale-title-large);
		font-weight: 500;
		margin: 0 0 24px;
		color: var(--md-sys-color-on-surface);
	}

	.hp-section-icon {
		font-size: 28px;
		color: var(--md-sys-color-primary);
	}

	/* ── Card grid ────────────────────────────────────── */
	.hp-card-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.hp-card-grid--four {
		grid-template-columns: repeat(4, 1fr);
	}

	/* ── Card ─────────────────────────────────────────── */
	.hp-card {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 20px;
		background: var(--card-bg);
		border-radius: var(--md-sys-shape-corner-medium);
		text-decoration: none;
		color: inherit;
	}

	.hp-card-icon {
		font-size: 32px;
		color: var(--md-sys-color-primary);
		flex-shrink: 0;
		margin-top: 2px;
	}

	.hp-card-body {
		flex: 1;
		min-width: 0;
	}

	.hp-card-title {
		margin: 0 0 4px;
		font-size: var(--md-sys-typescale-title-small);
		font-weight: 500;
		color: var(--md-sys-color-on-surface);
	}

	.hp-card-desc {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--md-sys-color-on-surface-variant);
	}

	.hp-card-arrow {
		font-size: 20px;
		color: var(--md-sys-color-on-surface-variant);
		flex-shrink: 0;
		margin-top: 8px;
	}

	/* ── Responsive ───────────────────────────────────── */
	@media (max-width: 1024px) {
		.hp-card-grid--four {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.hp-card-grid,
		.hp-card-grid--four {
			grid-template-columns: 1fr;
		}

		.hp-page {
			padding: 24px 0;
		}

		.hp-section {
			margin-bottom: 28px;
		}

		.hp-section-title {
			font-size: var(--md-sys-typescale-title-medium);
			margin-bottom: 16px;
		}
	}
</style>
