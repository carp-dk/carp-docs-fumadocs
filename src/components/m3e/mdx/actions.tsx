'use client';

import { M3eButtonGroup } from '@m3e/react/button-group';
import { M3eAssistChip } from '@m3e/react/chips';
import { M3eDialog } from '@m3e/react/dialog';
import { M3eTooltip } from '@m3e/react/tooltip';
import { M3eAriaDescriber } from '@m3e/web/core/a11y';
import { useEffect, useId, useRef, useState, type ComponentProps, type ComponentRef, type ReactElement, type ReactNode } from 'react';
import { Button as BaseButton, IconButton as BaseIconButton, linkRole } from '@/components/ui/button';
import { materialIcons, type MaterialIconName } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { useAppLink } from '../link';
import type { ColorTone } from './color';

export function Icon({ name, label, tone = 'inherit', ...props }: Omit<ComponentProps<'svg'>, 'name'> & { name: MaterialIconName; label?: string; tone?: ColorTone | 'inherit' }) {
  const Symbol = materialIcons[name];
  if (!Symbol) return null;
  return <Symbol {...props} data-tone={tone === 'inherit' ? undefined : tone} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn('docs-mdx-icon', props.className)} />;
}

export function Button({ icon, children, onClickCapture, ...props }: ComponentProps<typeof BaseButton> & { icon?: MaterialIconName }) {
  const navigate = useAppLink(props.target || props.download ? undefined : props.href);
  return <BaseButton {...props} aria-label={props['aria-label'] ?? (typeof children === 'string' ? children : undefined)} onClickCapture={event => { onClickCapture?.(event); navigate(event); }}>
    {icon && <Icon name={icon} slot="icon" />}{children}
  </BaseButton>;
}

export function IconButton({ icon, label, onClickCapture, ...props }: Omit<ComponentProps<typeof BaseIconButton>, 'children' | 'aria-label'> & { icon: MaterialIconName; label: string }) {
  const navigate = useAppLink(props.target || props.download ? undefined : props.href);
  return <BaseIconButton {...props} aria-label={label} onClickCapture={event => { onClickCapture?.(event); navigate(event); }}><Icon name={icon} /></BaseIconButton>;
}

export function ButtonGroup({ className, ...props }: ComponentProps<typeof M3eButtonGroup>) {
  return <M3eButtonGroup size="small" {...props} className={cn('docs-mdx-button-group not-prose', className)} />;
}

export function Chip({ icon, children, className, onClickCapture, tone = 'secondary', ...props }: ComponentProps<typeof M3eAssistChip> & { icon?: MaterialIconName; tone?: ColorTone }) {
  const navigate = useAppLink(props.target || props.download ? undefined : props.href);
  return <M3eAssistChip type="button" variant="elevated" {...linkRole(props.href)} {...props} data-tone={tone} className={cn('docs-mdx-chip not-prose', className)} onClickCapture={event => { onClickCapture?.(event); navigate(event); }}>
    {icon && <Icon name={icon} slot="icon" />}{children}
  </M3eAssistChip>;
}

export function Chips({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('docs-mdx-chips not-prose', className)} />;
}

export function Tooltip({ content, children, position = 'above' }: { content: string; children: ReactElement; position?: ComponentProps<typeof M3eTooltip>['position'] }) {
  const wrapper = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<ComponentRef<typeof M3eTooltip>>(null);
  useEffect(() => {
    let current = true;
    let attached = false;
    const control = wrapper.current?.firstElementChild;
    const element = tooltip.current;
    // Associate the actual focusable control after hydration; keep its ref and handlers.
    if (!(control instanceof HTMLElement) || !element) return;
    void (async () => {
      // M3E needs its first render before attach/detach can access the popover.
      await element.updateComplete;
      if (!current) return;
      element.attach(control);
      attached = true;
      // M3E always adds the tooltip as a description; drop it when it repeats the control's name.
      if (control.getAttribute('aria-label') === content) M3eAriaDescriber.removeDescription(control, content);
    })();
    return () => { current = false; if (attached) element.detach(); };
  }, [children, content]);
  return <span ref={wrapper} className="docs-mdx-tooltip not-prose">{children}<M3eTooltip ref={tooltip} position={position}>{content}</M3eTooltip></span>;
}

// M3E reveals a dialog through a visibility transition, so its content cannot take focus
// until a frame or two after `opened`. Retry briefly until the element accepts focus.
function focusWhenShown(element: HTMLElement | null | undefined, frames = 30) {
  if (!element || frames === 0) return;
  element.focus();
  if (document.activeElement !== element) requestAnimationFrame(() => focusWhenShown(element, frames - 1));
}

// A Material basic dialog: headline, supporting text and end-aligned text actions. It has
// no close icon; the action, Escape and the scrim dismiss it. Focus moves to the action on
// open and M3E returns it to the trigger on close.
export function Dialog({ title, trigger, children, closeLabel = 'Got it' }: { title: string; trigger: string; children: ReactNode; closeLabel?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const actions = useRef<HTMLDivElement>(null);
  return <span className="docs-mdx-dialog-trigger not-prose">
    <Button variant="tonal" aria-haspopup="dialog" aria-controls={id} onClick={() => setOpen(true)}>{trigger}</Button>
    <M3eDialog id={id} open={open} onOpened={() => focusWhenShown(actions.current?.querySelector<HTMLElement>('m3e-button'))} onClosed={() => setOpen(false)} className="docs-mdx-dialog">
      <span slot="header">{title}</span>
      <div className="docs-mdx-body">{children}</div>
      <div ref={actions} slot="actions" className="docs-mdx-dialog-actions"><Button onClick={() => setOpen(false)}>{closeLabel}</Button></div>
    </M3eDialog>
  </span>;
}
