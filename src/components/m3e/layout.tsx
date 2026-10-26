'use client';

import { M3eNavMenu, M3eNavMenuItem, M3eNavMenuItemGroup } from '@m3e/react/nav-menu';
import { M3eMenu, M3eMenuItemRadio, M3eMenuTrigger } from '@m3e/react/menu';
import type * as PageTree from 'fumadocs-core/page-tree';
import Link from 'fumadocs-core/link';
import { usePathname } from 'fumadocs-core/framework';
import { useTheme } from 'next-themes';
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentRef, type ReactNode } from 'react';
import { ChevronDownIcon, FileTextIcon, FolderIcon, MenuIcon, SidebarOpenIcon, MessageCircleIcon, MonitorIcon, MoonIcon, SearchIcon, SidebarIcon, SunIcon } from '@/components/ui/icons';
import { GitHubIcon } from '../ui/brand-icons';
import { Button, IconButton } from '../ui/button';
import { SearchDialog, SearchTrigger } from './search';
import type { SearchHit } from './search-results';
import { LayoutLinks, type LinkItemType, type NavOptions } from './navigation';
import { getSidebarScope, SidebarTabs, type SidebarTab, type SidebarTabsOptions } from './sidebar-tabs';
import { MobileDrawer } from './mobile-drawer';
import { DocsGraphContext, type DocsGraph } from './mdx/graph-view';
import { TreeContext, flattenPages } from './tree-context';

export interface BaseLayoutProps {
  nav?: NavOptions;
  links?: LinkItemType[];
  banner?: ReactNode;
  githubUrl?: string;
  children?: ReactNode;
}

export interface DocsLayoutProps extends BaseLayoutProps {
  tree: PageTree.Root;
  searchPages: SearchHit[];
  graph?: DocsGraph;
  tabs?: SidebarTabsOptions;
  tabMode?: 'dropdown' | 'top';
  versions?: SidebarTab[];
  sidebar?: { enabled?: boolean; collapsible?: boolean; banner?: ReactNode; footer?: ReactNode; defaultOpenLevel?: number };
  aiChat?: { open: boolean; onOpenChange: (open: boolean) => void; panel: ReactNode };
}

// Top-level destinations carry an icon; nested pages are text-only rows on a guide line
// under their folder, so depth reads from structure rather than from more icons.
function Navigation({ tree, onNavigate, defaultOpenLevel = 1 }: { tree: PageTree.Root; onNavigate?: () => void; defaultOpenLevel?: number }) {
  const pathname = usePathname();
  const id = useId();
  const renderPage = (page: PageTree.Item, depth: number, name = page.name) => {
    const selected = page.url.replace(/\/$/, '') === pathname.replace(/\/$/, '');
    const labelId = `${id}-${page.url}`;
    return <M3eNavMenuItem key={page.url} selected={selected} data-current={String(selected)} aria-labelledby={labelId}>
      {depth === 0 && <span slot="icon" aria-hidden="true">{page.icon ?? <FileTextIcon />}</span>}
      <Link id={labelId} slot="label" href={page.url} external={page.external} tabIndex={-1} aria-current={selected ? 'page' : undefined} onClick={onNavigate}>{name}</Link>
    </M3eNavMenuItem>;
  };
  const renderNode = (node: PageTree.Node, index: number, depth = 0): ReactNode => {
    if (node.type === 'separator') {
      // M3E names an unlabelled group's label itself before hydration; a stable id avoids the mismatch.
      return <M3eNavMenuItemGroup key={node.$id ?? index}><span slot="label" id={`${id}-separator-${node.$id ?? index}`}>{node.name}</span></M3eNavMenuItemGroup>;
    }
    if (node.type === 'page') return renderPage(node, depth);
    // A folder toggles its children; its landing page is a separate destination.
    // This also lets M3E's tree keyboard controls work at every nesting level.
    const containsCurrentPage = flattenPages([node]).some(page => page.url === pathname);
    const labelId = `${id}-folder-${node.$id ?? node.index?.url ?? index}`;
    return (
      <M3eNavMenuItem key={node.$id ?? node.index?.url ?? index} className="docs-nav-folder" open={(node.defaultOpen ?? depth < defaultOpenLevel) || containsCurrentPage} aria-labelledby={labelId}>
        {depth === 0 && <span slot="icon" aria-hidden="true">{node.icon ?? <FolderIcon />}</span>}
        <span slot="label" id={labelId}>{node.name}</span>
        <ChevronDownIcon slot="toggle-icon" aria-hidden="true" />
        {node.index && renderPage(node.index, depth + 1, 'Overview')}
        {node.children.map((child, childIndex) => renderNode(child, childIndex, depth + 1))}
      </M3eNavMenuItem>
    );
  };
  return <M3eNavMenu className="docs-navigation" aria-label="Documentation">{tree.children.map((node, index) => renderNode(node, index))}</M3eNavMenu>;
}

const subscribeToHydration = () => () => {};

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const id = useId();
  return (
    <>
      <IconButton aria-label="Choose theme">
        <M3eMenuTrigger htmlFor={id}><SunIcon aria-hidden="true" /></M3eMenuTrigger>
      </IconButton>
      <M3eMenu id={id} aria-label="Theme">
        {([['system', 'System', MonitorIcon], ['light', 'Light', SunIcon], ['dark', 'Dark', MoonIcon]] as const).map(([value, label, Icon]) => (
          <M3eMenuItemRadio key={value} checked={hydrated && theme === value} onClick={() => setTheme(value)}>
            <Icon slot="icon" aria-hidden="true" />
            {label}
          </M3eMenuItemRadio>
        ))}
      </M3eMenu>
    </>
  );
}

export function DocsLayout({ tree, searchPages, nav, githubUrl, aiChat, children, links = [], tabs, tabMode, versions, sidebar, banner, graph }: DocsLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const collapseButton = useRef<ComponentRef<typeof IconButton>>(null);
  const expandButton = useRef<ComponentRef<typeof IconButton>>(null);
  const mobileButton = useRef<ComponentRef<typeof IconButton>>(null);
  const wasMobileOpen = useRef(false);
  const pathname = usePathname();
  const scope = getSidebarScope(tree, pathname, tabs, versions);
  const hiddenSidebar = collapsed || sidebar?.enabled === false;

  useEffect(() => {
    if (wasMobileOpen.current && !mobileOpen) mobileButton.current?.focus({ preventScroll: true });
    wasMobileOpen.current = mobileOpen;
  }, [mobileOpen]);

  useEffect(() => {
    const scroll = document.getElementById('docs-scroll');
    const update = () => setAtTop((scroll?.scrollTop ?? 0) < 8);
    scroll?.addEventListener('scroll', update, { passive: true });
    const frame = requestAnimationFrame(() => { update(); setMobileOpen(false); });
    return () => { cancelAnimationFrame(frame); scroll?.removeEventListener('scroll', update); };
  }, [pathname]);

  function toggleSidebar(next: boolean) {
    setCollapsed(next);
    requestAnimationFrame(() => (next ? expandButton : collapseButton).current?.focus({ preventScroll: true }));
  }

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(open => !open);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);

  const openSearch = () => { setMobileOpen(false); setSearchOpen(true); };
  const actions = <>
    {aiChat && <Button variant="text" onClick={() => aiChat.onOpenChange(!aiChat.open)}><MessageCircleIcon slot="icon" aria-hidden="true" />Ask AI</Button>}
    <LayoutLinks links={links} secondary />
    {githubUrl && <IconButton className="docs-github-link" href={githubUrl} target="_blank" rel="noreferrer noopener" aria-label="GitHub"><GitHubIcon aria-hidden="true" /></IconButton>}
    <ThemeMenu />
  </>;

  const sidebarContent = (mobile = false) => <>
    {sidebar?.banner}
    <div className="docs-sidebar-search"><SearchTrigger onOpen={openSearch} /></div>
    <SidebarTabs groups={scope.groups} mode={tabMode} onNavigate={mobile ? () => setMobileOpen(false) : undefined} />
    {/* A section or version picker already names the scope; repeat it only when there is none. */}
    {!scope.groups.length && <p className="docs-navigation-label">{scope.tree.name}</p>}
    <Navigation tree={scope.tree} defaultOpenLevel={sidebar?.defaultOpenLevel} onNavigate={mobile ? () => setMobileOpen(false) : undefined} />
    {sidebar?.footer && <div className="docs-sidebar-footer">{sidebar.footer}</div>}
  </>;

  return (
    <TreeContext value={scope.tree}><DocsGraphContext value={graph ?? { nodes: [], links: [] }}>
      <div id="docs-layout" inert={mobileOpen} data-sidebar-collapsed={String(hiddenSidebar)} data-chat-open={String(Boolean(aiChat?.open))}>
        <a className="docs-skip-link" href="#docs-article">Skip to content</a>
        <aside className="docs-sidebar" aria-label="Sidebar" inert={hiddenSidebar}>
          <div className="docs-sidebar-content">
          <div className="docs-sidebar-header">
            <Link href={nav?.url ?? '/'} className="m3-title-medium">{nav?.title}</Link>
            {sidebar?.collapsible !== false && <IconButton ref={collapseButton} aria-label="Collapse sidebar" onClick={() => toggleSidebar(true)}><SidebarIcon aria-hidden="true" /></IconButton>}
          </div>
          {sidebarContent()}
          </div>
        </aside>
        <div className="docs-frame">
          {nav?.enabled !== false && (nav?.component ?? <header className="docs-toolbar" data-transparent={nav?.transparentMode === 'always' || nav?.transparentMode === 'top' && atTop ? 'true' : 'false'}>
            <IconButton ref={mobileButton} className="docs-mobile-nav" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><MenuIcon aria-hidden="true" /></IconButton>
            {collapsed && sidebar?.enabled !== false && <IconButton ref={expandButton} className="docs-expand-sidebar" aria-label="Expand sidebar" onClick={() => toggleSidebar(false)}><SidebarOpenIcon aria-hidden="true" /></IconButton>}
            <Link className="docs-mobile-title m3-title-medium" href={nav?.url ?? '/'}>{nav?.title}</Link>
            <IconButton className="docs-mobile-search" aria-label="Open search" onClick={openSearch}><SearchIcon aria-hidden="true" /></IconButton>
            <LayoutLinks links={links} />
            <div className="docs-header-actions">{actions}</div>
          </header>)}
          {banner}
          <div id="docs-scroll" key={pathname} className="docs-scroll">{children}</div>
        </div>
        {aiChat?.open && <aside className="docs-ai-panel" aria-label="AI assistant">{aiChat.panel}</aside>}
      </div>
      <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen} title={nav?.title} footer={<>
          {aiChat && <Button variant="tonal" onClick={() => { setMobileOpen(false); aiChat.onOpenChange(true); }}><MessageCircleIcon slot="icon" aria-hidden="true" />Ask AI</Button>}
          <ThemeMenu />
          {githubUrl && <IconButton href={githubUrl} target="_blank" rel="noreferrer noopener" aria-label="GitHub"><GitHubIcon /></IconButton>}
        </>}>
        {sidebarContent(true)}
        <LayoutLinks links={links} mobile onNavigate={() => setMobileOpen(false)} />
      </MobileDrawer>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} pages={searchPages} allowedUrls={scope.versionUrls} />
    </DocsGraphContext></TreeContext>
  );
}

export function HomeLayout({ nav, githubUrl, children, links, banner }: BaseLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const trigger = useRef<ComponentRef<typeof IconButton>>(null);
  const pathname = usePathname();
  useEffect(() => {
    const update = () => setAtTop(window.scrollY < 8);
    window.addEventListener('scroll', update, { passive: true });
    const frame = requestAnimationFrame(() => { update(); setMobileOpen(false); });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); };
  }, [pathname]);
  return <>
    <div inert={mobileOpen}>
    {nav?.enabled !== false && (nav?.component ?? <header className="docs-home-header" data-transparent={nav?.transparentMode === 'always' || nav?.transparentMode === 'top' && atTop ? 'true' : 'false'}>
      <Link href={nav?.url ?? '/'} className="m3-title-medium">{nav?.title}</Link>
      <LayoutLinks links={links} />
      <div className="flex items-center gap-2">
        <LayoutLinks links={links} secondary />
        {githubUrl && <IconButton href={githubUrl} aria-label="GitHub"><GitHubIcon /></IconButton>}
        <ThemeMenu />
        <IconButton ref={trigger} className="docs-mobile-nav" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><MenuIcon /></IconButton>
      </div>
    </header>)}
    {banner}{children}
    </div>
    <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen} title={nav?.title} onClosed={() => trigger.current?.focus()} footer={<ThemeMenu />}><LayoutLinks links={links} mobile onNavigate={() => setMobileOpen(false)} /></MobileDrawer>
  </>;
}
