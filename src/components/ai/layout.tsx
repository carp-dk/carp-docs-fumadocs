'use client';
import { DocsLayout as Layout, type DocsLayoutProps } from '@/layouts/spacious';
import { AIChat, AIChatPanel, useAIChat } from './search';

// the Spacious layout has its own "Ask AI" buttons, in place of the floating `AIChatTrigger`
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
