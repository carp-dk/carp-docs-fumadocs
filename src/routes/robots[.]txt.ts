import { createFileRoute } from '@tanstack/react-router';
import { absoluteUrl } from '@/lib/shared';

// Everything is public except the API routes; the sitemap lists every docs page.
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => new Response(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } }),
    },
  },
});
