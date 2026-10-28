import type { OpenAPIV3_1 } from 'fumadocs-openapi';

// The Backend API section documents the CARP Web Services (CAWS) REST API from its OpenAPI
// document. vite.config.ts fetches the document once per build and builds it into the server (see
// openapi.ts), so the production server never depends on dev.carp.dk. This module imports nothing
// from the app, so vite.config.ts can also use it to list the endpoint pages for prerendering.

/** The OpenAPI document of CAWS, made by springdoc on the server. */
export const backendApiDocumentUrl = 'https://dev.carp.dk/doc/v3/api-docs';
/** The section's folder in content/docs, and its URL segment. */
export const backendApiDir = 'backend-api';
/** The document's ID in createOpenAPI() and in the page props. */
export const backendApiDocumentId = 'carp-webservices';

export type BackendApiDocument = OpenAPIV3_1.Document;
type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'head';
const methods: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head'];

// springdoc tags each endpoint with its Spring controller. These give the groups readable names
// and icons; a controller missing here is named after its tag ("study-controller" → "Study").
// Tags in the document's `tags` list with an `x-displayName` take precedence.
const groupNames: Record<string, { title: string; icon: string }> = {
  'account-controller': { title: 'Accounts', icon: 'Group' },
  'collection-controller': { title: 'Collections', icon: 'Database' },
  'consent-document-controller': { title: 'Consent documents', icon: 'Signature' },
  'data-point-controller': { title: 'Data points', icon: 'Dataset' },
  'data-stream-controller': { title: 'Data streams', icon: 'Timeline' },
  'document-controller': { title: 'Documents', icon: 'Description' },
  'email-controller': { title: 'Email', icon: 'Mail' },
  'export-controller': { title: 'Exports', icon: 'Download' },
  'file-controller': { title: 'Files', icon: 'Folder' },
  'protocol-controller': { title: 'Protocols', icon: 'AccountTree' },
  'self-signup-admin-controller': { title: 'Self-signup admin', icon: 'Tune' },
  'self-signup-controller': { title: 'Self-signup', icon: 'HowToReg' },
  'statistics-controller': { title: 'Statistics', icon: 'Monitoring' },
  'study-controller': { title: 'Studies', icon: 'Science' },
  'study-deployment-controller': { title: 'Study deployments', icon: 'Rocket' },
};

/** Fetch the CAWS OpenAPI document and prepare it for the docs (see normalizeDocument()). */
export async function fetchBackendApiDocument(url = backendApiDocumentUrl): Promise<BackendApiDocument> {
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${url} returned ${response.status} ${response.statusText}`);
  const document = await response.json() as BackendApiDocument;
  if (typeof document?.openapi !== 'string' || typeof document.paths !== 'object') throw new Error(`${url} is not an OpenAPI document`);
  return normalizeDocument(document);
}

/**
 * Fix what the generated document gets wrong for readers, in place:
 * - Kotlin raw strings keep their source indentation, which Markdown renders as code blocks, so
 *   every description is dedented;
 * - springdoc lists the shared error responses before the success response, so responses are
 *   sorted by status code;
 * - most operations have no summary, so they get the page title, which the OpenAPI UI shows too.
 */
export function normalizeDocument(document: BackendApiDocument): BackendApiDocument {
  dedentDescriptions(document);
  for (const pathItem of Object.values(document.paths ?? {})) {
    for (const method of methods) {
      const operation = pathItem?.[method];
      if (operation?.responses) operation.responses = Object.fromEntries(Object.entries(operation.responses).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
    }
  }
  for (const group of planBackendApiPages(document)) {
    for (const { path, method, title } of group.operations) {
      const operation = document.paths![path]![method]!;
      if (!operation.summary?.trim()) operation.summary = title;
    }
  }
  return document;
}

// Example and default values are data, not documentation, so their strings are left alone.
const dataKeys = new Set(['example', 'examples', 'default', 'enum', 'const']);

function dedentDescriptions(node: unknown) {
  if (Array.isArray(node)) {
    for (const item of node) dedentDescriptions(item);
  } else if (node && typeof node === 'object') {
    const object = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(object)) {
      if (key === 'description' && typeof value === 'string') object[key] = dedent(value);
      else if (!dataKeys.has(key)) dedentDescriptions(value);
    }
  }
}

/** Kotlin's trimIndent(): drop the blank first and last lines and the common indentation. */
export function dedent(text: string) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines.at(-1)!.trim()) lines.pop();
  const indent = Math.min(...lines.filter(line => line.trim()).map(line => /^[ \t]*/.exec(line)![0].length));
  return lines.map(line => line.slice(Number.isFinite(indent) ? indent : 0).trimEnd()).join('\n');
}

export interface BackendApiOperation {
  path: string;
  method: HttpMethod;
  /** The page's file name: the operation ID without springdoc's `_1` suffix, in kebab case. */
  slug: string;
  /** The summary, or a title made from the operation ID ("getAll_4" → "Get all") or service. */
  title: string;
  /** The method and path, for search results, link previews and llms.txt. */
  description: string;
  deprecated: boolean;
}

export interface BackendApiGroup {
  tag: string;
  slug: string;
  title: string;
  icon?: string;
  operations: BackendApiOperation[];
}

/**
 * The endpoint pages: one folder per tag, sorted by title, with one page per operation, sorted by
 * path and method. Pages live at /docs/backend-api/<group slug>/<operation slug>.
 */
export function planBackendApiPages(document: BackendApiDocument): BackendApiGroup[] {
  const groups = new Map<string, BackendApiGroup & { entries: { path: string; method: HttpMethod; operation: OpenAPIV3_1.OperationObject }[] }>();
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    for (const method of methods) {
      const operation = pathItem?.[method];
      if (!operation) continue;
      // An operation with several tags gets one page, in its first tag's group.
      const tag = operation.tags?.[0] ?? 'other';
      let group = groups.get(tag);
      if (!group) {
        const tagObject = document.tags?.find(item => item.name === tag) as (OpenAPIV3_1.TagObject & { 'x-displayName'?: unknown }) | undefined;
        const displayName = typeof tagObject?.['x-displayName'] === 'string' ? tagObject['x-displayName'] : undefined;
        const title = displayName ?? groupNames[tag]?.title ?? sentenceCase(tag.replace(/-controller$/, '').replace(/[-_]+/g, ' '));
        groups.set(tag, group = { tag, slug: kebabCase(title), title, icon: groupNames[tag]?.icon, operations: [], entries: [] });
      }
      group.entries.push({ path, method, operation });
    }
  }
  return [...groups.values()].sort((a, b) => a.title.localeCompare(b.title, 'en')).map(({ entries, ...group }) => {
    entries.sort((a, b) => a.path.localeCompare(b.path, 'en') || methods.indexOf(a.method) - methods.indexOf(b.method));
    const named = entries.map(({ path, method, operation }) => {
      const id = operation.operationId?.replace(/_\d+$/, '');
      // Each CARP application service (StudyService, ProtocolService and so on) takes all of its
      // requests at one endpoint, /api/<name>-service, so the page is named after the service.
      const service = /^\/api\/([a-z-]+-service)$/.exec(path)?.[1];
      return {
        path,
        method,
        slug: kebabCase(service ?? id ?? `${method} ${path}`),
        title: operation.summary?.trim() || (service ? sentenceCase(service.replace(/-/g, ' ')) : id ? humanize(id) : `${method.toUpperCase()} ${path}`),
        description: `${method.toUpperCase()} ${path}`,
        deprecated: operation.deprecated ?? false,
      };
    });
    // Operations that share a name in one group (overloads) are told apart by their path parameters.
    for (const key of ['title', 'slug'] as const) {
      const counts = new Map<string, number>();
      for (const item of named) counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
      for (const item of named) {
        if (counts.get(item[key])! < 2) continue;
        const parameters = [...item.path.matchAll(/\{([^}]+)\}/g)].map(match => humanize(match[1]).toLowerCase().replace(/\bid\b/g, 'ID'));
        const qualifier = parameters.length ? `by ${parameters.join(' and ')}` : `${item.method} ${item.path}`;
        item[key] = key === 'title' ? `${item.title} ${qualifier}` : kebabCase(`${item.slug} ${qualifier}`);
      }
    }
    return { ...group, operations: named };
  });
}

/** The URL of every endpoint page, for prerendering. */
export function backendApiPagePaths(document: BackendApiDocument) {
  return planBackendApiPages(document).flatMap(group => group.operations.map(operation => `/docs/${backendApiDir}/${group.slug}/${operation.slug}`));
}

const acronyms: Record<string, string> = { api: 'API', id: 'ID', ids: 'IDs', json: 'JSON', s3: 'S3', uri: 'URI', uris: 'URIs', url: 'URL', urls: 'URLs', uuid: 'UUID' };

/** "getByStudyIdAndCollectionId" → "Get by study ID and collection ID" */
function humanize(id: string) {
  const words = id.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').split(/[\s_-]+/).filter(Boolean);
  return sentenceCase(words.map(word => acronyms[word.toLowerCase()] ?? word.toLowerCase()).join(' '));
}

function sentenceCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function kebabCase(text: string) {
  return text.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
