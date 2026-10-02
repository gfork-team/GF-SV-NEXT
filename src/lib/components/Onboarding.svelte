<script lang="ts">
	import { t, type Lang } from '$i18n';
	import Icon from '$components/Icon.svelte';

	interface Props {
		lang: Lang;
	}

	let { lang }: Props = $props();

	const KEY = 'gf-onboarding-done';
	let visible = $state(false);
	let dontShowAgain = $state(false);

	$effect(() => {
		if (typeof localStorage === 'undefined') return;
		visible = localStorage.getItem(KEY) !== '1';
	});

	const steps = $derived([
		{ title: t(lang, 'onboarding.step1_title'), desc: t(lang, 'onboarding.step1_desc') },
		{ title: t(lang, 'onboarding.step2_title'), desc: t(lang, 'onboarding.step2_desc') },
		{ title: t(lang, 'onboarding.step3_title'), desc: t(lang, 'onboarding.step3_desc') }
	]);

	function close() {
		if (dontShowAgain && typeof localStorage !== 'undefined') localStorage.setItem(KEY, '1');
		visible = false;
	}
</script>

{#if visible}
	<aside class="onboard ui-card" aria-labelledby="onboard-title">
		<div class="onboard__head">
			<h2 class="onboard__title" id="onboard-title">
				<Icon name="sparkle" size={18} />
				{t(lang, 'onboarding.title')}
			</h2>
			<button type="button" class="ui-icon-btn ui-icon-btn--sm" onclick={close}>
				<Icon name="close" size={18} />
				<span class="visually-hidden">{t(lang, 'onboarding.dismiss')}</span>
			</button>
		</div>

		<ol class="onboard__steps">
			{#each steps as step, i (step.title)}
				<li class="onboard__step">
					<span class="onboard__num" aria-hidden="true">{i + 1}</span>
					<div>
						<h3>{step.title}</h3>
						<p>{step.desc}</p>
					</div>
				</li>
			{/each}
		</ol>

		<div class="onboard__foot">
			<label class="onboard__remember">
				<input type="checkbox" bind:checked={dontShowAgain} />
				<span>{t(lang, 'onboarding.dont_show')}</span>
			</label>
			<button type="button" class="ui-btn ui-btn--filled ui-btn--sm" onclick={close}>
				{t(lang, 'onboarding.got_it')}
			</button>
		</div>
	</aside>
{/if}

<style>
	.onboard {
		gap: 12px;
		background: var(--md-sys-color-surface-container-low);
	}
	.onboard__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.onboard__title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: var(--md-sys-typescale-title-medium-size);
		color: var(--md-sys-color-primary);
	}
	.onboard__steps {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.onboard__step {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}
	.onboard__num {
		flex: none;
		width: 22px;
		height: 22px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
		border-radius: 50%;
		font-size: var(--md-sys-typescale-label-medium-size);
		font-weight: 600;
	}
	.onboard__step h3 {
		font-size: var(--md-sys-typescale-title-small-size);
	}
	.onboard__step p {
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-body-small-size);
		line-height: 1.6;
	}
	.onboard__foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.onboard__remember {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 32px;
		color: var(--md-sys-color-on-surface-variant);
		font-size: var(--md-sys-typescale-label-medium-size);
		cursor: pointer;
	}
	.onboard__remember input {
		width: 18px;
		height: 18px;
		accent-color: var(--md-sys-color-primary);
	}
</style>
