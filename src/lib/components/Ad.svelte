<!--
  AdSense 广告位。

  兼容性要点：
  1. 尺寸与槽位全部由配置驱动（config.json → adsense.slots），代码里不再写死。
  2. <ins> 标记在 SSR 阶段就输出（广告不依赖首屏 HTML，但利于布局稳定），
     是否发起投放请求则按 Cookie 同意状态决定：
     同意 → 个性化；拒绝 → 走 Google 非个性化（npa）通道；未表态 → 不投。
  3. 预留高度避免 CLS，但拦截器 / 未表态 / 未填充 三种情况都会立即塌缩，
     避免出现大片空白广告坑。
  4. adsbygoogle.js 是 async 脚本，走 ad-state 的 whenSdkReady 队列；
     另设 2.5s 兜底 push，保证 onload 回调丢失时也不丢广告请求。
  5. 同一 ins 只 push 一次，SPA 前进/后退重挂载不会触发
     "All ins elements already have ads in them"。
  6. sidebar 竖版槽位在窄屏隐藏，避免生成非法窄广告导致 Google 报错。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { siteConfig } from '$lib/config';
	import {
		canRenderAds,
		isAdBlocked,
		isSdkReady,
		requestAd,
		whenSdkReady,
		getConsentGranted
	} from '$lib/ad-state.svelte';

	type SlotSpec = {
		slot: string;
		format?: string;
		layoutKey?: string;
		fullWidthResponsive?: boolean;
		minHeight: number;
		inlineWidth?: string;
	};

	const DEFAULTS: Record<string, SlotSpec> = {
		fluid: { slot: '1394739154', format: 'fluid', layoutKey: '-gy+2i+5x-ek+82', minHeight: 90 },
		auto: { slot: '4095096984', format: 'auto', fullWidthResponsive: true, minHeight: 250 },
		// horizontal 与 auto 使用同一槽位规格，仅语义不同
		horizontal: { slot: '4095096984', format: 'auto', fullWidthResponsive: true, minHeight: 90 },
		autorelaxed: { slot: '3934604756', format: 'autorelaxed', minHeight: 250 },
		sidebar: { slot: '4497590737', minHeight: 600, inlineWidth: '300px' }
	};

	let { type = 'auto' }: { type?: string } = $props();

	let cfg = $derived(siteConfig.adsense);
	let enabled = $derived(cfg.enabled === true);
	let adClient = $derived(cfg.publisherId);
	let spec = $derived(DEFAULTS[type] ?? DEFAULTS.auto!);
	let slotId = $derived((cfg.slots as Record<string, string> | undefined)?.[type] ?? spec.slot);
	let layoutKey = $derived(
		type === 'fluid' ? (cfg.fluidLayoutKey ?? spec.layoutKey) : spec.layoutKey
	);

	let container: HTMLElement | undefined = $state();

	/** 预留高度撑开；塌缩后归零，避免空白坑 */
	let reserve = $state(true);
	/** 广告是否已确定可以投放（拦截器命中则永不投放） */
	let consentKnown = $derived(getConsentGranted() !== null);
	/** 未表态 / 被拦截时不发起投放请求，避免违规投放个性化广告 */
	let mayRequest = $derived(enabled && canRenderAds());
	let blockedNow = $derived(isAdBlocked() === true);

	function syncReserve() {
		// Google 处理后会写入 data-ad-status（filled / unfilled / collapsed）。
		// 一旦写入，高度要么由广告 iframe 自己给出，要么根本没有内容，
		// 两种情况预留高度都应立刻撤掉，否则会留下空白坑或延迟跳动。
		if (container?.getAttribute('data-ad-status')) reserve = false;
	}

	function arm() {
		const el = container;
		if (!el) return;
		if (isSdkReady() || isAdBlocked() === true) {
			requestAd(el);
			return;
		}
		whenSdkReady(() => requestAd(el));
		// 兜底：push 到 window.adsbygoogle 队列本身是「先入队、脚本到位后消费」，
		// 晚一点 push 依然有效。即使 onload 回调因任何原因没触发，
		// 也不会因此永久丢失这次广告请求。
		window.setTimeout(() => requestAd(el), 2500);
	}

	onMount(() => {
		const el = container;
		if (!el) return;

		if (mayRequest) arm();

		const obs = new MutationObserver(syncReserve);
		obs.observe(el, {
			attributes: true,
			attributeFilter: ['data-ad-status', 'data-adsbygoogle-status']
		});

		// 兜底：被拦截或 Google 未写 status 时，6s 后收掉预留高度，避免永久空白
		const timer = window.setTimeout(syncReserve, 6000);

		return () => {
			obs.disconnect();
			window.clearTimeout(timer);
		};
	});

	// 用户做出同意选择后，之前渲染的空槽位需要补投
	$effect(() => {
		if (mayRequest && container && !container.getAttribute('data-gf-requested')) arm();
	});

	// 同意状态未知或被拦截时不会有广告，直接收掉预留高度
	$effect(() => {
		if (!consentKnown || blockedNow) reserve = false;
	});
</script>

<div
	class="ad"
	class:ad--sidebar={type === 'sidebar'}
	class:ad--collapsed={!reserve}
	style:--ad-min={spec.minHeight + 'px'}
	style:--ad-width={spec.inlineWidth ?? 'auto'}
>
	{#if enabled && adClient && slotId}
		<ins
			bind:this={container}
			class="adsbygoogle"
			style:display={spec.inlineWidth ? 'inline-block' : 'block'}
			style:width={spec.inlineWidth ?? undefined}
			data-ad-client={adClient}
			data-ad-slot={slotId}
			data-ad-format={spec.format}
			data-ad-layout-key={layoutKey}
			data-full-width-responsive={spec.fullWidthResponsive ? 'true' : undefined}
			data-gf-blocked={blockedNow ? '1' : undefined}
			data-gf-consent={consentKnown ? (getConsentGranted() ? 'granted' : 'denied') : 'pending'}
		></ins>
	{/if}
</div>

<style>
	.ad {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		width: 100%;
		min-height: var(--ad-min);
		transition: min-height var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard);
		/* 刻意不加 overflow / contain：广告 iframe 常高于预留高度，
		   裁剪或 containment 会导致广告被切掉或布局异常。 */
	}
	.ad--sidebar {
		justify-content: center;
	}
	.ad--collapsed {
		min-height: 0;
	}
	/* inlineWidth 为空时不要输出内联 width：内联 width:auto 会盖掉下面
   .ad :global(ins.adsbygoogle){width:100%}，导致 flex 子项在广告填充前
   收缩为 0 宽，Google 报 availableWidth=0。 */
	.ad :global(ins.adsbygoogle) {
		display: block;
		width: 100%;
	}
	.ad--sidebar :global(ins.adsbygoogle) {
		display: inline-block;
		width: var(--ad-width);
	}
	/* 竖版槽位在窄屏隐藏：宽度不足会触发 Google "availableWidth=0" 报错 */
	@media (max-width: 839px) {
		.ad--sidebar {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ad {
			transition: none;
		}
	}
</style>
