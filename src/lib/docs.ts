import { defineDocs } from 'fumadocs-mdx/macro';

// The MDX collection. The browser loads pages from it, so it lives apart from the page source in
// source.ts, which resolves frontmatter icons from the full Lucide set and is only needed on the server.
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    async: true,
    postprocess: {
      includeProcessedMarkdown: true,
      extractLinkReferences: true,
    },
  },
});
