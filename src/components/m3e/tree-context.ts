'use client';

import { createContext, use } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';

export const TreeContext = createContext<PageTree.Root | null>(null);

export function useDocsTree() {
  const tree = use(TreeContext);
  if (!tree) throw new Error('DocsPage must be rendered inside DocsLayout.');
  return tree;
}

export function flattenPages(nodes: PageTree.Node[]): PageTree.Item[] {
  return nodes.flatMap(node => node.type === 'page' ? [node] : node.type === 'folder' ? [...(node.index ? [node.index] : []), ...flattenPages(node.children)] : []);
}
