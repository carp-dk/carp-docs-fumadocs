import { llms, loader, update } from 'fumadocs-core/source';
import { findPath, type Folder } from 'fumadocs-core/page-tree';
import { docs } from './docs';
import { icons as lucideIcons } from 'lucide-react';
import { createElement } from 'react';
import { materialIcons } from '@/components/ui/icons';
import { docsRoute } from './shared';
import { backendApiDir } from './backend-api';
import { backendApiFolders, backendApiTreePlugin, getBackendApiSource } from './openapi';
import { backendApiMarkdown } from './backend-api-markdown';

export { docs };

// The MDX pages, and the Backend API endpoint pages generated from the CAWS OpenAPI document. The
// endpoint folders go after the `---Endpoints---` label in content/docs/backend-api/meta.json.
export const source = loader({
  docs: update(docs.toFumadocsSource()).meta(file => file.path === `${backendApiDir}/meta.json` ? { ...file, data: { ...file.data, pages: withEndpointFolders(file.data.pages ?? []) } } : file).build(),
  openapi: await getBackendApiSource(),
}, {
  baseUrl: docsRoute,
  // Adds the method badges of endpoint pages to the page tree.
  plugins: [backendApiTreePlugin()],
  icon(name) {
    if (!name) return;
    const Icon = materialIcons[name as keyof typeof materialIcons] ?? lucideIcons[name as keyof typeof lucideIcons];
    return Icon ? createElement(Icon) : undefined;
  },
});

function withEndpointFolders(pages: string[]) {
  const at = pages.indexOf('---Endpoints---');
  return at < 0 ? [...pages, ...backendApiFolders] : [...pages.slice(0, at + 1), ...backendApiFolders, ...pages.slice(at + 1)];
}

export type SourcePage = NonNullable<ReturnType<typeof source.getPage>>;

/**
 * The package section (root folder) of a page, whether the page is that section's overview, and
 * the name of the group folder in the section that holds the page, if any.
 */
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
  const group = folders.at(-1);
  return { name: section.name, isOverview: overview === url, group: group !== section && typeof group?.name === 'string' ? group.name : undefined };
}

export const docsLlms = llms(source, {
  renderPage: async (page) => page.type === 'openapi' ? backendApiMarkdown(page) : `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});
