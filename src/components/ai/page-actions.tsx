'use client';

import { M3eMenu, M3eMenuItem, M3eMenuTrigger } from '@m3e/react/menu';
import { CheckIcon, ChevronDownIcon, CopyIcon, ExternalLinkIcon, FileTextIcon } from '@/components/ui/icons';
import { AnthropicIcon, CursorIcon, GitHubIcon, OpenAIIcon, SciraIcon } from '@/components/ui/brand-icons';
import { usePathname } from 'fumadocs-core/framework';
import { type ComponentProps, useId, useState, useSyncExternalStore } from 'react';
import { Button } from '../ui/button';
import { useCopyButton } from '@/lib/use-copy';

const cache = new Map<string, string>();
const subscribe = () => () => {};

export function MarkdownCopyButton({ markdownUrl, children, ...props }: ComponentProps<typeof Button> & { markdownUrl: string }) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, copy] = useCopyButton(async () => {
    const load = async () => {
      const cached = cache.get(markdownUrl);
      if (cached) return cached;
      const response = await fetch(markdownUrl);
      if (!response.ok) throw new Error('Unable to load Markdown');
      const text = await response.text();
      cache.set(markdownUrl, text);
      return text;
    };
    if (typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': load().then(text => new Blob([text], { type: 'text/plain' })) })]);
    } else {
      await navigator.clipboard.writeText(await load());
    }
  });

  return <Button
    variant="outlined"
    {...props}
    disabled={loading}
    aria-live="polite"
    onClick={async () => {
      setLoading(true);
      setFailed(false);
      try { await copy(); } catch { setFailed(true); } finally { setLoading(false); }
    }}
  >
    {copied ? <CheckIcon slot="icon" aria-hidden="true" /> : <CopyIcon slot="icon" aria-hidden="true" />}
    {children ?? (copied ? 'Copied Markdown' : failed ? 'Copy failed — retry' : 'Copy Markdown')}
  </Button>;
}

export function ViewOptionsPopover({ markdownUrl, githubUrl, pageUrl: givenUrl }: { markdownUrl?: string; githubUrl?: string; pageUrl?: string }) {
  const id = useId();
  const pathname = usePathname();
  const url = useSyncExternalStore(subscribe, () => window.location.href, () => pathname);
  const prompt = `Read ${givenUrl ?? url}, I want to ask questions about it.`;
  const items = [
    { title: 'Open in GitHub', href: githubUrl, Icon: GitHubIcon },
    { title: 'View as Markdown', href: markdownUrl, Icon: FileTextIcon },
    { title: 'Open in Scira AI', href: `https://scira.ai/?${new URLSearchParams({ q: prompt })}`, Icon: SciraIcon },
    { title: 'Open in ChatGPT', href: `https://chatgpt.com/?${new URLSearchParams({ prompt, hints: 'search' })}`, Icon: OpenAIIcon },
    { title: 'Open in Claude', href: `https://claude.ai/new?${new URLSearchParams({ q: prompt })}`, Icon: AnthropicIcon },
    { title: 'Open in Cursor', href: `https://cursor.com/link/prompt?${new URLSearchParams({ text: prompt })}`, Icon: CursorIcon },
  ];

  return <>
    <Button variant="outlined"><M3eMenuTrigger htmlFor={id}>Open in</M3eMenuTrigger><ChevronDownIcon slot="trailing-icon" /></Button>
    <M3eMenu id={id} aria-label="Open page" className="docs-open-menu">
      {items.filter(item => item.href).map(({ title, href, Icon }) => <M3eMenuItem key={title} href={href} target="_blank" rel="noreferrer noopener"><Icon slot="icon" />{title}<ExternalLinkIcon slot="trailing-icon" /></M3eMenuItem>)}
    </M3eMenu>
  </>;
}
