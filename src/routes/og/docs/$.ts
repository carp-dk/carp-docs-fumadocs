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
          title: page.data.title,
          description: page.data.description,
          section: section && !section.isOverview ? section.name : undefined,
          site: appName,
          domain: new URL(siteUrl).host,
        });
      },
    },
  },
});
