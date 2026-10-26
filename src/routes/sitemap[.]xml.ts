import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { absoluteUrl } from '@/lib/shared';

// Every docs page once, at its canonical URL. (The root only redirects to /docs.)
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const urls = source.getPages().map(page => `  <url><loc>${absoluteUrl(page.url)}</loc></url>`).sort();
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
      },
    },
  },
});
