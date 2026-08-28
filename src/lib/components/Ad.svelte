<script lang="ts">
  import { onMount } from 'svelte';
  import { siteConfig } from '$lib/config';

  // 兜底账号 / 槽位，与 config.json adsense 块保持对齐；
  // 部署期可通过 config.json 直接换 publisherId / slot ID，无需改代码。
  const CLIENT_FALLBACK = 'ca-pub-3758644447684310';

  const SLOTS_FALLBACK: Record<string, { slot: string; style: string; format?: string; layoutKey?: string; fullWidthResponsive?: boolean }> = {
    fluid:       { slot: '1394739154', style: 'display:block;min-height:90px',                     format: 'fluid',       layoutKey: '-gy+2i+5x-ek+82' },
    auto:        { slot: '4095096984', style: 'display:block;min-height:250px',                    format: 'auto',        fullWidthResponsive: true },
    sidebar:     { slot: '4497590737', style: 'display:inline-block;width:190px;height:570px;min-height:570px' },
    autorelaxed: { slot: '3934604756', style: 'display:block;min-height:250px',                    format: 'autorelaxed' },
    horizontal:  { slot: '4095096984', style: 'display:block;text-align:center;min-height:90px', format: 'auto', fullWidthResponsive: true },
  };

  let { type = 'auto' }: { type?: string } = $props();

  let adClient = $derived(siteConfig.adsense.publisherId || CLIENT_FALLBACK);
  let typeCfg = $derived(SLOTS_FALLBACK[type] || SLOTS_FALLBACK.auto);
  let cfgSlots = $derived((siteConfig.adsense.slots ?? {}) as Record<string, string>);
  let slot = $derived(cfgSlots[type] || typeCfg.slot);
  let container: HTMLElement;

  onMount(() => {
    // Google 对每个 ins 处理后写入 data-adsbygoogle-status="done"；
    // 用自定义标记防止 SPA 重挂载 / 布局重试脚本重复 push（会抛
    // "All ins elements already have ads in them"）。
    if (!container) return;
    if (container.getAttribute('data-adsbygoogle-status') === 'done') return;
    if (container.getAttribute('data-gf-pushed') === '1') return;
    container.setAttribute('data-gf-pushed', '1');
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  });
</script>

<ins
  bind:this={container}
  class="adsbygoogle"
  style={typeCfg.style}
  data-ad-client={adClient}
  data-ad-slot={slot}
  data-ad-format={typeCfg.format}
  data-ad-layout-key={typeCfg.layoutKey}
  data-full-width-responsive={typeCfg.fullWidthResponsive ? 'true' : undefined}
></ins>