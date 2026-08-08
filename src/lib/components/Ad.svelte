<script lang="ts">
  import { onMount } from 'svelte';

  const CLIENT = 'ca-pub-3758644447684310';

  const SLOTS: Record<string, { slot: string; style: string; format?: string; layoutKey?: string; fullWidthResponsive?: boolean }> = {
    fluid:       { slot: '1394739154', style: 'display:block;min-height:90px',                     format: 'fluid',       layoutKey: '-gy+2i+5x-ek+82' },
    auto:        { slot: '4095096984', style: 'display:block;min-height:250px',                    format: 'auto',        fullWidthResponsive: true },
    sidebar:     { slot: '4497590737', style: 'display:inline-block;width:190px;height:570px;min-height:570px' },
    autorelaxed: { slot: '3934604756', style: 'display:block;min-height:250px',                    format: 'autorelaxed' },
    horizontal:  { slot: '4095096984', style: 'display:block;text-align:center;min-height:90px', format: 'auto', fullWidthResponsive: true },
  };

  let { type = 'auto' }: { type?: string } = $props();
  let cfg = $derived(SLOTS[type] || SLOTS.auto);

  onMount(() => {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  });
</script>

<ins
  class="adsbygoogle"
  style={cfg.style}
  data-ad-client={CLIENT}
  data-ad-slot={cfg.slot}
  data-ad-format={cfg.format}
  data-ad-layout-key={cfg.layoutKey}
  data-full-width-responsive={cfg.fullWidthResponsive ? 'true' : undefined}
></ins>
