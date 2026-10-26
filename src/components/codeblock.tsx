'use client';

import { M3eCard } from '@m3e/react/card';
import { CheckIcon, ClipboardIcon } from '@/components/ui/icons';
import { type ComponentProps, type ReactNode, useRef } from 'react';
import { useShikiDynamic } from 'fumadocs-core/highlight/shiki/react';
import { defaultShikiFactory } from 'fumadocs-core/highlight/shiki/full';
import { cn } from '@/lib/cn';
import { codeThemes } from '@/lib/code-theme';
import { useCopyButton } from '@/lib/use-copy';
import { IconButton } from './ui/button';

// The scrolling viewport is the code block's single tab stop, so drop Shiki's tabindex on <pre>.
export function Pre({ tabIndex: _tabIndex, ...props }: ComponentProps<'pre'>) {
  return <pre {...props} className={cn('docs-code-pre', props.className)} />;
}

export interface CodeBlockProps extends Omit<ComponentProps<'figure'>, 'title'> {
  title?: ReactNode;
  allowCopy?: boolean;
}

export function CodeBlock({ title, children, allowCopy = true, className, ...props }: CodeBlockProps) {
  const content = useRef<HTMLDivElement>(null);
  const [copied, copy] = useCopyButton(async () => {
    const node = content.current?.querySelector('pre')?.cloneNode(true) as HTMLElement | undefined;
    node?.querySelectorAll('.nd-copy-ignore').forEach(node => node.remove());
    await navigator.clipboard.writeText(node?.textContent ?? '');
  });
  return <figure {...props} className={cn('docs-code-block not-prose', className)}>
    <M3eCard variant="outlined">
      {title && <figcaption>{title}</figcaption>}
      {allowCopy && <IconButton className="docs-code-copy" aria-label={copied ? 'Copied text' : 'Copy text'} onClick={copy}>{copied ? <CheckIcon /> : <ClipboardIcon />}</IconButton>}
      <div ref={content} role="region" aria-label={typeof title === 'string' ? title : 'Code example'} tabIndex={0} className="docs-code-viewport">{children}</div>
    </M3eCard>
  </figure>;
}

const highlighter = () => defaultShikiFactory.getOrInit();

export function DynamicCodeBlock({ lang, code }: { lang: string; code: string }) {
  const highlighted = useShikiDynamic(highlighter, code, {
    lang,
    fallbackLanguage: 'text',
    themes: codeThemes,
    defaultColor: false,
    components: { pre: Pre },
    defaultValue: <Pre><code>{code}</code></Pre>,
  }, [lang, code]);
  return <CodeBlock>{highlighted}</CodeBlock>;
}
