'use client';

import { M3eToc } from '@m3e/react/toc';
import { M3eCard } from '@m3e/react/card';
import { M3eExpansionPanel } from '@m3e/react/expansion-panel';
import { usePathname } from 'fumadocs-core/framework';
import type { TOCItemType } from 'fumadocs-core/toc';
import type { ComponentProps } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { flattenPages, useDocsTree } from './tree-context';
import { useAppLink } from './link';
import { PageTOCContext } from './page-context';

// A `full` page has no table of contents, and its article takes that column too: for wide
// content such as the Backend API endpoint pages.
export function DocsPage({ toc = [], full = false, children, className, ...props }: ComponentProps<'article'> & { toc?: TOCItemType[]; full?: boolean }) {
  const pathname = usePathname();
  // M3E reads the page's headings once; rebuild it when headings arrive later (e.g. a changelog).
  const tocKey = `${pathname}:${toc.length}`;
  return (
    <PageTOCContext value={toc}><div className="docs-page-grid" data-full={full || undefined}>
      {toc.length > 0 && <M3eExpansionPanel className="docs-mobile-toc"><span slot="header">On this page</span><M3eToc key={tocKey} htmlFor="docs-scroll" maxDepth={6} /></M3eExpansionPanel>}
      <article id="docs-article" tabIndex={-1} {...props} className={cn('docs-article', className)}>
        {children}
        <Footer />
      </article>
      {toc.length > 0 && <aside className="docs-toc" aria-label="Table of contents"><M3eToc key={tocKey} htmlFor="docs-scroll" maxDepth={6}><span slot="overline">On this page</span></M3eToc></aside>}
    </div></PageTOCContext>
  );
}

export function DocsTitle(props: ComponentProps<'h1'>) {
  return <h1 {...props} m3e-toc-ignore="" className={cn('docs-title m3-display-small md:m3-display-medium', props.className)} />;
}

export function DocsDescription(props: ComponentProps<'p'>) {
  return <p {...props} className={cn('docs-description m3-body-large', props.className)} />;
}

export function DocsBody(props: ComponentProps<'div'>) {
  return <div {...props} className={cn('prose m3-prose', props.className)} />;
}

function Footer() {
  const tree = useDocsTree();
  const pathname = usePathname();
  const pages = flattenPages(tree.children);
  const index = pages.findIndex(page => page.url === pathname);
  if (index < 0) return null;
  const previous = pages[index - 1];
  const next = pages[index + 1];
  return <nav className="docs-pagination" aria-label="Page navigation">
    {previous && <PageLink href={previous.url} title={previous.name} />}
    {next && <PageLink href={next.url} title={next.name} next />}
  </nav>;
}

function PageLink({ href, title, next }: { href: string; title: React.ReactNode; next?: boolean }) {
  const onClick = useAppLink(href);
  const Icon = next ? ArrowRightIcon : ArrowLeftIcon;
  return <M3eCard href={href} actionable role="link" tabIndex={0} variant="filled" onClickCapture={onClick} className={cn('docs-page-link', next && 'docs-page-link-next')}>
    <div slot="content">
      <span className="docs-page-link-label">{next ? 'Next page' : 'Previous page'}<Icon aria-hidden="true" /></span>
      <span className="m3-title-medium">{title}</span>
    </div>
  </M3eCard>;
}
