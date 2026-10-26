'use client';
import { createContext, use } from 'react';
import type { TOCItemType } from 'fumadocs-core/toc';
export const PageTOCContext = createContext<TOCItemType[]>([]);
export const usePageTOC = () => use(PageTOCContext);
