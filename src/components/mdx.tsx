'use client';

import { M3eCard } from '@m3e/react/card';
import { M3eTab, M3eTabPanel } from '@m3e/react/tabs';
import { Tabs as M3eTabs } from './m3e/tabs';
import Link from 'fumadocs-core/link';
import type { MDXComponents } from 'mdx/types';
import { Children, createElement, isValidElement, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { LinkIcon, type MaterialIconName } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { CodeBlock, Pre } from './codeblock';
import { IconButton } from './ui/button';
import { useAppLink } from './m3e/link';
import * as MaterialComponents from './m3e/mdx';
import { ProgressExample } from './m3e/mdx/examples';
import { DynamicCodeBlock } from './codeblock';
import { ImageZoom } from './m3e/mdx/media';
import { Changelog } from './m3e/changelog';
export { Accordion, Accordions } from './m3e/mdx/accordion';
export { Tabs, Tab } from './m3e/mdx/tabs';

// Card icons sit in a tonal container. Without a tone, icons in a card grid cycle through
// the primary, tertiary, success and warning containers (see m3e.css).
export function Card({ title, href, icon, tone, children, className, variant = 'filled' }: { title: ReactNode; href?: string; icon?: ReactNode; tone?: MaterialComponents.ColorTone; children?: ReactNode; className?: string; variant?: 'filled' | 'outlined' | 'elevated' }) {
  const onClick = useAppLink(href);
  const titleId = useId();
  return <M3eCard variant={variant} actionable={Boolean(href)} role={href ? 'link' : undefined} tabIndex={href ? 0 : undefined} aria-labelledby={titleId} href={href} onClickCapture={onClick} className={cn('docs-content-card not-prose', className)}>
    <div slot="content">
      {icon && <span className="docs-card-icon" data-tone={tone}>{typeof icon === 'string' ? <MaterialComponents.Icon name={icon as MaterialIconName} /> : icon}</span>}
      <h3 id={titleId} m3e-toc-ignore="" className="m3-title-medium">{title}</h3>
      {children && <div className="docs-card-description docs-mdx-body">{children}</div>}
    </div>
  </M3eCard>;
}

export function Cards(props: ComponentProps<'div'>) {
  return <div {...props} className={cn('docs-card-grid', props.className)} />;
}

function heading(level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') {
  return function Heading({ children, id, ...props }: ComponentProps<'h2'>) {
    return createElement(level, { ...props, id, className: cn('docs-heading', props.className) },
      id ? <a href={`#${id}`}>{children}</a> : children,
      id && <IconButton className="docs-heading-copy not-prose" aria-label="Copy anchor link" onClick={() => navigator.clipboard.writeText(`${location.origin}${location.pathname}#${id}`)}><LinkIcon aria-hidden="true" /></IconButton>,
    );
  };
}

function MdxPre({ title, children, ...props }: ComponentProps<'pre'>) {
  return <CodeBlock title={title}><Pre {...props}>{children}</Pre></CodeBlock>;
}

// A table wider than the page scrolls; it then takes keyboard focus so it can be scrolled
// without a pointer.
function Table(props: ComponentProps<'table'>) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setScrollable(element.scrollWidth > element.clientWidth + 1));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="docs-table-scroll" tabIndex={scrollable ? 0 : undefined} role={scrollable ? 'region' : undefined} aria-label={scrollable ? 'Scrollable table' : undefined}><table {...props} /></div>;
}

const calloutTypes = {
  info: { icon: 'Info', title: 'Note' },
  tip: { icon: 'Lightbulb', title: 'Tip' },
  success: { icon: 'CheckCircle', title: 'Success' },
  warn: { icon: 'Warning', title: 'Warning' },
  warning: { icon: 'Warning', title: 'Warning' },
  error: { icon: 'Error', title: 'Error' },
} satisfies Record<string, { icon: MaterialIconName; title: string }>;

type CalloutKind = Exclude<keyof typeof calloutTypes, 'warn'>;
// MDX props are not type-checked: map Fumadocs aliases and unknown types to a styled kind.
function calloutKind(type?: string): CalloutKind {
  const kind = type === 'warn' ? 'warning' : type === 'idea' ? 'tip' : type ?? 'info';
  return Object.hasOwn(calloutTypes, kind) ? kind as CalloutKind : 'info';
}

export function Callout({ title, type, children, actions }: { title?: ReactNode; type?: keyof typeof calloutTypes | 'idea'; children: ReactNode; actions?: ReactNode }) {
  const kind = calloutKind(type);
  const appearance = calloutTypes[kind];
  const titleId = useId();
  return <M3eCard variant="filled" className="docs-callout not-prose" data-type={kind} data-tone={kind} role="note" aria-labelledby={titleId}>
    <div slot="content" className="docs-callout-content">
      <MaterialComponents.Icon name={appearance.icon} className="docs-callout-icon" />
      <div className="docs-callout-text"><p id={titleId} className="docs-callout-title">{title ?? appearance.title}</p><div className="docs-mdx-body">{children}</div></div>
      {actions && <div className="docs-callout-actions">{actions}</div>}
    </div>
  </M3eCard>;
}

// Fumadocs' npm remark plugin emits this component API for package-manager tabs.
export function CodeBlockTabs({ children, defaultValue }: { children: ReactNode; defaultValue?: string }) {
  const id = useId();
  const elements = Children.toArray(children).filter(isValidElement<{ children?: ReactNode; value?: string }>);
  const list = elements.find(element => element.type === CodeBlockTabsList);
  const triggers = Children.toArray(list?.props.children).filter(isValidElement<{ children?: ReactNode; value: string }>);
  const panels = elements.filter(element => element.type === CodeBlockTab);
  const selectedIndex = Math.max(0, triggers.findIndex(trigger => trigger.props.value === defaultValue));
  return <M3eTabs selectedIndex={selectedIndex} variant="secondary" aria-label="Code language" className="docs-code-tabs not-prose">
    {triggers.map(trigger => <M3eTab key={trigger.props.value} id={`${id}-${trigger.props.value}-tab`} htmlFor={`${id}-${trigger.props.value}`}>{trigger.props.children}</M3eTab>)}
    {panels.map(panel => <M3eTabPanel key={panel.props.value} id={`${id}-${panel.props.value}`} aria-labelledby={`${id}-${panel.props.value}-tab`} slot="panel">{panel.props.children}</M3eTabPanel>)}
  </M3eTabs>;
}

export function CodeBlockTabsList({ children }: { children: ReactNode }) { return <>{children}</>; }
export function CodeBlockTabsTrigger({ children }: { value: string; children: ReactNode }) { return <>{children}</>; }
export function CodeBlockTab({ children }: { value: string; children: ReactNode }) { return <>{children}</>; }

const headings = { h1: heading('h1'), h2: heading('h2'), h3: heading('h3'), h4: heading('h4'), h5: heading('h5'), h6: heading('h6') };

export function getMDXComponents(components?: MDXComponents) {
  return {
    a: Link,
    ...headings,
    pre: MdxPre,
    table: Table,
    img: ImageZoom,
    CodeBlock, Pre, DynamicCodeBlock,
    Card, Cards, Callout,
    ...MaterialComponents,
    ProgressExample,
    CodeBlockTabs, CodeBlockTabsList, CodeBlockTabsTrigger, CodeBlockTab,
    Changelog,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
