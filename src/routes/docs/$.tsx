import { createFileRoute, notFound } from '@tanstack/react-router';
import { DocsLayout } from '@/components/ai/layout';
import { createServerFn } from '@tanstack/react-start';
import { docs } from '@/lib/docs';
import { getPageSection, source, type SourcePage } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from '@/components/m3e/page';
import { MarkdownCopyButton, ViewOptionsPopover } from '@/components/ai/page-actions';
import { ChangelogContext, changelogToc, useChangelog } from '@/components/m3e/changelog';
import { baseOptions } from '@/lib/layout.shared';
import { changelogKey } from '@/lib/changelog';
import { absoluteUrl, appName, getPageImageUrl, getPageMarkdownUrl, gitConfig, siteDescription } from '@/lib/shared';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { lazy, Suspense, use, type ComponentProps } from 'react';
import { useMDXComponents } from '@/components/mdx';
import { getSearchPages } from '@/components/m3e/search-results';
import { buildDocsGraph } from '@/lib/docs-graph';

// The OpenAPI UI is only loaded by Backend API endpoint pages.
const APIPage = lazy(() => import('@/components/api-page').then(module => ({ default: module.APIPage })));

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/') ?? [];
    const data = await serverLoader({ data: slugs });
    // Endpoint pages render from their props; MDX pages load their content first.
    if (data.type === 'docs') await docs.getPage(data.path)?.preload();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { seo } = loaderData;
    return {
      meta: [
        { title: seo.documentTitle },
        { name: 'description', content: seo.description },
        { property: 'og:type', content: seo.type },
        { property: 'og:url', content: seo.url },
        { property: 'og:title', content: seo.title },
        { property: 'og:description', content: seo.description },
        { property: 'og:image', content: seo.image },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: seo.title },
        { name: 'twitter:title', content: seo.title },
        { name: 'twitter:description', content: seo.description },
        { name: 'twitter:image', content: seo.image },
      ],
      links: [{ rel: 'canonical', href: seo.url }],
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(seo.jsonLd) }],
    };
  },
});

const serverLoader = createServerFn({
  method: 'GET',
})
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();
    const tree = source.getPageTree();

    return {
      ...page.type === 'openapi'
        ? { type: 'openapi' as const, title: page.data.title, props: page.data.getOpenAPIPageProps() }
        : { type: 'docs' as const, path: page.path },
      markdownUrl: getPageMarkdownUrl(page).url,
      pageTree: await source.serializePageTree(tree),
      searchPages: getSearchPages(tree),
      graph: buildDocsGraph(),
      // Changelog pages fetch their release notes in the browser on every visit.
      changelog: changelogKey(page.slugs),
      seo: pageSeo(page),
    };
  });

/** Title, description, URLs and structured data for a page's head. */
function pageSeo(page: SourcePage) {
  const url = absoluteUrl(page.url);
  const image = absoluteUrl(getPageImageUrl(page).url);
  const description = page.data.description ?? siteDescription;
  // A package section's pages repeat names like "Installation", so their titles name the section.
  // Endpoint names like "Get all" repeat across the Backend API groups, so they name the group too.
  const section = getPageSection(page.url);
  const name = page.type === 'openapi' && section?.group ? `${page.data.title} – ${section.group}` : page.data.title;
  const title = section && !section.isOverview ? `${name} – ${section.name}` : name;
  // The docs home is the site itself; every other page is an article in it.
  const home = source.getPage([]);
  const isHome = page.url === home?.url;
  const documentTitle = isHome ? page.data.title : `${title} | ${appName}`;
  // Breadcrumbs follow the URL: the docs home, each parent page, then the page itself.
  const parents = page.slugs.slice(0, -1).flatMap((_, index) => source.getPage(page.slugs.slice(0, index + 1)) ?? []);
  const trail = isHome || !home ? [page] : [home, ...parents, page];
  const breadcrumbs = trail.map(item => ({ name: item.url === home?.url ? appName : item.data.title, url: absoluteUrl(item.url) }));
  const publisher = { '@type': 'Organization', name: 'Copenhagen Research Platform (CARP)', url: 'https://carp.dk' };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': isHome ? [{ '@type': 'WebSite', name: appName, url, description, inLanguage: 'en', publisher }] : [
      {
        '@type': 'TechArticle',
        headline: page.data.title,
        description,
        url,
        image,
        inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', name: appName, url: absoluteUrl('/docs') },
        publisher,
      },
      ...breadcrumbs.length > 1 ? [{
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })),
      }] : [],
    ],
  };
  return { type: isHome ? 'website' : 'article', title, documentTitle, description, url, image, jsonLd };
}

// Until the release notes arrive, a placeholder entry keeps the table of contents in place.
const loadingToc = [{ title: 'Releases', url: '#releases', depth: 2 }];

function Content({ path, markdownUrl, changelogKey }: { path: string; markdownUrl: string; changelogKey?: string }) {
  const page = docs.getPage(path);
  if (!page) throw new Error(`unknown page: ${path}`);

  const { toc } = use(page.load());
  const changelog = useChangelog(changelogKey);
  const MDX = page.body;

  return (
    <DocsPage toc={!changelog ? toc : changelog.status === 'ready' ? [...toc, ...changelogToc(changelog.data.entries)] : [...toc, ...loadingToc]}>
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription>{page.description}</DocsDescription>
      <div className="flex flex-row flex-wrap gap-2 items-center border-b -mt-4 pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${path}`}
        />
      </div>
      <DocsBody>
        <ChangelogContext value={changelog}>
          <MDX components={useMDXComponents()} />
        </ChangelogContext>
      </DocsBody>
    </DocsPage>
  );
}

// A Backend API endpoint page: the OpenAPI UI for one operation, from the CAWS OpenAPI document.
function ApiContent({ title, props, markdownUrl }: { title?: string; props: ComponentProps<typeof APIPage>; markdownUrl: string }) {
  return (
    <DocsPage full>
      <DocsTitle>{title}</DocsTitle>
      <div className="flex flex-row flex-wrap gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover markdownUrl={markdownUrl} />
      </div>
      <DocsBody>
        <APIPage {...props} />
      </DocsBody>
    </DocsPage>
  );
}

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData());
  const { pageTree, searchPages, markdownUrl, graph, changelog } = data;

  return (
    <DocsLayout {...baseOptions()} tree={pageTree} searchPages={searchPages} graph={graph}>
      <Suspense>
        {data.type === 'openapi'
          ? <ApiContent title={data.title} props={data.props} markdownUrl={markdownUrl} />
          : <Content path={data.path} markdownUrl={markdownUrl} changelogKey={changelog} />}
      </Suspense>
    </DocsLayout>
  );
}
