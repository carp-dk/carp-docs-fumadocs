'use client';

import { TranslationProvider } from '@fuma-translate/react';
import { createOpenAPIPage } from 'fumadocs-openapi/ui';
import type { OpenAPIPageProps } from 'fumadocs-openapi/ui';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { useMemo, type ComponentProps } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { codeThemes } from '@/lib/code-theme';
import { Callout, getMDXComponents } from './mdx';

// The Backend API endpoint pages: Fumadocs' OpenAPI UI, with its Markdown, headings and syntax
// colours from the site, and labels in sentence case. Its colours come from the fd tokens, which
// theme.css maps to the Material roles; the layout follows the default, with the site's Callout
// for deprecated endpoints.
const mdxComponents = getMDXComponents();
const markdown = remark().use(remarkGfm).use(remarkRehype);

function Markdown({ md }: { md: string }) {
  return useMemo(() => toJsxRuntime(markdown.runSync(markdown.parse(md)), { Fragment, jsx, jsxs, components: mdxComponents }), [md]);
}

function Heading({ depth, ...props }: ComponentProps<'h2'> & { id: string; depth: number }) {
  const Component = mdxComponents[`h${Math.min(Math.max(depth, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6}`];
  return <Component {...props} />;
}

const OpenAPIPage = createOpenAPIPage({
  shikiOptions: { themes: codeThemes, defaultColor: false },
  components: { Markdown, Heading },
  content: {
    renderOperationLayout: (slots, { operation }) => (
      <div className="flex flex-col gap-x-6 gap-y-4 @4xl:flex-row @4xl:items-start">
        <div className="min-w-0 flex-1">
          {operation.deprecated ? <Callout type="warning" title="Deprecated">This endpoint is deprecated. Do not use it in new code.</Callout> : slots.header}
          {slots.apiPlayground}
          {slots.description}
          {slots.authSchemes}
          {slots.parameters}
          {slots.body}
          {slots.responses}
          {slots.callbacks}
        </div>
        <div className="docs-api-example @4xl:sticky @4xl:top-[calc(var(--fd-docs-row-3,0px)+1rem)] @4xl:flex @4xl:max-h-[calc(var(--fd-docs-height,100dvh)-var(--fd-docs-row-3,0px)-2rem)] @4xl:w-[400px] @4xl:flex-col">
          {slots.apiExample}
        </div>
      </div>
    ),
  },
});

// Headings and controls in sentence case, as on the rest of the site. HTTP reason phrases such
// as "Not Found" keep their standard capitals.
const labels: Record<string, string> = {
  'Path Parameters(operation page)': 'Path parameters',
  'Query Parameters(operation page)': 'Query parameters',
  'Header Parameters(operation page)': 'Header parameters',
  'Cookie Parameters(operation page)': 'Cookie parameters',
  'Request Body(operation page)': 'Request body',
  'Response Body(operation page)': 'Response body',
  'Example Request(operation page)': 'Example request',
  'Example Requests(operation page)': 'Example requests',
  'Example Response(operation page)': 'Example response',
  'Client Credentials(OAuth dialog)': 'Client credentials',
  'Device Authorization(OAuth dialog)': 'Device authorization',
  'Resource Owner Password Flow(OAuth dialog)': 'Resource owner password flow',
  'Add Item(playground)': 'Add item',
  'Enter Property Name(playground)': 'Enter property name',
  'Enter Value(playground server select)': 'Enter value',
  'Field Info(playground)': 'Field info',
  'Property Name(playground)': 'Property name',
  'Remove Item(playground)(aria-label)': 'Remove item',
  'Request Failed(playground result display)': 'Request failed',
  'Try in Playground(playground)': 'Try in playground',
  'Show Property(playground)': 'Show property',
  'Switch Field(playground)': 'Switch field',
  'Filter Properties(schema UI)': 'Filter properties',
  'Multiple Of(schema UI)': 'Multiple of',
  'Copy Link(schema UI)(aria-label)': 'Copy link',
  'Copied Link(schema UI)(aria-label)': 'Copied link',
  'Show Path(schema UI)(aria-label)': 'Show path',
  'Copy Text(code block)(aria-label)': 'Copy text',
  'Copied Text(code block)(aria-label)': 'Copied text',
};

export function APIPage(props: OpenAPIPageProps) {
  return (
    <TranslationProvider translations={labels}>
      <div className="docs-api-page">
        <OpenAPIPage {...props} />
      </div>
    </TranslationProvider>
  );
}
