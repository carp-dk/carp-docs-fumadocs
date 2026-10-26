'use client';

import { M3eTree, M3eTreeItem } from '@m3e/react/tree';
import { M3eCard } from '@m3e/react/card';
import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import Link from 'fumadocs-core/link';
import type { TOCItemType } from 'fumadocs-core/toc';
import type { MaterialIconName } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { Icon, IconButton } from './actions';
import { Accordion } from './accordion';
import { Badge } from './content';
import { useStoredPreference } from './preferences';
import { usePageTOC } from '../page-context';

export function Files({ children, className, ...props }: ComponentProps<typeof M3eTree>) {
  return <M3eTree aria-label="File structure" {...props} className={cn('docs-files not-prose', className)}>{children}</M3eTree>;
}

export function File({ name, icon = 'FileText', href }: { name: string; icon?: MaterialIconName | ReactNode; href?: string }) {
  const id = useId();
  return <M3eTreeItem aria-labelledby={id}><span slot="icon" aria-hidden="true">{typeof icon === 'string' ? <Icon name={icon as MaterialIconName} /> : icon}</span>{href ? <Link slot="label" id={id} href={href} tabIndex={-1}>{name}</Link> : <span slot="label" id={id}>{name}</span>}</M3eTreeItem>;
}

export function Folder({ name, children, defaultOpen, disabled }: { name: string; children?: ReactNode; defaultOpen?: boolean; disabled?: boolean }) {
  const id = useId();
  return <M3eTreeItem open={defaultOpen} disabled={disabled} aria-labelledby={id}><Icon name="Folder" slot="icon" /><span id={id} slot="label">{name}</span>{children}</M3eTreeItem>;
}

export function Banner({ id, children, variant = 'normal', icon = 'Info', className }: { id?: string; children: ReactNode; variant?: 'normal' | 'rainbow'; icon?: MaterialIconName; className?: string }) {
  const [saved, save] = useStoredPreference(id ? `docs-banner:${id}` : undefined, true);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || saved === 'dismissed') return null;
  return <div role="note" className={cn('docs-banner not-prose', variant === 'rainbow' && 'docs-banner-expressive', className)}>
    <Icon name={icon} /><div className="docs-mdx-body">{children}</div>{id && <IconButton icon="X" label="Dismiss announcement" size="extra-small" onClick={() => { save('dismissed'); setDismissed(true); }} />}
  </div>;
}

export function InlineTOC({ items, children = 'On this page', ...props }: Omit<ComponentProps<typeof Accordion>, 'title' | 'children'> & { items?: TOCItemType[]; children?: ReactNode }) {
  const context = usePageTOC();
  const toc = items ?? context;
  if (!toc.length) return null;
  const min = Math.min(...toc.map(item => item.depth));
  return <Accordion {...props} title={children} icon="Menu" className={cn('docs-inline-toc not-prose', props.className)}>
    <nav aria-label="Contents of this page"><ol>{toc.map(item => <li key={item.url} style={{ paddingInlineStart: `${(item.depth - min) * 12}px` }}><a href={item.url}>{item.title}</a></li>)}</ol></nav>
  </Accordion>;
}

export interface TypeProperty {
  type: ReactNode; description?: ReactNode; typeDescription?: ReactNode; typeDescriptionLink?: string; default?: ReactNode; required?: boolean; deprecated?: boolean;
  parameters?: { name: string; type: ReactNode; description?: ReactNode }[]; returns?: ReactNode;
}

export function TypeTable({ type, title = 'Properties', id }: { type: Record<string, TypeProperty>; title?: string; id?: string }) {
  const generatedId = useId();
  return <div className="docs-type-table docs-table-scroll not-prose" id={id}>
    <table><caption className="sr-only">{title}</caption><thead><tr><th scope="col">Property</th><th scope="col">Type</th><th scope="col">Description</th><th scope="col">Default</th></tr></thead>
      <tbody>{Object.entries(type).map(([name, property]) => <tr key={name} id={`${id ?? generatedId}-${name}`}>
        <th scope="row"><code>{name}{property.required ? '' : '?'}</code>{property.required && <Badge tone="secondary" className="docs-property-badge">Required</Badge>}{property.deprecated && <Badge tone="warning" className="docs-property-badge">Deprecated</Badge>}</th>
        <td><div className="docs-type-signature">{property.typeDescriptionLink ? <Link href={property.typeDescriptionLink}>{property.type}</Link> : property.type}</div>{property.typeDescription && <details><summary>Type details</summary>{property.typeDescription}</details>}</td>
        <td className="docs-mdx-body">{property.description ?? '—'}{property.parameters && <ul>{property.parameters.map(param => <li key={param.name}><code>{param.name}</code>: {param.type}{param.description && <> — {param.description}</>}</li>)}</ul>}{property.returns && <p>Returns: {property.returns}</p>}</td>
        <td>{property.default !== undefined ? <div className="docs-type-signature">{property.default}</div> : '—'}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function Steps({ children, ...props }: ComponentProps<'ol'>) {
  return <ol {...props} className={cn('docs-static-steps not-prose', props.className)}>{children}</ol>;
}

export function Preview({ title = 'Preview', children, className, align = 'center' }: { title?: string; children: ReactNode; className?: string; align?: 'center' | 'start' }) {
  const id = useId();
  return <M3eCard variant="outlined" role="region" aria-labelledby={id} data-align={align} className={cn('docs-preview not-prose', className)}>
    <div className="docs-preview-shell">
      <div id={id} className="docs-preview-label"><Icon name="SquarePen" />{title}</div>
      <div className="docs-preview-canvas"><div className="docs-preview-content docs-mdx-body">{children}</div></div>
    </div>
  </M3eCard>;
}
