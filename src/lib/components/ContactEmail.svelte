<!--
  联系邮箱：SSR 阶段不输出明文，浏览器端解密后再渲染 mailto 链接。

  为什么不能只用 CSS 藏起来：明文只要进了 HTML，采集脚本就能直接抓，
  无论视觉上是否可见。所以这里是「HTML 里根本没有明文」，
  而不是「明文存在但看不见」。
-->
<script lang="ts">
	import { decipherText } from '$lib/mail-obfuscate';
	import { siteConfig } from '$lib/config';

	interface Props {
		/** 无障碍名称，便于读屏区分多个邮箱入口 */
		label?: string;
	}

	let { label }: Props = $props();

	/** null 表示尚未解密（SSR 与首个客户端渲染都是这个状态） */
	let address = $state<string | null>(null);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const { cipher, key } = siteConfig.contactEmail;
		if (!cipher || !key) return;
		address = decipherText(cipher, key) || null;
	});
</script>

{#if address}
	<a href="mailto:{address}" aria-label={label}>{address}</a>
{:else}
	<!--
		占位保留邮箱的视觉宽度，避免解密后发生布局跳动（CLS）。
		文案不提示具体地址，避免对采集脚本泄露长度或格式线索。
	-->
	<span class="contact-email-placeholder" aria-hidden="true">••••••••@••••••</span>
{/if}

<style>
	.contact-email-placeholder {
		display: inline-block;
		min-width: 15em;
		user-select: none;
		color: var(--md-sys-color-primary);
	}
</style>
