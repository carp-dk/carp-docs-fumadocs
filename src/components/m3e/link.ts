'use client';

import { useRouter } from 'fumadocs-core/framework';
import type { MouseEvent as ReactMouseEvent } from 'react';

/** Use in capture phase, before M3E activates its native link, to preserve SPA navigation. */
export function useAppLink(href?: string) {
  const router = useRouter();
  return (event: Event | ReactMouseEvent) => {
    if (!href?.startsWith('/') || href.startsWith('//') || event.defaultPrevented) return;
    const nativeEvent = 'nativeEvent' in event ? event.nativeEvent : event;
    if (nativeEvent instanceof MouseEvent && (nativeEvent.button !== 0 || nativeEvent.metaKey || nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.shiftKey)) return;
    event.preventDefault();
    router.push(href);
  };
}
