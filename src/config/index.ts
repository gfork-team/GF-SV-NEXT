import cfg from './config.json';
import { cdnEnabled, cdnStatic, buildBasePath } from '$lib/cdn-toggle';

const _urlRewriteRules = cfg.urlRewriteRules.map(r => ({
  from: new RegExp(r.from),
  to: r.to
}));

export const siteConfig = {
  name: cfg.site.name,
  tagline: cfg.site.tagline,
  description: cfg.site.description as Record<string, string>,
  keywords: cfg.site.keywords,
  url: cfg.site.url,
  defaultColorScheme: cfg.site.defaultColorScheme || 'green',
  favicon: cfg.favicon,
  cdn: {
    get enabled() { return cdnEnabled; },
    static: cdnStatic,
    siteProxy: cfg.cdn.siteProxy,
    adsenseScript: cfg.cdn.adsenseScript,
    buildBasePath,
  },
  downloadNodes: cfg.downloadNodes,
  download: cfg.download,
  lookupNodes: cfg.lookupNodes as { primary: { id: string; endpoint: string; method: 'GET' | 'POST' }[]; backup: { id: string; endpoint: string; method: 'GET' | 'POST' }[] },
  lookupSignature: cfg.lookupSignature as { mode: 'none' | 'sha256Timestamp' | 'saltedSha256'; ssLength: number },
  infoApi: cfg.infoApi,
  greasyforkRegion: cfg.greasyforkRegion as 'cn' | 'org',
  adsense: cfg.adsense,
  sponsor: cfg.sponsor,
  seo: cfg.seo,
  contactEmail: cfg.site.contactEmail,
  footer: cfg.footer,
  github: cfg.github,
  links: cfg.links,
  audit: cfg.audit,
  announce: {
    get enabled() { return cfg.announce.enabled === true; },
    get type() { return cfg.announce.type || 'info'; },
    get message() { return cfg.announce.message || {}; },
  },
  redirects: cfg.redirects,
  search: {
    get siteFilterEnabled() { return cfg.search.siteFilterEnabled === true; },
  },
  urlRewriteRules: _urlRewriteRules,
};

export type { Lang } from '$i18n';

export function siteUrl(path: string): string {
  return `${siteConfig.url.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function staticUrl(path: string): string {
  const base = siteConfig.cdn.enabled ? siteConfig.cdn.static : '';
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function siteProxyUrl(): string {
  return siteConfig.cdn.enabled ? siteConfig.cdn.siteProxy : '';
}

export function auditEndpoint(): string {
  return siteConfig.audit.enabled ? siteConfig.audit.endpoint : '';
}

export function ogImageUrl(): string {
  return siteUrl(siteConfig.seo.defaultOgImage);
}

export function shouldShowAds(lang: string): boolean {
  if (!siteConfig.adsense.enabled) return false;
  const allowed = siteConfig.adsense.allowedLangs as string[];
  if (allowed.length === 0) return true;
  return allowed.includes(lang);
}

export function getDownloadDomains(): string[] {
  const arr = [...siteConfig.downloadNodes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function getPrimaryLookupNodes() {
  return [...siteConfig.lookupNodes.primary];
}

export function getBackupLookupNodes() {
  return [...siteConfig.lookupNodes.backup];
}
