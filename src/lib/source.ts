import { llms, loader } from 'fumadocs-core/source';
import { findPath, type Folder } from 'fumadocs-core/page-tree';
import { defineDocs } from 'fumadocs-mdx/macro';
import { icons as lucideIcons } from 'lucide-react';
import { createElement } from 'react';
import { materialIcons } from '@/components/ui/icons';
import { docsRoute } from './shared';

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

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: docsRoute,
  icon(name) {
    if (!name) return;
    const Icon = materialIcons[name as keyof typeof materialIcons] ?? lucideIcons[name as keyof typeof lucideIcons];
    return Icon ? createElement(Icon) : undefined;
  },
});

/** The package section (root folder) of a page, and whether the page is that section's overview. */
export function getPageSection(url: string) {
  // The path also holds the separators before each node; only folders map to URL segments.
  const folders = (findPath(source.getPageTree().children, node => node.type === 'page' && node.url === url) ?? [])
    .filter((node): node is Folder => node.type === 'folder');
  const depth = folders.findIndex(folder => folder.root);
  const section = folders[depth];
  if (!section || typeof section.name !== 'string') return;
  // Folders map to URL segments, so the section's overview sits at its folder's depth. (A section
  // that lists "index" in meta.json keeps its overview as a child page, not as folder.index.)
  const overview = section.index?.url ?? `${docsRoute}/${url.slice(docsRoute.length + 1).split('/').slice(0, depth + 1).join('/')}`;
  return { name: section.name, isOverview: overview === url };
}

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});
