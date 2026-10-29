import { createOpenAPI } from 'fumadocs-openapi/server';
import type { Document } from 'fumadocs-openapi';
import { PathUtils, update, type LoaderPlugin } from 'fumadocs-core/source';
import { createElement, Fragment } from 'react';
import document from 'virtual:backend-api-document';
import { backendApiDir, backendApiDocumentId, planBackendApiPages } from './backend-api';

// Server-only. The CAWS OpenAPI document is built into the server by vite.config.ts, so pages
// render from the document of the last build. Fumadocs bundles its own copy of the document.
export const openapi = createOpenAPI({
  // Fumadocs upgrades the OpenAPI 3.1 document to 3.2 when it loads it.
  input: { [backendApiDocumentId]: () => structuredClone(document) as unknown as Document },
  // Page props leave the document out; the docs route sends it once per browser session.
  includeDocument: false,
});

const groups = planBackendApiPages(document);

/** The endpoint folders, in sidebar order, for the section's meta.json (see source.ts). */
export const backendApiFolders = groups.map(group => group.slug);

/** The Backend API endpoint pages, one folder per group, as virtual files in content/docs/backend-api. */
export async function getBackendApiSource() {
  const source = await openapi.staticSource({
    per: 'custom',
    baseDir: backendApiDir,
    meta: true,
    toPages(builder) {
      for (const group of groups) builder.create({
        type: 'group',
        schemaId: builder.id,
        path: group.slug,
        info: { title: group.title },
        entries: group.operations.map(operation => ({
          type: 'operation',
          schemaId: builder.id,
          path: `${group.slug}/${operation.slug}.mdx`,
          item: { path: operation.path, method: operation.method },
          info: { title: operation.title, description: operation.description, deprecated: operation.deprecated },
        })),
      });
    },
  });
  // Fumadocs joins the paths with node:path, so they have backslashes on Windows.
  source.files = source.files.map(file => ({ ...file, path: PathUtils.slash(file.path) }));
  const icons = new Map(groups.map(group => [`${backendApiDir}/${group.slug}/meta.json`, group.icon]));
  // The section's own meta.json lists these folders; a generated one would replace it.
  source.files = source.files.filter(file => file.type !== 'meta' || file.path !== `${backendApiDir}/meta.json`);
  // The groups start closed; the sidebar opens the one that holds the current page.
  return update(source).meta(file => ({ ...file, data: { ...file.data, icon: icons.get(file.path), defaultOpen: false } })).build();
}

/**
 * Show each endpoint page's HTTP method after its name in the page tree, and strike through
 * deprecated endpoints. Like Fumadocs' openapiPlugin(), with the site's classes (openapi.css).
 */
export function backendApiTreePlugin(): LoaderPlugin {
  return {
    name: 'carp:backend-api-tree',
    transformPageTree: {
      file(node, filePath) {
        const file = filePath ? this.storage.read(filePath) : undefined;
        const meta = file?.format === 'page' ? (file.data as { _openapi?: { method?: string; deprecated?: boolean } })._openapi : undefined;
        if (!meta?.method) return node;
        const method = meta.method.toUpperCase();
        node.name = createElement(Fragment, null,
          createElement('span', { className: 'docs-api-nav-name', 'data-deprecated': meta.deprecated ? '' : undefined }, node.name, meta.deprecated && createElement('span', { className: 'sr-only' }, ' (deprecated)')),
          ' ',
          createElement('span', { className: 'docs-api-method', 'data-method': method.toLowerCase() }, method));
        return node;
      },
    },
  };
}
