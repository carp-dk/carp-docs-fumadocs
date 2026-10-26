'use client';
import { DocsLayout as Layout, type DocsLayoutProps } from '@/components/m3e/layout';
import { AIChat, AIChatPanel, useAIChat } from './search';

// The docs shell provides desktop and mobile controls for the shared assistant.
export function DocsLayout(props: DocsLayoutProps) {
  return (
    <AIChat>
      <ChatLayout {...props} />
    </AIChat>
  );
}

function ChatLayout(props: DocsLayoutProps) {
  const { open, setOpen } = useAIChat();

  return <Layout {...props} aiChat={{ open, onOpenChange: setOpen, panel: <AIChatPanel /> }} />;
}
