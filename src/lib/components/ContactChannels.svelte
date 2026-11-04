<!--
  联系方式的唯一渲染入口。

  分布约定（改这里就等于改全站）：
  - `/feedback` 专用页：完整两个渠道
  - `/about` Contact 卡片：完整两个渠道
  - `/tos` 条款：条款文字 + 同一组渠道（法律文本需要保留"邮箱："这种措辞，故单独排版）
  - 页脚：GitHub 仓库 + 反馈入口（全站可达）

  邮箱走 ContactEmail（构建产物里只有密文占位）；GitHub 是公开地址，直接渲染。
-->
<script lang="ts">
	import { t, type Lang } from '$i18n';
	import { siteConfig } from '$lib/config';
	import ContactEmail from '$components/ContactEmail.svelte';
	import Icon from '$components/Icon.svelte';

	let { lang }: { lang: Lang } = $props();

	/** 显示成 `greasyfork-proxy/GreasyFork-Mirror` 这种短形式 */
	const repoUrl = $derived(siteConfig.github.repo);
	const repoLabel = $derived(repoUrl.replace(/^https?:\/\/(?:www\.)?github\.com\//, ''));
</script>

<ul class="channels">
	<li class="channels__item">
		<span class="channels__icon" aria-hidden="true"><Icon name="mail" size={18} /></span>
		<span class="channels__body">
			<span class="channels__label">{t(lang, 'contact.email')}</span>
			<ContactEmail label={t(lang, 'contact.email')} />
			<span class="channels__hint">{t(lang, 'contact.email_hint')}</span>
		</span>
	</li>
	<li class="channels__item">
		<span class="channels__icon" aria-hidden="true"><Icon name="code" size={18} /></span>
		<span class="channels__body">
			<span class="channels__label">{t(lang, 'contact.github')}</span>
			<a class="channels__link" href={repoUrl} target="_blank" rel="noopener noreferrer">
				{repoLabel}
				<Icon name="external" size={14} />
			</a>
			<span class="channels__hint">{t(lang, 'contact.github_hint')}</span>
		</span>
	</li>
</ul>

<style>
	.channels {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.channels__item {
		display: flex;
		align-items: flex-start;
		gap: 10px;
	}
	.channels__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex: none;
		border-radius: var(--md-sys-shape-corner-small);
		background: var(--md-sys-color-surface-container);
		color: var(--md-sys-color-on-surface-variant);
	}
	.channels__body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		font-size: var(--md-sys-typescale-body-medium-size);
		line-height: 1.6;
	}
	.channels__label {
		font-size: var(--md-sys-typescale-label-medium-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.channels__link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		width: fit-content;
		color: var(--md-sys-color-primary);
		text-decoration: none;
		word-break: break-all;
	}
	.channels__link:hover {
		text-decoration: underline;
	}
	.channels__hint {
		font-size: var(--md-sys-typescale-label-small-size);
		color: var(--md-sys-color-on-surface-variant);
	}
	.channels :global(a[href^='mailto:']) {
		color: var(--md-sys-color-primary);
		word-break: break-all;
	}
</style>
