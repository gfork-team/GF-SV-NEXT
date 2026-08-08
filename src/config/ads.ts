/**
 * AdSense slot configuration.
 * Use <Ad type="auto" /> from '$components/Ad.svelte' instead of {@html} strings.
 */
export const CLIENT = 'ca-pub-3758644447684310';

export const SLOTS: Record<string, { slot: string; style: string; format?: string; layoutKey?: string; fullWidthResponsive?: boolean }> = {
  fluid:       { slot: '1394739154', style: 'display:block',                     format: 'fluid',       layoutKey: '-gy+2i+5x-ek+82' },
  auto:        { slot: '4095096984', style: 'display:block',                     format: 'auto',        fullWidthResponsive: true },
  sidebar:     { slot: '4497590737', style: 'display:inline-block;width:190px;height:570px' },
  autorelaxed: { slot: '3934604756', style: 'display:block',                     format: 'autorelaxed' },
};


