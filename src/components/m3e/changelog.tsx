'use client';

import type { TOCItemType } from 'fumadocs-core/toc';
import { toJsxRuntime, type Components } from 'hast-util-to-jsx-runtime';
import { M3eSkeleton } from '@m3e/react/skeleton';
import { createContext, createElement, memo, use, useEffect, useState, type ComponentProps } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { changelogFileUrl, changelogSources, fetchChangelog, type ChangelogData, type ChangelogItem } from '@/lib/changelog';
import { Button } from '@/components/ui/button';
import { DynamicCodeBlock } from '../codeblock';
import { useMDXComponents } from '../mdx';
import { Progress } from './mdx/content';

type ChangelogState =
  | { status: 'loading' }
  | { status: 'ready'; data: ChangelogData }
  | { status: 'error'; message: string };

export type ChangelogResult = ChangelogState & { key: string; retry: () => void };

/** The current page's changelog, fetched by the docs page. */
export const ChangelogContext = createContext<ChangelogResult | undefined>(undefined);

// One request per visit: if the page remounts while its changelog is still loading (React's
// development double mount, or the layout remounting on navigation), it reuses that request.
const inflight = new Map<string, Promise<ChangelogData>>();
function requestChangelog(key: string) {
  let request = inflight.get(key);
  if (!request) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('the request timed out')), 20_000);
    request = fetchChangelog(key, controller.signal).finally(() => { clearTimeout(timeout); inflight.delete(key); });
    inflight.set(key, request);
  }
  return request;
}

/**
 * Fetch a section's changelog in the browser on every visit. The server and the first render
 * show the loading state.
 */
export function useChangelog(key: string | undefined): ChangelogResult | undefined {
  const [state, setState] = useState<ChangelogState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!key) return;
    let current = true;
    requestChangelog(key)
      .then(data => { if (current) setState({ status: 'ready', data }); })
      .catch((error: unknown) => { if (current) setState({ status: 'error', message: error instanceof Error ? error.message : String(error) }); });
    return () => { current = false; };
  }, [key, attempt]);
  if (!key) return;
  return { ...state, key, retry: () => { setState({ status: 'loading' }); setAttempt(count => count + 1); } };
}

interface ChangelogGroup { id: string; label: string; entries: ChangelogItem[] }

// Entries are grouped by the year they were published. Unpublished entries at the top are
// "Unreleased"; others stay in the group of the release before them.
function groupByYear(entries: ChangelogItem[]) {
  const groups: ChangelogGroup[] = [];
  const used = new Map<string, number>();
  for (const entry of entries) {
    const last = groups.at(-1);
    const label = entry.date ? String(new Date(entry.date).getUTCFullYear()) : last?.label ?? 'Unreleased';
    if (last?.label === label) { last.entries.push(entry); continue; }
    // A year can recur if releases are out of date order; keep each heading id unique.
    const base = label === 'Unreleased' ? 'unreleased' : `year-${label}`;
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    groups.push({ id: count > 1 ? `${base}-${count}` : base, label, entries: [entry] });
  }
  return groups;
}

/** Table of contents items for a changelog: each year, then its versions. */
export function changelogToc(entries: ChangelogItem[]): TOCItemType[] {
  return groupByYear(entries).flatMap(group => [
    { title: group.label, url: `#${group.id}`, depth: 2 },
    ...group.entries.map(entry => ({ title: entry.title, url: `#${entry.id}`, depth: 3 })),
  ]);
}

// UTC, so the server and the browser format the same date.
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });
const processor = remark().use(remarkGfm).use(remarkRehype);

// Headings inside an entry sit below its version heading and stay out of the table of contents.
const bodyHeading = (level: number) => function BodyHeading(props: ComponentProps<'h4'>) {
  return createElement(`h${Math.min(level + 3, 6)}`, { ...props, 'm3e-toc-ignore': '' });
};

function BodyPre({ children }: ComponentProps<'pre'>) {
  const code = (children as { props?: { children?: unknown; className?: string } } | undefined)?.props;
  if (typeof code?.children !== 'string') return <pre>{children}</pre>;
  return <DynamicCodeBlock lang={/language-(\S+)/.exec(code.className ?? '')?.[1] ?? 'text'} code={code.children.trimEnd()} />;
}

const EntryBody = memo(function EntryBody({ content, components }: { content: string; components: Components }) {
  return toJsxRuntime(processor.runSync(processor.parse(content)), { Fragment, jsx, jsxs, components });
});

/** A release timeline, grouped by year, in the shape of Fumadocs' `ChangelogTimeline`. */
export function ChangelogTimeline({ entries }: { entries: ChangelogItem[] }) {
  const mdx = useMDXComponents();
  const { h2: H2, h3: H3 } = mdx;
  const components: Components = { ...mdx, pre: BodyPre, h1: bodyHeading(1), h2: bodyHeading(2), h3: bodyHeading(3), h4: bodyHeading(4), h5: bodyHeading(5), h6: bodyHeading(6) } as Components;
  return <div className="docs-changelog">
    {groupByYear(entries).map(group => <section key={group.id} aria-labelledby={group.id}>
      <H2 id={group.id}>{group.label}</H2>
      <ol className="docs-changelog-list">
        {group.entries.map(entry => <li key={entry.id} className="docs-changelog-entry">
          <div className="docs-changelog-header">
            <H3 id={entry.id}>{entry.title}</H3>
            {(entry.date || entry.url) && <p className="docs-changelog-meta">
              {entry.date && <time dateTime={entry.date}>{dateFormat.format(new Date(entry.date))}</time>}
              {entry.url && <a href={entry.url} target="_blank" rel="noopener noreferrer">View on pub.dev</a>}
            </p>}
          </div>
          {entry.content && <div className="docs-changelog-body"><EntryBody content={entry.content} components={components} /></div>}
        </li>)}
      </ol>
    </section>)}
  </div>;
}

// While loading: a wavy progress bar and a skeleton in the timeline's own shape.
function ChangelogSkeleton() {
  return <div className="docs-changelog docs-changelog-loading">
    <Progress label="Loading release notes from GitHub and pub.dev" />
    <div aria-hidden="true">
      <M3eSkeleton animation="wave" shape="rounded"><div className="docs-changelog-skeleton-year" /></M3eSkeleton>
      <ol className="docs-changelog-list">
        {[3, 2, 4].map((lines, index) => <li key={index} className="docs-changelog-entry">
          <div className="docs-changelog-header">
            <M3eSkeleton animation="wave" shape="rounded"><div className="docs-changelog-skeleton-version" /><div className="docs-changelog-skeleton-date" /></M3eSkeleton>
          </div>
          <div className="docs-changelog-body">
            <M3eSkeleton animation="wave" shape="rounded">{Array.from({ length: lines }, (_, line) => <div key={line} className="docs-changelog-skeleton-line" />)}</M3eSkeleton>
          </div>
        </li>)}
      </ol>
    </div>
  </div>;
}

/** MDX: the current page's changelog, with loading and error states. */
export function Changelog() {
  const changelog = use(ChangelogContext);
  const { Callout } = useMDXComponents();
  if (!changelog) return null;
  const source = changelogSources[changelog.key];
  return <>
    {/* Announces the outcome once the release notes arrive or fail. */}
    <p className="sr-only" role="status">
      {changelog.status === 'ready' ? `${changelog.data.entries.length} releases loaded` : changelog.status === 'error' ? 'The changelog could not be loaded' : ''}
    </p>
    {changelog.status === 'loading' && <ChangelogSkeleton />}
    {changelog.status === 'error' && <Callout type="warning" title="The changelog could not be loaded" actions={<Button variant="text" onClick={changelog.retry}>Try again</Button>}>
      GitHub or pub.dev did not respond ({changelog.message}). Try again, or read <a href={changelogFileUrl(source)}>{source.file}</a> on GitHub.
    </Callout>}
    {changelog.status === 'ready' && <ChangelogTimeline entries={changelog.data.entries} />}
  </>;
}
