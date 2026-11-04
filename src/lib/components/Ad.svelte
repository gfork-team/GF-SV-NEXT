<!--
  AdSense 广告位。

  三条收益相关策略（都可在 config.json → adsense 里关掉）：

  1. 投放半径（lazyLoad / lazyRootMargin）
     进入半径才 push。
     - `lazyLoad: true` → 只有进入 `lazyRootMargin` 的槽位才投放，广告在可见前不占请求、
       不抢主线程，viewability ↑ → eCPM ↑。
     - `lazyLoad: false`（当前配置）→ 半径等效无限大，页面加载即全部投放，
       保展示量；但**结构性隐藏**的槽位（移动端隐藏的侧栏、未激活的 tab 面板）
       仍然不会被投放 —— 它们永远不可能被看到，只会产生 0 viewability 曝光和
       Google 的 availableWidth=0 报错，纯粹亏本。切到可见时观察器会再触发一次。

  2. 预留高度只服务「结构稳定」（keepReserveOnFill / reserveTimeoutMs）
     - 未表态 / 被拦截 / 明确 unfilled → 立刻收掉预留，不留空白坑；
     - 已填充 → 默认保留预留，避免广告比预留矮时整页上跳。
       CLS 是搜索排名因素，用长期流量换一次跳动不划算；
       想要「填满即贴合」可以设 keepReserveOnFill:false（会接受一次跳动）。
     - 兜底计时只对「已发起投放」的槽位生效：懒加载还没投的槽位不能被计时器收掉预留。

  3. 语言白名单（allowedLangs）
     必须和 layout 注入脚本用同一个 shouldShowAds()，否则会出现
     「渲染了 ins 但没加载 adsbygoogle.js」的空槽 + Google 报错。

  其它约束：
  - 槽位 id 一律来自 config.json → adsense.slots，组件里不写死；
  - 同一 ins 只 push 一次（requestAd 内部按 data-gf-requested 幂等，SPA 重挂载安全）;
  - sidebar 竖版槽位在窄屏隐藏：300px 固定单元在窄屏会 availableWidth=0 报错。
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { t, i18nConfig } from '$i18n';
	import { adsenseSlot, shouldShowAds, siteConfig } from '$lib/config';
	import {
		canRenderAds,
		getConsentGranted,
		isAdBlocked,
		requestAd,
		type AdType
	} from '$lib/ad-state.svelte';

	/** 尺寸 / 格式规格；不含 slot id */
	interface Spec {
		format?: string;
		layoutKey?: string;
		fullWidthResponsive?: boolean;
		minHeight: number;
		inlineWidth?: string;
	}

	const SPECS: Record<AdType, Spec> = {
		fluid: { format: 'fluid', layoutKey: siteConfig.adsense.fluidLayoutKey, minHeight: 90 },
		auto: { format: 'auto', fullWidthResponsive: true, minHeight: 250 },
		// horizontal 与 auto 同规格，只是语义不同（窄横条位置）
		horizontal: { format: 'auto', fullWidthResponsive: true, minHeight: 90 },
		autorelaxed: { format: 'autorelaxed', minHeight: 250 },
		sidebar: { minHeight: 600, inlineWidth: '300px' }
	};

	let { type = 'auto' }: { type?: AdType } = $props();

	const cfg = $derived(siteConfig.adsense);
	const lang = $derived(page.data.lang ?? i18nConfig.defaultLang);
	/** 与 layout 注入脚本用同一判断，避免空槽 */
	const showAds = $derived(shouldShowAds(lang));
	const slotId = $derived(adsenseSlot(type));
	const spec = $derived<Spec>(SPECS[type] ?? SPECS.auto);
	const layoutKey = $derived(
		type === 'fluid' ? (cfg.fluidLayoutKey ?? spec.layoutKey) : spec.layoutKey
	);

	const consentKnown = $derived(getConsentGranted() !== null);
	const blockedNow = $derived(isAdBlocked() === true);
	const renderable = $derived(cfg.enabled && showAds && !!cfg.publisherId && slotId !== '');
	const mayRequest = $derived(renderable && canRenderAds());

	let container = $state<HTMLElement>();
	/** 是否进入投放半径（懒加载） */
	let inView = $state(false);
	/** 镜像 data-ad-status，避免渲染期直接读 DOM */
	let adStatus = $state<string | null>(null);
	/** 预留高度是否保留 */
	let reserve = $state(true);

	let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		const el = container;
		if (!el || typeof window === 'undefined') return;

		// Google 处理后会写 data-ad-status（filled / unfilled / collapsed）
		adStatus = el.getAttribute('data-ad-status');
		const obs = new MutationObserver(() => {
			adStatus = el.getAttribute('data-ad-status');
		});
		obs.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });

		let io: IntersectionObserver | undefined;
		/*
		 * 结构性隐藏（display:none 的侧栏、未激活的 tab 面板）没有盒子，
		 * getClientRects() 为空 —— 这类槽位无论如何都不该投放：
		 * 永远看不到，只会产生 0 viewability 曝光和 availableWidth=0 报错。
		 */
		const hiddenNow = el.getClientRects().length === 0;
		const canObserve = typeof IntersectionObserver !== 'undefined';

		if (!cfg.lazyLoad && !hiddenNow) {
			// 关掉懒加载：立即可投放，和旧版同样的时机，不差一帧
			inView = true;
		} else if (canObserve) {
			/*
			 * lazyLoad:true → 按配置半径懒加载；
			 * lazyLoad:false 但当前隐藏 → 半径放大到等效无限，
			 * 一旦被显示出来就立刻投放（否则等用户滚到也不算，见上）。
			 */
			const rootMargin = cfg.lazyLoad ? String(cfg.lazyRootMargin ?? '600px') : '100000px';
			io = new IntersectionObserver(
				(entries) => {
					if (!entries.some((entry) => entry.isIntersecting)) return;
					inView = true;
					io?.disconnect();
				},
				{ rootMargin, threshold: 0 }
			);
			io.observe(el);
		} else {
			// 没有观察器就退回「立即投放」，宁可有无效请求也不漏投
			inView = true;
		}

		return () => {
			obs.disconnect();
			io?.disconnect();
			clearTimeout(fallbackTimer);
		};
	});

	// 进入半径 + 允许投放 → push；untrack 让 requestAd 不参与依赖收集，
	// 保证「同一轮里只跑一次」，重挂载/多次触发由 data-gf-requested 兜底
	$effect(() => {
		const el = container;
		if (!el || !mayRequest || !inView) return;
		untrack(() => {
			if (el.getAttribute('data-gf-requested') === '1') return;
			requestAd(el);
			// 只对已发起投放的槽位计时：被拦截 / 静默失败时收掉预留，避免永久空白
			fallbackTimer = setTimeout(
				() => {
					if (!el.getAttribute('data-ad-status')) reserve = false;
				},
				Number(cfg.reserveTimeoutMs) || 4000
			);
		});
	});

	// 预留高度策略
	$effect(() => {
		if (!consentKnown || blockedNow) {
			reserve = false;
			return;
		}
		if (adStatus === 'unfilled' || adStatus === 'collapsed') {
			reserve = false;
			return;
		}
		if (adStatus === 'filled' && !cfg.keepReserveOnFill) reserve = false;
	});
</script>

<div
	class="ad"
	class:ad--sidebar={type === 'sidebar'}
	class:ad--collapsed={!reserve}
	style:--ad-min={spec.minHeight + 'px'}
	style:--ad-width={spec.inlineWidth ?? 'auto'}
	data-ad-type={type}
	data-ad-state={adStatus ?? (mayRequest ? 'pending' : 'idle')}
>
	{#if renderable}
		<ins
			bind:this={container}
			class="adsbygoogle"
			aria-label={t(lang, 'ads.label')}
			style:display={spec.inlineWidth ? 'inline-block' : 'block'}
			style:width={spec.inlineWidth ?? undefined}
			data-ad-client={cfg.publisherId}
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
