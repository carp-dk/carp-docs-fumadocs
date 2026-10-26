'use client';

import { findPath, findProjection, type Folder, type Item, type Node, type Root } from 'fumadocs-core/page-tree';
import { M3eFormField } from '@m3e/react/form-field';
import { M3eOption } from '@m3e/react/option';
import { M3eSelect } from '@m3e/react/select';
import { useRouter } from 'fumadocs-core/framework';
import { useId, type ComponentRef, type ReactNode } from 'react';
import { Button } from './mdx/actions';
import { BookIcon, ChevronDownIcon, FolderIcon } from '@/components/ui/icons';

export interface SidebarTab { title: ReactNode; description?: ReactNode; url: string; urls?: Set<string>; icon?: ReactNode }
export type SidebarTabsOptions = false | SidebarTab[] | { transform?: (option: SidebarTab, node: Folder) => SidebarTab };
interface TabGroup { label: string; active?: SidebarTab; options: SidebarTab[] }

function pages(nodes: Node[]): Item[] { return nodes.flatMap(node => node.type === 'page' ? [node] : node.type === 'folder' ? [...(node.index ? [node.index] : []), ...pages(node.children)] : []); }
function scopedRoots(nodes: Node[]): Folder[] { return nodes.flatMap(node => node.type === 'folder' ? node.root ? [node] : scopedRoots(node.children) : []); }
function rootLink(folder: Folder): string { return folder.index?.url ?? pages(folder.children)[0]?.url ?? '/docs'; }
const matches = (url: string, base: string) => url === base || url.startsWith(`${base.replace(/\/$/, '')}/`);

export function getSidebarScope(tree: Root, pathname: string, tabs?: SidebarTabsOptions, versions?: SidebarTab[]) {
  const path = findPath(tree.children, node => node.type === 'page' && node.url === pathname) ?? [];
  const activeRoots = path.filter((node): node is Folder => node.type === 'folder' && Boolean(node.root));
  const currentPage = pages(tree.children).find(page => page.url === pathname);
  const groups: TabGroup[] = [];
  let scope: Root | Folder = tree;
  let version: Folder | undefined;
  for (let level = 0; level <= activeRoots.length; level++) {
    const active = activeRoots[level];
    const roots = scopedRoots(scope.children);
    const types = [...new Set(roots.map(folder => folder.root))];
    for (const type of types) {
      const siblings = roots.filter(folder => folder.root === type);
      const selected = active?.root === type ? active : undefined;
      const options: SidebarTab[] = siblings.map(folder => {
        const destination = selected && currentPage ? findProjection(selected, folder, currentPage)?.url : undefined;
        const option = { title: folder.name, description: folder.description, icon: folder.icon, url: destination ?? rootLink(folder) };
        return !Array.isArray(tabs) && tabs && tabs.transform ? tabs.transform(option, folder) : option;
      });
      if (level === 0 && type === true) options.unshift({ title: tree.name || 'Documentation', description: 'All guides', url: '/docs', icon: <BookIcon /> });
      groups.push({ label: type === 'version' ? 'Version' : type === true ? 'Section' : String(type), active: selected ? options.find(option => matches(option.url, rootLink(selected))) : level === 0 && type === true ? options[0] : undefined, options });
    }
    if (!active) break;
    scope = active;
    if (active.root === 'version') version = active;
  }
  const prune = (nodes: Node[]): Node[] => nodes.flatMap<Node>(node => {
    if (node.type !== 'folder') return [node];
    if (node.root) return node.index ? [{ ...node.index, name: node.name, icon: node.icon ?? node.index.icon }] : [];
    // A folder that only groups sections (whose own pages live in their sidebars) has nothing left to show.
    const children = prune(node.children);
    return children.length || node.index ? [{ ...node, children }] : [];
  });
  let visible: Root = { name: scope.name, children: [...(scope.type === 'folder' && scope.index ? [{ ...scope.index, name: 'Overview' }] : []), ...prune(scope.children)] };
  if (Array.isArray(tabs)) {
    const selected = [...tabs].reverse().find(tab => tab.urls?.has(pathname) || matches(pathname, tab.url));
    if (selected) {
      const filter = (nodes: Node[]): Node[] => nodes.flatMap<Node>(node => node.type === 'page' ? (selected.urls?.has(node.url) || matches(node.url, selected.url) ? [node] : []) : node.type === 'folder' ? [{ ...node, children: filter(node.children), index: node.index && (selected.urls?.has(node.index.url) || matches(node.index.url, selected.url)) ? node.index : undefined }].filter(node => node.index || node.children.length) : []);
      visible = { name: selected.title, children: filter(tree.children) };
    }
    groups.splice(0, groups.length, { label: 'Section', active: selected, options: tabs });
  }
  if (versions?.length) groups.unshift({ label: 'Version', active: [...versions].reverse().find(tab => matches(pathname, tab.url)), options: versions });
  return { tree: visible, groups: tabs === false ? [] : groups, versionUrls: version ? pages([version]).map(page => page.url) : undefined };
}

function SidebarTabGroup({ group, onNavigate, mode }: { group: TabGroup; onNavigate?: () => void; mode?: 'dropdown' | 'top' }) {
  const id = useId();
  const router = useRouter();
  if (mode === 'top' && group.label !== 'Version') return <nav className="docs-section-tabs" aria-label={group.label}>{group.options.map(option => <Button key={option.url} size="extra-small" href={option.url} variant={option === group.active ? 'tonal' : 'text'} aria-current={option === group.active ? 'page' : undefined} onClick={onNavigate}>{option.title}</Button>)}</nav>;
  // An outlined M3 select. Choosing an option navigates to it; the current section's icon
  // leads the field.
  return <M3eFormField variant="outlined" hideSubscript="always" className="docs-section-field">
    <span slot="label" id={`${id}-label`}>{group.label}</span>
    <span slot="prefix" className="docs-section-field-icon" aria-hidden="true">{group.active?.icon ?? <FolderIcon />}</span>
    <M3eSelect id={id} aria-labelledby={`${id}-label`} hideSelectionIndicator value={group.active?.url ?? ''} onChange={event => {
      const next = (event.currentTarget as ComponentRef<typeof M3eSelect>).value;
      if (typeof next === 'string' && next && next !== group.active?.url) { router.push(next); onNavigate?.(); }
    }}>
      <ChevronDownIcon slot="arrow" aria-hidden="true" />
      {group.options.map(option => <M3eOption key={option.url} value={option.url}><span className="docs-section-option"><span className="docs-section-option-icon" aria-hidden="true">{option.icon ?? <FolderIcon />}</span>{option.title}</span></M3eOption>)}
    </M3eSelect>
  </M3eFormField>;
}

export function SidebarTabs({ groups, onNavigate, mode = 'dropdown' }: { groups: TabGroup[]; onNavigate?: () => void; mode?: 'dropdown' | 'top' }) {
  return groups.length ? <div className="docs-sidebar-tabs">{groups.map((group, index) => <SidebarTabGroup key={`${group.label}-${index}`} group={group} onNavigate={onNavigate} mode={mode} />)}</div> : null;
}
