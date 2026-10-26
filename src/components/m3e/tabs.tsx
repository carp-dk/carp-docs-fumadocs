'use client';

import { M3eTabs } from '@m3e/react/tabs';
import { useEffect, useRef, type ComponentProps, type ComponentRef } from 'react';

export function Tabs(props: ComponentProps<typeof M3eTabs>) {
  const ref = useRef<ComponentRef<typeof M3eTabs>>(null);

  useEffect(() => {
    const tabs = ref.current;
    if (!tabs || props.disablePagination !== undefined) return;
    let active = true;
    let frame = 0;
    // Measure against the whole header: paginator buttons otherwise reduce the
    // available width and can keep themselves visible after the tabs fit again.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = tabs.clientWidth;
        const contentWidth = tabs.tabs.reduce((sum, tab) => sum + tab.getBoundingClientRect().width, 0);
        if (width && contentWidth) tabs.disablePagination = contentWidth <= width + 1;
      });
    });
    void (async () => {
      await tabs.updateComplete;
      if (!active) return;
      observer.observe(tabs);
      tabs.tabs.forEach(tab => observer.observe(tab));
    })();
    return () => { active = false; observer.disconnect(); cancelAnimationFrame(frame); };
  }, [props.children, props.disablePagination]);

  useEffect(() => {
    let active = true;
    const tabs = ref.current;
    if (!tabs) return;

    // React assigns panel IDs after the custom elements connect. Refresh once
    // their public update promises settle so the initial selected panel renders.
    void (async () => {
      await tabs.updateComplete;
      const items = [...tabs.querySelectorAll('m3e-tab')];
      await Promise.all(items.map(tab => tab.updateComplete));
      if (!active) return;
      // The parent can receive selectedIndex before its slot has any items.
      // Initialize the child selection as well; the selection manager adopts it.
      items.forEach((tab, index) => { tab.selected = index === (props.selectedIndex ?? 0); });
      tabs.requestUpdate();
    })();

    return () => { active = false; };
  }, [props.selectedIndex]);

  return <M3eTabs role="group" {...props} ref={ref} />;
}
