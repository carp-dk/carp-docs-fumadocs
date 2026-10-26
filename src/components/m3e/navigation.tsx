'use client';

import { M3eMenu, M3eMenuItem, M3eMenuTrigger } from '@m3e/react/menu';
import { M3eNavMenu, M3eNavMenuItem } from '@m3e/react/nav-menu';
import { usePathname } from 'fumadocs-core/framework';
import Link from 'fumadocs-core/link';
import { useEffect, useId, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Button, Tooltip } from './mdx/actions';
import { CheckIcon, ChevronDownIcon, ExternalLinkIcon, FileTextIcon, FolderIcon } from '@/components/ui/icons';
import { useAppLink } from './link';
import { cn } from '@/lib/cn';
import { IconButton as NativeIconButton } from '../ui/button';

interface LinkBase { text: string; icon?: ReactNode; secondary?: boolean; on?: 'all' | 'nav' | 'menu' }
export interface NavigationLink extends LinkBase { type?: 'main' | 'icon'; url: string; label?: string; active?: 'url' | 'nested-url' | 'none'; external?: boolean; description?: string; /** A short tag beside the text in menus, such as a package name. */ badge?: string }
export interface NavigationMenu extends LinkBase { type: 'menu'; variant?: 'menu' | 'navigation'; items: NavigationLink[] }
export interface NavigationCustom { type: 'custom'; children: ReactNode; secondary?: boolean; on?: 'all' | 'nav' | 'menu' }
export type LinkItemType = NavigationLink | NavigationMenu | NavigationCustom;
export interface NavOptions { title?: ReactNode; url?: string; enabled?: boolean; component?: ReactNode; transparentMode?: 'always' | 'top' | 'none' }

export const isActiveLink = (link: NavigationLink, pathname: string) => link.active !== 'none' && (pathname === link.url || link.active === 'nested-url' && pathname.startsWith(`${link.url.replace(/\/$/, '')}/`));

function MenuLink({ item, onNavigate }: { item: NavigationLink; onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = !item.external && isActiveLink(item, pathname);
  const navigate = useAppLink(item.external ? undefined : item.url);
  return <M3eMenuItem href={item.url} aria-current={current ? 'page' : undefined} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined} onClickCapture={event => {
    navigate(event);
    if (event.defaultPrevented) (event.currentTarget as ComponentRef<typeof M3eMenuItem>).menu?.hideAll(true);
    onNavigate?.();
  }}>
    {item.icon && <span slot="icon">{item.icon}</span>}
    <span className="docs-menu-link-text"><span className="docs-menu-link-title"><span>{item.text}</span>{item.badge && <span className="docs-menu-link-badge">{item.badge}</span>}</span>{item.description && <span className="docs-menu-link-description">{item.description}</span>}</span>
    {item.external ? <ExternalLinkIcon slot="trailing-icon" /> : current && <CheckIcon slot="trailing-icon" />}
  </M3eMenuItem>;
}

function LayoutLink({ item }: { item: NavigationLink }) {
  const pathname = usePathname();
  const selected = isActiveLink(item, pathname);
  const navigate = useAppLink(item.external ? undefined : item.url);
  const destination = { href: item.url, target: item.external ? '_blank' : undefined, rel: item.external ? 'noopener noreferrer' : undefined };
  if (item.type === 'icon') return <Tooltip content={item.label ?? item.text} position="below"><NativeIconButton {...destination} aria-label={item.label ?? item.text} className="docs-nav-icon" onClickCapture={navigate}>{item.icon ?? <ExternalLinkIcon />}</NativeIconButton></Tooltip>;
  return <Button {...destination} aria-label={item.label ?? item.text} className="docs-layout-link" variant={selected ? 'tonal' : 'text'} aria-current={selected ? 'page' : undefined} data-current={String(selected)}>
    {item.icon && <span slot="icon">{item.icon}</span>}<span>{item.text}</span>
  </Button>;
}

// In the mobile drawer the site links share the page list's structure: top-level rows
// with a leading icon, and each menu as a folder of text-only rows on a guide line.
// Icon-only header links get their text label here.
function DrawerLink({ item, nested, onNavigate }: { item: NavigationLink; nested?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const id = useId();
  const selected = !item.external && isActiveLink(item, pathname);
  return <M3eNavMenuItem selected={selected} data-current={String(selected)} aria-labelledby={id}>
    {!nested && <span slot="icon" aria-hidden="true">{item.icon ?? <FileTextIcon />}</span>}
    <Link id={id} slot="label" href={item.url} external={item.external} tabIndex={-1} aria-current={selected ? 'page' : undefined} onClick={onNavigate}>{item.text}</Link>
    {item.external && <ExternalLinkIcon slot="badge" aria-hidden="true" className="docs-nav-external" />}
  </M3eNavMenuItem>;
}

function DrawerMenu({ item, onNavigate }: { item: NavigationMenu; onNavigate?: () => void }) {
  const pathname = usePathname();
  const id = useId();
  return <M3eNavMenuItem className="docs-nav-folder" open={item.items.some(link => !link.external && isActiveLink(link, pathname))} aria-labelledby={id}>
    <span slot="icon" aria-hidden="true">{item.icon ?? <FolderIcon />}</span>
    <span slot="label" id={id}>{item.text}</span>
    <ChevronDownIcon slot="toggle-icon" aria-hidden="true" />
    {item.items.map(link => <DrawerLink key={link.url} item={link} nested onNavigate={onNavigate} />)}
  </M3eNavMenuItem>;
}

function LayoutMenu({ item, children, className }: { item: NavigationMenu; children?: ReactNode; className?: string }) {
  const id = useId();
  return <>
    <Button variant="text" className="docs-layout-link"><M3eMenuTrigger htmlFor={id}><span className="docs-menu-trigger-label">{item.text}<ChevronDownIcon /></span></M3eMenuTrigger></Button>
    <M3eMenu id={id} aria-label={item.text} className={cn(item.variant === 'navigation' ? 'docs-navbar-mega-menu' : 'docs-navbar-menu', className)}>
      <div className={item.variant === 'navigation' ? 'docs-mega-menu-grid' : 'docs-menu-list'}>{children ?? item.items.map(link => <MenuLink key={link.url} item={link} />)}</div>
    </M3eMenu>
  </>;
}


// Desktop links fill the space beside the header actions. Those that do not fit move, from the
// end, into a trailing "More" menu, where a navbar menu becomes a submenu. Widths are measured
// while every link is shown and remembered for links that are later hidden.
function OverflowLinks({ items, label }: { items: (NavigationLink | NavigationMenu)[]; label: string }) {
  const id = useId();
  const nav = useRef<HTMLElement>(null);
  const widths = useRef<number[]>([]);
  const moreWidth = useRef(0);
  const [shown, setShown] = useState(items.length);
  useEffect(() => {
    const element = nav.current;
    if (!element) return;
    const fit = () => {
      const slots = [...element.querySelectorAll<HTMLElement>(':scope > [data-overflow-index]')];
      slots.forEach(slot => { if (!slot.hidden) widths.current[Number(slot.dataset.overflowIndex)] = slot.getBoundingClientRect().width; });
      const more = element.querySelector<HTMLElement>(':scope > .docs-navbar-more');
      if (more && !more.hidden) moreWidth.current = more.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
      const span = (count: number) => widths.current.slice(0, count).reduce((total, width) => total + width, 0) + gap * Math.max(0, count - 1);
      let next = items.length;
      if (span(items.length) > element.clientWidth) {
        next = 0;
        while (next < items.length && span(next + 1) + gap + (moreWidth.current || 96) <= element.clientWidth) next++;
      }
      setShown(next);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    void document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [items.length]);
  const hidden = items.slice(shown);
  return <nav ref={nav} aria-label={label} className="docs-navbar-links" data-overflow="true">
    {items.map((item, index) => <span key={item.type === 'menu' ? item.text : item.url} className="docs-navbar-slot" data-overflow-index={index} hidden={index >= shown}>
      {item.type === 'menu' ? <LayoutMenu item={item} /> : <LayoutLink item={item} />}
    </span>)}
    <span className="docs-navbar-slot docs-navbar-more" hidden={!hidden.length}>
      {/* A navbar menu becomes an item that opens its links as a submenu. Submenus sit beside
          the More menu, not inside it, so M3E finds only the More menu's own items. M3E reads
          its items once, so the menu remounts when the overflowing set changes. */}
      <LayoutMenu key={shown} item={{ type: 'menu', text: 'More', items: [] }} className="docs-more-menu">
        {hidden.map((item, index) => item.type === 'menu'
          ? <M3eMenuItem key={item.text}><M3eMenuTrigger htmlFor={`${id}-${index}`}>{item.text}</M3eMenuTrigger></M3eMenuItem>
          : <MenuLink key={item.url} item={item} />)}
      </LayoutMenu>
      {hidden.map((item, index) => item.type === 'menu' && <M3eMenu key={item.text} id={`${id}-${index}`} aria-label={item.text} className="docs-navbar-menu">
        <div className="docs-menu-list">{item.items.map(link => <MenuLink key={link.url} item={link} />)}</div>
      </M3eMenu>)}
    </span>
  </nav>;
}

export function LayoutLinks({ links = [], mobile = false, secondary = false, onNavigate }: { links?: LinkItemType[]; mobile?: boolean; secondary?: boolean; onNavigate?: () => void }) {
  const visible = links.filter(item => (mobile ? item.on !== 'nav' : item.on !== 'menu') && (mobile || Boolean(item.secondary ?? item.type === 'icon') === secondary));
  if (!visible.length) return null;
  if (mobile) {
    const custom = visible.filter(item => item.type === 'custom');
    return <nav aria-label="Site navigation" className="docs-mobile-layout-links">
      <M3eNavMenu className="docs-navigation" aria-label="Site links">{visible.map(item => item.type === 'custom' ? null : item.type === 'menu' ? <DrawerMenu key={item.text} item={item} onNavigate={onNavigate} /> : <DrawerLink key={item.url} item={item} onNavigate={onNavigate} />)}</M3eNavMenu>
      {custom.map((item, index) => <span key={index} className="docs-custom-link">{item.children}</span>)}
    </nav>;
  }
  if (!secondary && visible.every(item => item.type !== 'custom')) return <OverflowLinks items={visible as (NavigationLink | NavigationMenu)[]} label="Site navigation" />;
  return <nav aria-label={secondary ? 'Quick links' : 'Site navigation'} className="docs-navbar-links">
    {visible.map((item, index) => item.type === 'custom' ? <span key={index} className="docs-custom-link">{item.children}</span> : item.type === 'menu' ? <LayoutMenu key={item.text} item={item} /> : <LayoutLink key={item.url} item={item} />)}
  </nav>;
}
