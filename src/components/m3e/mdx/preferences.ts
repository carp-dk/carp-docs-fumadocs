import { useCallback, useSyncExternalStore } from 'react';

const memory = new Map<string, string>();
const eventName = 'docs-preference-change';

export function useStoredPreference(key?: string, persistent = false) {
  const storageKey = `${persistent ? 'local' : 'session'}:${key}`;
  const subscribe = useCallback((notify: () => void) => {
    if (!key) return () => {};
    const onStorage = (event: StorageEvent) => { if (event.key === key) { memory.delete(storageKey); notify(); } };
    window.addEventListener(eventName, notify);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener(eventName, notify); window.removeEventListener('storage', onStorage); };
  }, [key, storageKey]);
  const snapshot = useCallback(() => {
    if (!key) return null;
    if (memory.has(storageKey)) return memory.get(storageKey)!;
    try { return (persistent ? localStorage : sessionStorage).getItem(key); } catch { return null; }
  }, [key, persistent, storageKey]);
  const value = useSyncExternalStore(subscribe, snapshot, () => null);
  const setValue = useCallback((next: string) => {
    if (!key) return;
    memory.set(storageKey, next);
    try { (persistent ? localStorage : sessionStorage).setItem(key, next); } catch { /* Still works in memory when storage is unavailable. */ }
    window.dispatchEvent(new Event(eventName));
  }, [key, persistent, storageKey]);
  return [value, setValue] as const;
}
