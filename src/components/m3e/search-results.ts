import type * as PageTree from 'fumadocs-core/page-tree';
import type { SearchResultRecord } from 'fumadocs-core/search/client';
import type { Root, RootContent } from 'hast';
import { Children, isValidElement, type ReactNode } from 'react';

export interface SearchHit {
  url: string;
  title: string;
  breadcrumbs: string[];
  kind: 'page' | 'section';
  excerpt?: string;
}

function labelText(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child)
    ? labelText(child.props.children) : String(child)).join('');
}

export function getSearchPages(tree: PageTree.Root): SearchHit[] {
  const pages: SearchHit[] = [];
  const addPage = (page: PageTree.Item, breadcrumbs: string[]) => {
    if (!page.external) pages.push({ url: page.url, title: labelText(page.name), breadcrumbs, kind: 'page' });
  };
  const visit = (nodes: PageTree.Node[], breadcrumbs: string[]) => {
    for (const node of nodes) {
      if (node.type === 'page') addPage(node, breadcrumbs);
      else if (node.type === 'folder') {
        if (node.index) addPage(node.index, breadcrumbs);
        visit(node.children, [...breadcrumbs, labelText(node.name)]);
      }
    }
  };
  visit(tree.children, ['Documentation']);
  return pages;
}

function plainText(node: Root | RootContent): string {
  if (node.type === 'text') return node.value;
  if (!('children' in node)) return '';
  const block = node.type === 'root' || (node.type === 'element' && ['p', 'li', 'tr', 'th', 'td'].includes(node.tagName));
  return node.children.map(plainText).join('') + (block ? ' ' : '');
}

function excerpt(text: string, query: string): string {
  const limit = 190;
  if (text.length <= limit) return text;
  const words = query.toLocaleLowerCase().trim().split(/\s+/);
  const match = words.map(word => text.toLocaleLowerCase().indexOf(word)).find(index => index >= 0) ?? 0;
  const start = Math.max(0, match - 60);
  const end = Math.min(text.length, start + limit);
  return `${start ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

function sectionTitle(url: string) {
  const hash = url.split('#')[1] ?? '';
  let title = hash;
  try { title = decodeURIComponent(hash); } catch { /* Keep malformed fragments readable. */ }
  title = title.replace(/[-_]+/g, ' ');
  return title.charAt(0).toLocaleUpperCase() + title.slice(1);
}

// Fumadocs emits a page record followed by heading/text matches. Merge records
// for the same destination so a heading and its excerpt don't become two rows.
export function getSearchHits(records: SearchResultRecord[], pages: SearchHit[], query: string): SearchHit[] {
  const metadata = new Map(pages.map(page => [page.url, page]));
  const groups = new Map<string, { page: SearchHit; sections: Map<string, SearchHit> }>();
  for (const record of records) {
    const pageUrl = record.url.split('#')[0];
    const content = plainText(record.hastContent).replace(/\s+/g, ' ').trim();
    let group = groups.get(pageUrl);
    if (!group) {
      group = {
        page: { ...(metadata.get(pageUrl) ?? { url: pageUrl, title: pageUrl, breadcrumbs: ['Documentation'], kind: 'page' }) },
        sections: new Map(),
      };
      groups.set(pageUrl, group);
    }
    if (record.type === 'page') {
      group.page.title = content;
      if (record.breadcrumbs?.length) group.page.breadcrumbs = record.breadcrumbs;
      continue;
    }
    if (record.type === 'text' && !group.page.excerpt) group.page.excerpt = excerpt(content, query);
    if (!record.url.includes('#')) continue;
    let section = group.sections.get(record.url);
    if (!section) {
      const breadcrumbs = group.page.breadcrumbs.at(-1) === group.page.title ? group.page.breadcrumbs : [...group.page.breadcrumbs, group.page.title];
      section = { url: record.url, title: sectionTitle(record.url), breadcrumbs, kind: 'section' };
      group.sections.set(record.url, section);
    }
    if (record.type === 'heading') section.title = content;
    else if (!section.excerpt) section.excerpt = excerpt(content, query);
  }
  return [...groups.values()].flatMap(group => [group.page, ...group.sections.values()]);
}
