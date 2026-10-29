import type { Document } from 'fumadocs-openapi';

// What the docs route keeps in the browser for Backend API endpoint pages. It lives in a module of
// its own, because the route's component and loader end up in separate chunks.

type ApiPageModule = typeof import('@/components/api-page');
let apiPageModule: ApiPageModule | undefined;
let apiPageLoading: Promise<ApiPageModule> | undefined;

/** Load the OpenAPI UI, which only endpoint pages need. */
export function loadApiPage() {
  return apiPageLoading ??= import('@/components/api-page').then(module => apiPageModule = module, (error: unknown) => {
    apiPageLoading = undefined;
    throw error;
  });
}

/**
 * The OpenAPI UI if it has loaded. Once the loader has awaited loadApiPage(), pages render it
 * without suspending, which React.lazy would do on its first render.
 */
export const loadedApiPage = () => apiPageModule;

/**
 * The OpenAPI documents this browser has loaded. Page props leave them out (includeDocument: false
 * in src/lib/openapi.ts), so each is sent once and kept for the next endpoint pages.
 */
export const openapiDocuments = new Map<string, Document>();
