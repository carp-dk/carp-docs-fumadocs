'use client';

import { M3eSearchView } from '@m3e/react/search';
import { Button } from '@/components/ui/button';
import { M3eActionList, M3eListAction } from '@m3e/react/list';
import { M3eFilterChip, M3eFilterChipSet } from '@m3e/react/chips';
import { useFetchSearch } from 'fumadocs-core/search/client';
import { ArrowLeftIcon, SearchIcon, FileTextIcon, HashIcon, XIcon } from '@/components/ui/icons';
import { Fragment, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { useAppLink } from './link';
import { getSearchHits, type SearchHit } from './search-results';

type ResultFilter = 'all' | 'page' | 'section';

// The sidebar's entry point: a compact outlined M3 button, shaped like a search bar, that
// opens the search dialog. Its visible text is its accessible name.
export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return <Button variant="outlined" shape="rounded" className="docs-search-trigger" aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K" onClick={onOpen}>
    <span className="docs-search-trigger-content"><SearchIcon aria-hidden="true" /><span>Search docs</span><kbd className="docs-search-shortcut" aria-hidden="true">⌘K</kbd></span>
  </Button>;
}

export function SearchDialog({ open, onOpenChange, pages: allPages, allowedUrls }: { open: boolean; onOpenChange: (open: boolean) => void; pages: SearchHit[]; allowedUrls?: string[] }) {
  const pages = useMemo(() => allowedUrls ? allPages.filter(page => allowedUrls.includes(page.url.split('#')[0])) : allPages, [allPages, allowedUrls]);
  const { search, onSearchChange, data, isLoading, error } = useFetchSearch();
  const input = useRef<HTMLInputElement>(null);
  const view = useRef<ComponentRef<typeof M3eSearchView>>(null);
  const requestedOpen = useRef(open);
  const phase = useRef<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [active, setActive] = useState(false);
  const [filter, setFilter] = useState<ResultFilter>('all');
  const returnFocus = useRef<HTMLElement | null>(null);
  const results = useMemo(() => getSearchHits(data?.items.flatMap(item => item.type === 'table' ? item.rows : [item]) ?? [], pages, data?.query ?? '').filter(hit => !allowedUrls || allowedUrls.includes(hit.url.split('#')[0])), [data, pages, allowedUrls]);
  const hasQuery = search.trim().length > 0;
  const visibleResults = hasQuery ? results.filter(result => filter === 'all' || result.kind === filter) : pages.slice(0, 5);
  const showResults = !hasQuery || (!isLoading && !error && visibleResults.length > 0);
  const resultCounts = { all: results.length, page: results.filter(result => result.kind === 'page').length, section: results.filter(result => result.kind === 'section').length };

  // M3E's opening/closing animations are asynchronous. Queue a rapid toggle
  // until the current animation finishes so an old close cannot hide a new view.
  useEffect(() => {
    requestedOpen.current = open;
    if (view.current && (phase.current === 'closed' || phase.current === 'open')) {
      view.current.open = open;
    }
  }, [open]);

  return (
    <M3eSearchView
      className="docs-search-view"
      ref={view}
      data-open={String(active)}
      inert={!active}
      mode="auto"
      aria-label="Search documentation"
      closeLabel="Close search"
      clearLabel="Clear search"
      onBeforeToggle={event => {
        if (event.target !== event.currentTarget) return;
        if ((event as ToggleEvent).newState === 'open') {
          phase.current = 'opening';
          setActive(true);
          returnFocus.current = document.activeElement as HTMLElement;
        } else {
          phase.current = 'closing';
          setActive(false);
          requestedOpen.current = false;
          onOpenChange(false);
        }
      }}
      onToggle={event => {
        if (event.target !== event.currentTarget) return;
        if ((event as ToggleEvent).newState === 'open') {
          phase.current = 'open';
          if (requestedOpen.current) requestAnimationFrame(() => input.current?.focus());
          else if (view.current) view.current.open = false;
        } else {
          phase.current = 'closed';
          if (requestedOpen.current && view.current) view.current.open = true;
          else returnFocus.current?.focus({ preventScroll: true });
        }
      }}
      onClear={() => { onSearchChange(''); setFilter('all'); }}
    >
      <SearchIcon slot="search-icon" />
      <ArrowLeftIcon slot="close-icon" />
      <XIcon slot="clear-icon" />
      <input
        ref={input}
        slot="input"
        type="text"
        role="searchbox"
        inputMode="search"
        aria-label="Search documentation"
        aria-haspopup="dialog"
        placeholder="Search documentation"
        autoComplete="off"
        disabled={!active}
        spellCheck={false}
        value={search}
        onChange={event => onSearchChange(event.target.value)}
        onKeyDown={event => {
          if (!event.nativeEvent.isComposing && (event.key === 'ArrowDown' || event.key === 'Enter')) {
            const first = event.currentTarget.closest('m3e-search-view')?.querySelector<HTMLElement>('m3e-list-action');
            if (first) {
              event.preventDefault();
              if (event.key === 'Enter') first.click();
              else first.focus();
            }
          }
        }}
      />
      {hasQuery && <div className="docs-search-filters">
        <M3eFilterChipSet aria-label="Result type" onChange={event => {
          const chips = event.currentTarget as ComponentRef<typeof M3eFilterChipSet>;
          const next = (chips.value ?? 'all') as ResultFilter;
          // Keep one category selected, including when the active chip is clicked.
          chips.chips.forEach(chip => { chip.selected = chip.value === next; });
          setFilter(next);
        }}>
          {([['all', 'All results'], ['page', 'Pages'], ['section', 'Sections']] as const).map(([value, label]) => (
            <M3eFilterChip key={value} value={value} selected={filter === value} aria-controls="docs-search-result-list">
              {label}<span className="docs-search-filter-count">{isLoading ? '–' : resultCounts[value]}</span>
            </M3eFilterChip>
          ))}
        </M3eFilterChipSet>
      </div>}
      <div className="docs-search-results" aria-busy={isLoading}>
        {hasQuery && error ? <SearchStatus title="Search is unavailable" detail="Please try again in a moment." error />
          : hasQuery && isLoading ? <SearchStatus title="Searching…" />
          : hasQuery && visibleResults.length === 0 ? <SearchStatus title={results.length ? `No ${filter === 'page' ? 'pages' : 'sections'} found` : 'No results found'} detail={results.length ? 'Choose All results to see matches in other categories.' : 'Try a different word or a shorter phrase.'} />
          : showResults && <>
            <p className="docs-search-result-count" role="status">{hasQuery ? `${visibleResults.length} ${visibleResults.length === 1 ? 'result' : 'results'} for “${data?.query ?? search}”` : 'Quick links'}</p>
            <M3eActionList id="docs-search-result-list" aria-label={hasQuery ? 'Search results' : 'Documentation shortcuts'} onKeyDownCapture={event => {
              if (event.key !== 'ArrowUp') return;
              const first = event.currentTarget.querySelector('m3e-list-action');
              if (event.target === first) {
                event.preventDefault();
                event.stopPropagation();
                input.current?.focus();
              }
            }}>
              {visibleResults.map(result => (
                <SearchResult key={result.url} result={result} query={hasQuery ? data?.query ?? '' : ''} onSelect={() => onOpenChange(false)} />
              ))}
            </M3eActionList>
          </>}
      </div>
      <div className="docs-search-help" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span><span><kbd>esc</kbd> Close</span></div>
    </M3eSearchView>
  );
}

function SearchStatus({ title, detail, error }: { title: string; detail?: string; error?: boolean }) {
  return <div className="docs-search-empty" role={error ? 'alert' : 'status'}>
    <span className="docs-search-empty-icon"><SearchIcon /></span>
    <p className="m3-title-medium">{title}</p>
    {detail && <p className="m3-body-medium">{detail}</p>}
  </div>;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const words = [...new Set(query.trim().split(/\s+/).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!words.length) return text;
  const pattern = new RegExp(`(${words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(pattern).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : <Fragment key={index}>{part}</Fragment>);
}

function SearchResult({ result, query, onSelect }: { result: SearchHit; query: string; onSelect: () => void }) {
  const onNavigate = useAppLink(result.url);
  const Icon = result.kind === 'section' ? HashIcon : FileTextIcon;
  return (
    <M3eListAction className="docs-search-result" href={result.url} onClickCapture={event => { onNavigate(event); if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onSelect(); }}>
      <span slot="leading" className="docs-search-result-icon" aria-hidden="true"><Icon /></span>
      <span slot="overline" className="docs-search-breadcrumb">{result.kind === 'section' ? 'Section' : 'Page'} · {result.breadcrumbs.join(' › ')}</span>
      <span className="docs-search-result-title"><Highlight text={result.title} query={query} /></span>
      {result.excerpt && <span slot="supporting-text" className="docs-search-result-excerpt"><Highlight text={result.excerpt} query={query} /></span>}
      <span slot="trailing" className="docs-search-result-enter" aria-hidden="true">↵</span>
    </M3eListAction>
  );
}
