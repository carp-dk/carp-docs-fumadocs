import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fumadocsMdx } from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { remarkMdxFiles } from 'fumadocs-core/mdx-plugins/remark-mdx-files';
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins/remark-mdx-mermaid';
import { createGenerator, remarkAutoTypeTable } from 'fumadocs-typescript';
import { readdirSync } from 'node:fs';
import { codeThemes } from './src/lib/code-theme.ts';

const typeGenerator = createGenerator();
const docsPages = readdirSync('content/docs', { recursive: true })
  .filter((path): path is string => typeof path === 'string' && /\.mdx?$/.test(path))
  .map(path => ({ path: `/docs/${path.replace(/(^|\/)index\.mdx?$/, '').replace(/\.mdx?$/, '')}`.replace(/\/$/, '') }));
// Unified merges repeated plugin registrations, so give the PascalCase alias
// its own plugin identity to keep both MDX spellings available.
function remarkNamedAutoTypeTable() {
  return remarkAutoTypeTable({ generator: typeGenerator, name: 'AutoTypeTable', shiki: { themes: codeThemes } });
}

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    fumadocsMdx({
      globalOptions: {
        mdxOptions: {
          remarkPlugins: [remarkMdxFiles, remarkMdxMermaid, [remarkAutoTypeTable, { generator: typeGenerator, shiki: { themes: codeThemes } }], remarkNamedAutoTypeTable],
          rehypeCodeOptions: { themes: codeThemes },
        },
      },
    }),
    tailwindcss(),
    tanstackStart({
      // M3E link properties hydrate on the client; seed every section/version.
      // sitemap.xml and robots.txt are written as static files too.
      pages: [...docsPages, { path: '/sitemap.xml' }, { path: '/robots.txt' }],
      prerender: {
        enabled: true,
        // The root only redirects to /docs (see routeRules below), so it has no page to render;
        // in-page anchor links found while crawling are the same pages.
        filter: page => page.path !== '/' && !page.path.includes('#'),
      },
    }),
    react(),
    // please see https://tanstack.com/start/latest/docs/framework/react/guide/hosting#nitro for guides on hosting
    nitro({
      // A Node server for the Docker image; set NITRO_PRESET (e.g. vercel) to build for another host.
      preset: process.env.NITRO_PRESET || 'node-server',
      // Ship Brotli and gzip copies of the static files, so the server sends them precompressed.
      compressPublicAssets: true,
      routeRules: {
        // The site opens on the docs: redirect the root permanently, before any static file.
        '/': { redirect: { to: '/docs', status: 308 } },
        // Fingerprinted build assets never change, so browsers and proxies can keep them for a year.
        '/assets/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
      },
      // M3E's compiled helpers must be bundled, including tslib's ESM entry.
      noExternals: ['tslib'],
    }),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      tslib: 'tslib/tslib.es6.js',
    },
  },
});
