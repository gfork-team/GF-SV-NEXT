<script lang="ts">
	import { t, type Lang } from '$i18n';
	import { siteConfig } from '$lib/config';
	import { getInstallGuide, closeInstallGuide } from '$lib/ui-state.svelte';
	import Icon from '$components/Icon.svelte';

	interface Props {
		lang: Lang;
	}

	let { lang }: Props = $props();
	let dialog = $state<HTMLDialogElement | null>(null);

	interface Manager {
		id: string;
		label: string;
		url: string;
		ua: RegExp;
	}

	const managers: Manager[] = [
		{
			id: 'tampermonkey',
			label: 'Tampermonkey',
			url: siteConfig.links.tampermonkey,
			ua: /tampermonkey/i
		},
		{
			id: 'violentmonkey',
			label: 'Violentmonkey',
			url: siteConfig.links.violentmonkey,
			ua: /violentmonkey/i
		},
		{ id: 'scriptcat', label: 'ScriptCat', url: siteConfig.links.scriptcat, ua: /scriptcat/i },
		{
			id: 'greasemonkey',
			label: 'Greasemonkey',
			url: siteConfig.links.greasemonkey,
			ua: /greasemonkey/i
		}
	];

	/** 仅用于把「可能已在用」的管理器排前面，不做任何安装检测 */
	const ordered = $derived.by(() => {
		const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
		return [...managers].sort((a, b) => Number(b.ua.test(ua)) - Number(a.ua.test(ua)));
	});

	const guide = $derived(getInstallGuide());

	$effect(() => {
		const el = dialog;
		if (!el) return;
		if (guide && !el.open) el.showModal();
		else if (!guide && el.open) el.close();
	});

	const steps = $derived([
		{ title: t(lang, 'guide.step1_title'), desc: t(lang, 'guide.step1_desc') },
		{ title: t(lang, 'guide.step2_title'), desc: t(lang, 'guide.step2_desc') },
		{ title: t(lang, 'guide.step3_title'), desc: t(lang, 'guide.step3_desc') }
	]);
</script>

<dialog bind:this={dialog} class="guide" aria-labelledby="guide-title" oncancel={closeInstallGuide}>
	{#if guide}
		<div class="guide__head">
			<h2 class="guide__title" id="guide-title">{t(lang, 'guide.title')}</h2>
			<button type="button" class="ui-icon-btn" onclick={closeInstallGuide}>
				<Icon name="close" size={20} />
				<span class="visually-hidden">{t(lang, 'guide.close')}</span>
			</button>
		</div>

		<div class="guide__body">
			{#if guide.scriptName}
				<p class="guide__script">
					{t(lang, 'guide.for_script')}
					<strong>{guide.scriptName}</strong>
				</p>
			{/if}

			<ol class="guide__steps">
				{#each steps as step, i (step.title)}
					<li class="guide__step">
						<span class="guide__num" aria-hidden="true">{i + 1}</span>
						<div>
							<h3 class="guide__step-title">{step.title}</h3>
							<p class="guide__step-desc">{step.desc}</p>
						</div>
					</li>
				{/each}
			</ol>

			<div class="guide__managers">
				<h3 class="guide__sub">{t(lang, 'guide.recommended')}</h3>
				<ul class="guide__list">
					{#each ordered as m (m.id)}
						<li>
							<a
								class="ui-btn ui-btn--outlined ui-btn--sm"
								href={m.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								{m.label}
								<Icon name="external" size={14} />
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<p class="guide__note">
				<Icon name="alert" size={16} />
				<span>{t(lang, 'guide.note')}</span>
			</p>
		</div>

		<div class="guide__foot">
			<button type="button" class="ui-btn ui-btn--text" onclick={closeInstallGuide}>
				{t(lang, 'guide.close')}
			</button>
			{#if guide.installHref}
				<a
					class="ui-btn ui-btn--filled"
					href={guide.installHref}
					data-sveltekit-noscroll
					onclick={closeInstallGuide}
				>
					<Icon name="install" size={18} />
					{t(lang, 'guide.direct_install')}
				</a>
			{/if}
		</div>
	{/if}
</dialog>

<style>
	.guide {
		width: min(520px, calc(100vw - 32px));
		max-height: min(84vh, 720px);
		padding: 0;
		background: var(--md-sys-color-surface-container-low);
		color: var(--md-sys-color-on-surface);
		border: none;
		border-radius: var(--md-sys-shape-corner-extra-large);
		overflow: hidden;
	}
	.guide::backdrop {
		background: color-mix(in srgb, var(--md-sys-color-scrim) 45%, transparent);
	}
	.guide[open] {
		display: flex;
		flex-direction: column;
	}

	.guide__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 16px 8px 12px 24px;
	}
	.guide__title {
		font-size: var(--md-sys-typescale-title-large-size);
	}
	.guide__body {
		overflow-y: auto;
		padding: 0 24px 8px;
	}
	.guide__script {
		color: var(--md-sys-color-on-surface-variant);
		margin-bottom: 8px;
	}
	.guide__steps {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 12px;
		margin: 12px 0 0;
	}
	.guide__step {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}
	.guide__num {
		flex: none;
		width: 24px;
		height: 24px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
		border-radius: 50%;
		font-size: var(--md-sys-typescale-label-medium-size);
		font-weight: 600;
	}
	.guide__step-title {
		font-size: var(--md-sys-typescale-title-small-size);
	}
	.guide__step-desc {
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-body-small-size);
		line-height: 1.6;
	}
	.guide__managers {
		margin-top: 20px;
	}
	.guide__sub {
		font-size: var(--md-sys-typescale-title-small-size);
		margin-bottom: 8px;
	}
	.guide__list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.guide__note {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		margin-top: 20px;
		padding: 12px;
		background: var(--gf-warning-container);
		color: var(--gf-on-warning-container);
		border-radius: var(--md-sys-shape-corner-small);
		font-size: var(--md-sys-typescale-body-small-size);
		line-height: 1.6;
	}
	.guide__foot {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
		padding: 12px 16px;
		border-top: 1px solid var(--md-sys-color-outline-variant);
	}
	.guide__foot :global(a) {
		flex: none;
	}
	@media (max-width: 599px) {
		.guide__foot {
			flex-direction: column-reverse;
			align-items: stretch;
		}
	}
</style>
