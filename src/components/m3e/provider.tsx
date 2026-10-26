'use client';

import { TanstackProvider } from 'fumadocs-core/framework/tanstack';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <TanstackProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </TanstackProvider>
  );
}
