'use client';

import { M3eBadge } from '@m3e/react/badge';
import { M3eDivider } from '@m3e/react/divider';
import { M3eActionList, M3eListAction, M3eListItem } from '@m3e/react/list';
import { M3eCircularProgressIndicator, M3eLinearProgressIndicator } from '@m3e/react/progress-indicator';
import { M3eLoadingIndicator } from '@m3e/react/loading-indicator';
import { M3eSkeleton } from '@m3e/react/skeleton';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { MaterialIconName } from '@/components/ui/icons';
import { useAppLink } from '../link';
import { Icon } from './actions';
import { useReducedMotion } from './use-reduced-motion';

export function Badge({ tone = 'primary', className, ...props }: ComponentProps<typeof M3eBadge> & { tone?: 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'info' | 'success' | 'warning' | 'error' }) {
  return <M3eBadge size="large" {...props} data-tone={tone} className={cn('docs-mdx-badge not-prose', className)} />;
}

export function Divider({ className, ...props }: ComponentProps<typeof M3eDivider>) {
  return <M3eDivider {...props} className={cn('docs-mdx-divider not-prose', className)} />;
}

export function List({ label, className, ...props }: Omit<ComponentProps<typeof M3eActionList>, 'aria-label'> & { label: string }) {
  return <M3eActionList {...props} aria-label={label} className={cn('docs-mdx-list not-prose', className)} />;
}

export function ListItem({ title, description, icon, href, children }: { title: string; description?: string; icon?: MaterialIconName; href?: string; children?: ReactNode }) {
  const navigate = useAppLink(href);
  const content = <>
    {icon && <span slot="leading" className="docs-mdx-list-icon"><Icon name={icon} /></span>}
    <span className="docs-mdx-list-title">{title}</span>
    {description && <span slot="supporting-text" className="docs-mdx-list-description">{description}</span>}
    {children && <span slot="trailing">{children}</span>}
  </>;
  return href ? <M3eListAction href={href} onClickCapture={navigate}>{content}</M3eListAction> : <M3eListItem>{content}</M3eListItem>;
}

export function Progress({ label, value, max = 100, variant = 'wavy', circular = false }: { label: string; value?: number; max?: number; variant?: 'flat' | 'wavy'; circular?: boolean }) {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const appearance = reducedMotion ? 'flat' : variant;
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const amount = value === undefined ? undefined : Math.max(0, Math.min(limit, Number.isFinite(value) ? value : 0));
  return <div className={cn('docs-mdx-progress not-prose', circular && 'docs-mdx-progress-circular')}>
    <div className="docs-mdx-progress-label"><span id={id}>{label}</span>{amount !== undefined && <span aria-hidden="true">{Math.round(amount / limit * 100)}%</span>}</div>
    {reducedMotion && amount === undefined
      ? <span role="progressbar" aria-labelledby={id} aria-valuemin={0} aria-valuemax={limit} className="docs-mdx-progress-static"><Icon name="RefreshCw" /></span>
      : circular
        ? <M3eCircularProgressIndicator aria-labelledby={id} value={amount ?? 0} max={limit} indeterminate={amount === undefined} variant={appearance} />
        : <M3eLinearProgressIndicator aria-labelledby={id} value={amount ?? 0} max={limit} mode={amount === undefined ? 'indeterminate' : 'determinate'} variant={appearance} />}
  </div>;
}

export function LoadingIndicator({ label = 'Loading' }: { label?: string }) {
  return <div className="docs-mdx-loading not-prose" role="status"><M3eLoadingIndicator aria-hidden="true" /><Icon name="RefreshCw" className="docs-mdx-loading-static" /><span>{label}</span></div>;
}

export function Skeleton({ lines = 3, label = 'Loading content', animation = 'wave' }: { lines?: number; label?: string; animation?: 'pulse' | 'wave' | 'none' }) {
  const count = Math.max(1, Math.min(8, Math.floor(Number.isFinite(lines) ? lines : 3)));
  return <div className="docs-mdx-skeleton not-prose" role="status" aria-label={label}>
    <M3eSkeleton animation={animation} shape="rounded">{Array.from({ length: count }, (_, index) => <div key={index} aria-hidden="true" className="docs-mdx-skeleton-line" />)}</M3eSkeleton>
  </div>;
}
