'use client';

import { M3eTab, M3eTabPanel } from '@m3e/react/tabs';
import { M3eBadge } from '@m3e/react/badge';
import { Children, isValidElement, useEffect, useId, useState, type ComponentRef, type ReactNode } from 'react';
import { Tabs as NativeTabs } from '../tabs';
import { useStoredPreference } from './preferences';
import { Icon } from './actions';
import type { MaterialIconName } from '@/components/ui/icons';

interface TabOptions {
  icon?: MaterialIconName;
  badge?: number | 'dot';
  badgeLabel?: string;
  disabled?: boolean;
  ariaLabel?: string;
}
interface PanelProps extends TabOptions { children: ReactNode; value?: string; id?: string }
interface TriggerProps extends TabOptions { children: ReactNode; value: string }
export interface TabItem extends TabOptions { label: ReactNode; value?: string }
export function Tab({ children }: PanelProps) { return <>{children}</>; }
export const TabsContent = Tab;
export function TabsList({ children }: { children: ReactNode }) { return <>{children}</>; }
export function TabsTrigger({ children }: TriggerProps) { return <>{children}</>; }

export function Tabs({ items, children, defaultIndex = 0, defaultValue, value, onValueChange, groupId, persist = false, updateAnchor = false, variant, tone = 'primary', label = 'Content tabs', layout, inlineIcons = false, iconOnly = false }: {
  items?: (string | TabItem)[]; children: ReactNode; defaultIndex?: number; defaultValue?: string; value?: string; onValueChange?: (value: string) => void; groupId?: string; persist?: boolean; updateAnchor?: boolean;
  variant?: 'primary' | 'secondary'; tone?: 'primary' | 'secondary' | 'tertiary'; label?: string;
  layout?: 'fixed' | 'scrollable'; inlineIcons?: boolean; iconOnly?: boolean;
}) {
  const id = useId();
  const elements = Children.toArray(children).filter(isValidElement<PanelProps>);
  const list = elements.find(child => child.type === TabsList);
  const triggers = Children.toArray(list?.props.children).filter(isValidElement<TriggerProps>);
  const panels = elements.filter(child => child.type === Tab);
  const descriptors: TabItem[] | undefined = items?.map(item => typeof item === 'string' ? { label: item, value: item } : item);
  const labels = descriptors?.map(item => item.label) ?? triggers.map(trigger => trigger.props.children);
  const values = panels.map((panel, index) => panel.props.value ?? descriptors?.[index]?.value ?? triggers[index]?.props.value ?? String(index));
  const options = panels.map((panel, index) => ({ ...panel.props, ...triggers[index]?.props, ...descriptors?.[index] }));
  const icons = options.map(option => option.icon);
  const appearance = variant ?? (icons.some(Boolean) ? 'primary' : 'secondary');
  const arrangement = layout ?? (appearance === 'primary' ? 'fixed' : 'scrollable');
  const stacked = appearance === 'primary' && !inlineIcons && !iconOnly && icons.some(Boolean);
  const initial = defaultValue ?? values[Math.max(0, Math.min(defaultIndex, values.length - 1))];
  const [local, setLocal] = useState<string | undefined>(initial);
  const [stored, store] = useStoredPreference(groupId ? `docs-tabs:${groupId}` : undefined, persist);
  const selected = value ?? (stored && values.includes(stored) ? stored : local);
  const requestedIndex = values.indexOf(selected ?? initial);
  const selectedIndex = requestedIndex >= 0 && !options[requestedIndex].disabled ? requestedIndex : options.findIndex(option => !option.disabled);
  const ids = panels.map((panel, index) => panel.props.id ?? `${id}-${index}`);
  const panelSignature = JSON.stringify(ids);

  useEffect(() => {
    const panelIds: string[] = JSON.parse(panelSignature);
    const followHash = () => {
      const index = panelIds.indexOf(decodeURIComponent(window.location.hash.slice(1)));
      if (index >= 0 && !options[index].disabled) { setLocal(values[index]); store(values[index]); }
    };
    followHash();
    window.addEventListener('hashchange', followHash);
    return () => { window.removeEventListener('hashchange', followHash); };
  // Stable scalar dependencies prevent re-reading a previous hash after every tab change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelSignature, values.join('\u0000'), options.map(option => Boolean(option.disabled)).join()]);

  return <NativeTabs selectedIndex={selectedIndex} variant={appearance} stretch={arrangement === 'fixed'} aria-label={label} data-tone={tone} data-variant={appearance} data-layout={arrangement} data-stacked={stacked || undefined} className="docs-tabs not-prose" onChange={event => {
    if (event.target !== event.currentTarget) return;
    const index = (event.currentTarget as ComponentRef<typeof NativeTabs>).selectedIndex;
    if (index < 0 || !values[index] || options[index].disabled || values[index] === selected) return;
    if (value !== undefined) (event.currentTarget as ComponentRef<typeof NativeTabs>).selectedIndex = selectedIndex;
    setLocal(values[index]); store(values[index]); onValueChange?.(values[index]);
    if (updateAnchor && panels[index]?.props.id) history.replaceState(history.state, '', `#${encodeURIComponent(panels[index].props.id!)}`);
  }}>
    {labels.map((label, index) => {
      const option = options[index];
      const hasBadge = option.badge === 'dot' || (typeof option.badge === 'number' && option.badge > 0);
      const badge = hasBadge && <M3eBadge size={option.badge === 'dot' ? 'small' : 'medium'} className="docs-tab-badge" aria-hidden="true">{typeof option.badge === 'number' && (option.badge > 99 ? '99+' : option.badge)}</M3eBadge>;
      const icon = option.icon && <span className="docs-tab-icon" slot={stacked ? 'icon' : undefined}><Icon name={option.icon} />{badge}</span>;
      return <M3eTab key={values[index] ?? index} id={`${ids[index]}-tab`} htmlFor={ids[index]} disabled={option.disabled} aria-label={option.ariaLabel} aria-description={hasBadge ? option.badgeLabel ?? (option.badge === 'dot' ? 'New activity' : `${option.badge} items`) : undefined}>
        {stacked && icon}
        <span className="docs-tab-label">{!stacked && icon}<span className={iconOnly && option.icon ? 'sr-only' : undefined}>{label}</span>{!option.icon && badge}</span>
      </M3eTab>;
    })}
    {panels.map((panel, index) => <M3eTabPanel key={values[index]} id={ids[index]} aria-labelledby={`${ids[index]}-tab`} slot="panel"><div className="docs-mdx-body prose m3-prose">{panel.props.children}</div></M3eTabPanel>)}
  </NativeTabs>;
}
