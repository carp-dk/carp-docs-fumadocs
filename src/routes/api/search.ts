import { createFileRoute } from '@tanstack/react-router';
import { getPageSection, source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

const server = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
  // As the default index, except that Backend API endpoint pages, named after operations such as
  // "Get all", also index their group ("Data points"), so searching for a resource finds them.
  async buildIndex(page) {
    const { structuredData } = page.type === 'openapi' ? page.data : await page.data.load();
    const group = page.type === 'openapi' ? getPageSection(page.url)?.group : undefined;
    return {
      id: page.url,
      url: page.url,
      title: page.data.title ?? page.url,
      description: page.data.description,
      structuredData: group ? { ...structuredData, contents: [...structuredData.contents, { heading: undefined, content: group }] } : structuredData,
    };
  },
});

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: async ({ request }) => server.GET(request),
    },
  },
});
