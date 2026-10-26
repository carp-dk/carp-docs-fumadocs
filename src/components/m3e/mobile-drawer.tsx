'use client';

import { M3eDrawerContainer } from '@m3e/react/drawer-container';
import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { IconButton } from './mdx/actions';

export function MobileDrawer({ open, onOpenChange, title, children, footer, onClosed }: { open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; children: ReactNode; footer?: ReactNode; onClosed?: () => void }) {
  const wasOpen = useRef(false);
  const drawer = useRef<ComponentRef<typeof M3eDrawerContainer>>(null);
  const closeButton = useRef<ComponentRef<typeof IconButton>>(null);
  useEffect(() => {
    if (!open) return;
    let current = true;
    let frame = 0;
    const focusWhenVisible = () => {
      const button = closeButton.current;
      if (!current || !button) return;
      // The drawer's CSS visibility transition can outlive Lit's update promise.
      if (getComputedStyle(button).visibility !== 'visible') {
        frame = requestAnimationFrame(focusWhenVisible);
        return;
      }
      button.focus({ preventScroll: true });
    };
    void (async () => {
      // Wait until the native drawer has made its previously hidden slot visible.
      await drawer.current?.updateComplete;
      await closeButton.current?.updateComplete;
      if (current) frame = requestAnimationFrame(focusWhenVisible);
    })();
    return () => { current = false; cancelAnimationFrame(frame); };
  }, [open]);
  useEffect(() => {
    const justClosed = wasOpen.current && !open;
    wasOpen.current = open;
    if (!justClosed) return;
    const frame = requestAnimationFrame(() => onClosed?.());
    return () => cancelAnimationFrame(frame);
  }, [open, onClosed]);
  useEffect(() => {
    const media = matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (media.matches) onOpenChange(false); };
    media.addEventListener('change', closeOnDesktop);
    return () => { media.removeEventListener('change', closeOnDesktop); };
  }, [onOpenChange]);
  return <M3eDrawerContainer ref={drawer} start={open} startMode="over" className="docs-mobile-drawer" data-open={String(open)} onKeyDown={event => {
    if (open && event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); onOpenChange(false); }
  }} onChange={event => {
    if (event.target !== event.currentTarget) return;
    const next = (event.currentTarget as ComponentRef<typeof M3eDrawerContainer>).start;
    onOpenChange(next);
  }}>
    <aside slot="start" className="docs-mobile-drawer-panel" role="dialog" aria-modal={open || undefined} aria-label="Mobile navigation">
      <div className="docs-mobile-drawer-header"><span className="m3-title-medium">{title}</span><IconButton ref={closeButton} icon="X" label="Close navigation" onClick={() => onOpenChange(false)} /></div>
      <div className="docs-mobile-drawer-body">{children}</div>
      {footer && <div className="docs-mobile-drawer-footer">{footer}</div>}
    </aside>
  </M3eDrawerContainer>;
}
