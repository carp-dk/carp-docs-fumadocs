import { createFileRoute } from '@tanstack/react-router';
import { generateOGImage } from '@/lib/og';
import { getPageSection, source } from '@/lib/source';
import { appName, siteUrl } from '@/lib/shared';

export const Route = createFileRoute('/og/docs/$')({
  server: {
    handlers: {
      GET: ({ params }) => {
        // The last segment is the image file name (image.png).
        const slugs = (params._splat?.split('/') ?? []).filter((v) => v.length > 0).slice(0, -1);
        const page = source.getPage(slugs);
        if (!page) return new Response(undefined, { status: 404 });
        const section = getPageSection(page.url);

        return generateOGImage({
          title: page.data.title ?? appName,
          description: page.data.description,
          // Endpoint names like "Get all" repeat across the Backend API groups, so the card names the group.
          section: section && !section.isOverview ? page.type === 'openapi' && section.group ? `${section.name} · ${section.group}` : section.name : undefined,
          site: appName,
          domain: new URL(siteUrl).host,
        });
      },
    },
  },
});
