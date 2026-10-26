import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'CARP Docs';
export const siteDescription = 'Technical documentation for the Copenhagen Research Platform (CARP): Flutter packages for mobile sensing, health data and wearables.';
// The public origin, for canonical URLs, Open Graph, structured data and the sitemap. Set
// VITE_SITE_URL to serve the docs from another domain. import.meta.env is undefined in plain
// Node (vite.config), and process is undefined in the browser.
// An empty value (e.g. an unset Docker build argument) counts as unset.
const configuredSiteUrl: string | undefined = import.meta.env?.VITE_SITE_URL || (typeof process === 'undefined' ? undefined : process.env.VITE_SITE_URL);
export const siteUrl = (configuredSiteUrl || 'https://docs.carp.dk').replace(/\/$/, '');
export const absoluteUrl = (path: string) => new URL(path, siteUrl).href;
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';

// The repository behind the GitHub links and "Edit on GitHub". Point it at your own repo.
export const gitConfig = {
  user: 'carp-dk',
  repo: 'carp-docs-fumadocs',
  branch: 'main',
};

const getDocsUrl = createGetUrl(docsRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs];
  if (segments.length === 0) {
    segments.push('index.md');
  } else {
    segments[segments.length - 1] += '.md';
  }

  return { segments, url: getDocsUrl(segments, page.locale) };
}

/** @returns page slugs */
export function decodeMarkdownUrl(segments: string[]) {
  if (segments.length === 0) return [];

  const out = [...segments];
  out[out.length - 1] = out[out.length - 1].replace(/\.md$/, '');
  if (out.length === 1 && out[0] === 'index') out.pop();
  return out;
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  // PNG, which every social platform accepts.
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
