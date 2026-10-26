import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

// The build prerenders every docs page into the server's public directory, but Nitro's static
// handler only knows the files that existed before prerendering, so the Node server would render
// each page again on every request. This serves the prerendered page instead: read once, kept in
// memory with Brotli and gzip copies and an ETag, and revalidated by browsers on each visit.

declare global { var __nitro_main__: string | undefined }

// Nitro's server entry sits in .output/server, next to .output/public.
const publicDir = globalThis.__nitro_main__ ? resolve(dirname(fileURLToPath(globalThis.__nitro_main__)), '../public') : undefined;
const enabled = process.env.NODE_ENV === 'production' && Boolean(publicDir && existsSync(publicDir));

interface Page { etag: string; body: Buffer; br: Buffer; gzip: Buffer }
const pages = new Map<string, Promise<Page | undefined>>();

function load(pathname: string) {
  let page = pages.get(pathname);
  if (!page) {
    page = (async () => {
      const file = normalize(join(publicDir!, pathname, 'index.html'));
      if (!file.startsWith(publicDir! + sep) || !existsSync(file)) return;
      const body = await readFile(file);
      return {
        etag: `"${createHash('sha1').update(body).digest('base64url')}"`,
        body,
        br: brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }),
        gzip: gzipSync(body, { level: 9 }),
      };
    })();
    pages.set(pathname, page);
  }
  return page;
}

/** The prerendered page for a request, or undefined to render it on the server. */
export async function servePrerendered(request: Request): Promise<Response | undefined> {
  if (!enabled || (request.method !== 'GET' && request.method !== 'HEAD')) return;
  const pathname = decodeURIComponent(new URL(request.url).pathname).replace(/\/+$/, '') || '/';
  // Pages only: no file extensions (assets, .md, .png, sitemap.xml and the like).
  if (!pathname.startsWith('/docs') || /\.[a-z0-9]+$/i.test(pathname)) return;
  const page = await load(pathname);
  if (!page) return;

  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'public, max-age=0, must-revalidate',
    etag: page.etag,
    vary: 'Accept-Encoding',
  });
  if (request.headers.get('if-none-match') === page.etag) return new Response(null, { status: 304, headers });

  const accepted = request.headers.get('accept-encoding') ?? '';
  const [body, encoding] = /\bbr\b/.test(accepted) ? [page.br, 'br'] : /\bgzip\b/.test(accepted) ? [page.gzip, 'gzip'] : [page.body, undefined];
  if (encoding) headers.set('content-encoding', encoding);
  headers.set('content-length', String(body.length));
  return new Response(request.method === 'HEAD' ? null : new Uint8Array(body), { headers });
}
