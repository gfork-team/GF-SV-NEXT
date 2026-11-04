<script lang="ts">
	import { t, type Lang } from '$i18n';
	import Ad from '$components/Ad.svelte';
	import Icon from '$components/Icon.svelte';
	import type { IconName } from '$lib/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

	interface HelpCard {
		icon: IconName;
		titleKey: string;
		descKey: string;
		href: string;
		external?: boolean;
	}

	let gettingStarted = $derived([
		{
			icon: 'download',
			titleKey: 'help.card_install_title',
			descKey: 'help.card_install_desc',
			href: `/${lang}/installing`
		} as HelpCard,
		{
			icon: 'extension',
			titleKey: 'help.card_managers_title',
			descKey: 'help.card_managers_desc',
			href: `/${lang}/applist`
		} as HelpCard
	]);

	let support = $derived([
		{
			icon: 'message',
			titleKey: 'help.card_feedback_title',
			descKey: 'help.card_feedback_desc',
			href: `/${lang}/feedback`
		} as HelpCard,
		{
			icon: 'book',
			titleKey: 'help.card_docs_title',
			descKey: 'help.card_docs_desc',
			href: 'https://doc.greasyfork.org.cn',
			external: true
		} as HelpCard,
		{
			icon: 'tool',
			titleKey: 'help.card_tampermonkey_title',
			descKey: 'help.card_tampermonkey_desc',
			href: 'https://www.tampermonkey.net/faq.php',
			external: true
		} as HelpCard,
		{
			icon: 'extension',
			titleKey: 'help.card_greasemonkey_title',
			descKey: 'help.card_greasemonkey_desc',
			href: 'https://wiki.greasemonkey.net/Troubleshooting_(Users)',
			external: true
		} as HelpCard
	]);

	let community = $derived([
		{
			icon: 'code',
			titleKey: 'help.card_github_title',
			descKey: 'help.card_github_desc',
			href: 'https://github.com/greasfork-org/greasyfork',
			external: true
		} as HelpCard
	]);
</script>

<svelte:head>
	<title>{t(lang, 'meta.help_title')}</title>
	<meta name="description" content={t(lang, 'meta.help_desc')} />
	<meta
		name="keywords"
		content="greasyfork help, userscript help, script installation help, tampermonkey help, greasemonkey help, user script support"
	/>
</svelte:head>

<div class="width-constraint">
	<section class="hp-page">
		<!-- AD: Top -->
		<div style="text-align:center;margin:0 0 24px">
			<Ad type="fluid" />
		</div>

		<!-- ── Getting Started ───────────────────────────── -->
		<section class="hp-section">
			<h2 class="hp-section-title">
				<span class="hp-section-icon" aria-hidden="true"><Icon name="rocket" size={22} /></span>
				{t(lang, 'help.section_getting_started')}
			</h2>
			<div class="hp-card-grid">
				{#each gettingStarted as card (card.href)}
					<a href={card.href} class="hp-card">
						<span class="hp-card-icon" aria-hidden="true"><Icon name={card.icon} size={22} /></span>
						<div class="hp-card-body">
							<h3 class="hp-card-title">{t(lang, card.titleKey)}</h3>
							<p class="hp-card-desc">{t(lang, card.descKey)}</p>
						</div>
						<span class="hp-card-arrow" aria-hidden="true"
							><Icon name="arrow-right" size={18} /></span
						>
					</a>
				{/each}
			</div>
		</section>

		<!-- ── Help & Support ────────────────────────────── -->
		<section class="hp-section">
			<h2 class="hp-section-title">
				<span class="hp-section-icon" aria-hidden="true"><Icon name="help-circle" size={22} /></span
				>
				{t(lang, 'help.section_support')}
			</h2>
			<div class="hp-card-grid hp-card-grid--four">
				{#each support as card (card.href)}
					<a
						href={card.href}
						class="hp-card"
						target={card.external ? '_blank' : undefined}
						rel={card.external ? 'noopener noreferrer' : undefined}
					>
						<span class="hp-card-icon" aria-hidden="true"><Icon name={card.icon} size={22} /></span>
						<div class="hp-card-body">
							<h3 class="hp-card-title">{t(lang, card.titleKey)}</h3>
							<p class="hp-card-desc">{t(lang, card.descKey)}</p>
						</div>
						<span class="hp-card-arrow" aria-hidden="true"
							><Icon name={card.external ? 'external' : 'arrow-right'} size={18} /></span
						>
					</a>
				{/each}
			</div>
		</section>

		<!-- 正文内单元：教程页内容长，中段是最容易进入视口的位置 -->
		<div style="text-align:center;margin:32px 0 8px">
			<Ad type="horizontal" />
		</div>

		<!-- ── Community & Open Source ───────────────────── -->
		<section class="hp-section">
			<h2 class="hp-section-title">
				<span class="hp-section-icon" aria-hidden="true"><Icon name="users" size={22} /></span>
				{t(lang, 'help.section_community')}
			</h2>
			<div class="hp-card-grid">
				{#each community as card (card.href)}
					<a href={card.href} class="hp-card" target="_blank" rel="noopener noreferrer">
						<span class="hp-card-icon" aria-hidden="true"><Icon name={card.icon} size={22} /></span>
						<div class="hp-card-body">
							<h3 class="hp-card-title">{t(lang, card.titleKey)}</h3>
							<p class="hp-card-desc">{t(lang, card.descKey)}</p>
						</div>
						<span class="hp-card-arrow" aria-hidden="true"><Icon name="external" size={18} /></span>
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
		font-size: var(--md-sys-typescale-title-large-size);
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
		background: var(--md-sys-color-surface-container-lowest);
		border-radius: 14px;
		border: 1px solid var(--md-sys-color-outline-variant);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.03),
			0 4px 12px rgba(0, 0, 0, 0.03);
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.2s ease-out,
			box-shadow 0.2s ease-out,
			border-color 0.2s ease-out;
	}
	@media (hover: hover) {
		.hp-card:hover {
			transform: translateY(-3px);
			box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
			border-color: var(--md-sys-color-primary);
		}
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
		font-size: var(--md-sys-typescale-title-small-size);
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
			font-size: var(--md-sys-typescale-title-medium-size);
			margin-bottom: 16px;
		}
	}
</style>
