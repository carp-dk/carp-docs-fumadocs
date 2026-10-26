import { source } from './source';
import type { DocsGraph } from '@/components/m3e/mdx/graph-view';
import type * as PageTree from 'fumadocs-core/page-tree';

export function buildDocsGraph(): DocsGraph {
  const pages = source.getPages();
  const nodes = pages.map(page => ({ id: page.url, url: page.url, text: page.data.title }));
  const urls = new Set(nodes.map(node => node.url));
  const links = new Map<string, { source: string; target: string }>();
  const add = (from: string, to: string) => { if (from !== to && urls.has(from) && urls.has(to)) links.set(`${from}:${to}`, { source: from, target: to }); };
  function visit(items: PageTree.Node[], parent = '/docs') {
    for (const item of items) {
      if (item.type === 'page') add(parent, item.url);
      else if (item.type === 'folder') {
        const root = item.index?.url ?? parent;
        if (item.index) add(parent, root);
        visit(item.children, root);
      }
    }
  }
  visit(source.getPageTree().children);
  return { nodes, links: [...links.values()] };
}

// Load full documents only when a graph is requested, preserving lazy docs loading.
let references: Promise<DocsGraph> | undefined;
export function buildReferenceGraph(): Promise<DocsGraph> {
  return references ??= (async () => {
    const graph = buildDocsGraph();
    const urls = new Set(graph.nodes.map(node => node.url));
    const links = new Map(graph.links.map(link => [`${link.source}:${link.target}`, link]));
    await Promise.all(source.getPages().map(async page => {
      const data = await page.data.load();
      for (const reference of data.extractedReferences ?? []) {
        const url = reference.href.split('#')[0];
        if (url !== page.url && urls.has(url)) links.set(`${page.url}:${url}`, { source: page.url, target: url });
      }
    }));
    return { ...graph, links: [...links.values()] };
  })().catch(error => { references = undefined; throw error; });
}
