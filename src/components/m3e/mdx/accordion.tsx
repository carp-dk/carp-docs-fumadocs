'use client';

import { M3eAccordion, M3eExpansionPanel } from '@m3e/react/expansion-panel';
import type { ComponentProps, ComponentRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ChevronDownIcon, type MaterialIconName } from '@/components/ui/icons';
import { Icon } from './actions';

export function Accordion({ title, description, icon, children, defaultOpen, open, onOpenChange, className, ...props }: Omit<ComponentProps<typeof M3eExpansionPanel>, 'title' | 'children'> & {
  title: ReactNode; description?: string; icon?: MaterialIconName; children: ReactNode; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
}) {
  return <M3eExpansionPanel {...props} open={open ?? defaultOpen} className={cn('docs-accordion', className)} onOpening={event => {
    props.onOpening?.(event); onOpenChange?.((event.currentTarget as ComponentRef<typeof M3eExpansionPanel>).open);
  }} onClosing={event => { props.onClosing?.(event); onOpenChange?.(false); }}>
    <span slot="header" className="docs-accordion-heading">{icon && <Icon name={icon} />}<span><span className="docs-accordion-title">{title}</span>{description && <span className="docs-accordion-description">{description}</span>}</span></span>
    {/* Slotted so the open state can colour it; M3E still rotates it. */}
    <ChevronDownIcon slot="toggle-icon" />
    <div className="docs-mdx-body prose m3-prose">{children}</div>
  </M3eExpansionPanel>;
}

export function Accordions({ children, type = 'single', className, ...props }: ComponentProps<typeof M3eAccordion> & { type?: 'single' | 'multiple' }) {
  return <M3eAccordion {...props} multi={type === 'multiple'} className={cn('docs-accordions not-prose', className)}>{children}</M3eAccordion>;
}
