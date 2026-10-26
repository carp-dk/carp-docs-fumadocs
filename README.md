# CARP Docs

Documentation for the [Copenhagen Research Platform (CARP)](https://carp.dk), built with
[Fumadocs](https://fumadocs.dev) on TanStack Start.

The interface is the [Fumadocs Material 3 theme](https://github.com/iarata/fumadocs-material-3-theme)
with CARP branding. Its README covers the components, colours and project structure.

## Run locally

```bash
bun install
bun run dev
```

Use Bun, which applies the M3E fix in `patches/`. To enable Ask AI, copy `.env.example` to
`.env.local` and set `OPENROUTER_API_KEY`.

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Build for production |
| `bun run types:check` | Type-check |
| `bun run lint` | Lint with oxlint |

## Write docs

Pages are MDX files in `content/docs`, ordered by each folder's `meta.json`.

| Section | Folder | Package |
| --- | --- | --- |
| Overview: introduction, quickstart, concepts, architecture, storing data, API reference | `content/docs` | |
| Mobile Sensing | `content/docs/mobile-sensing` | `carp_mobile_sensing` |
| Health | `content/docs/flutter-plugins/health` | `health` |
| Debug Toolkit | `content/docs/flutter-plugins/debug-toolkit` | `carp_debug_flutter` |
| Apple Watch Sensing | `content/docs/sampling-packages/apple-watch` | `carp_aware_package` |

- Packages are grouped like the navbar: `mobile-sensing`, `flutter-plugins/<package>` and
  `sampling-packages/<package>`. Each package folder has `"root": true` in its `meta.json`, which
  makes it a sidebar section; the grouping folders are not sections.
- The navbar menus are in `src/lib/layout.shared.tsx`: Get started, Mobile Sensing, Flutter Plugins,
  Sampling Packages, API Reference and Community. To add a package, add it to the `packages` list
  there with its `category` (`plugin` or `sampling`) and create its folder; its pub.dev name shows
  as a tag beside the menu item. Menus that do not fit the window move into a "More" menu.
- API reference docs are not generated here; link to the package's API docs on pub.dev.
- Components work without imports. The theme's live catalogue is in its
  [`content/docs/test`](https://github.com/iarata/fumadocs-material-3-theme/tree/main/content/docs/test) folder.
- ```` ```mermaid ```` code blocks render as diagrams in the theme's colours.
- Images live in `public/images/<section>/`. Portrait screenshots are shown at phone width.

## Changelogs

Each package section has a `changelog` page that renders `<Changelog />`. On every visit, the
visitor's browser fetches the package repository's `CHANGELOG.md` (one `## <version>` heading per
release) from GitHub and the version publish dates from pub.dev, and shows the releases as a
timeline grouped by year. While they load, the page shows a progress bar and a skeleton of the
timeline; if GitHub cannot be reached, it offers a retry and a link to the file.

The sources are in `src/lib/changelog.ts` (`changelogSources`); add a package there and give its
section a `changelog.mdx` page.

## SEO

- Pages get a title with their section (for example "Installation – Health | CARP Docs"), a
  description, a canonical URL, Open Graph and Twitter tags, and JSON-LD for the article and its
  breadcrumbs (`src/routes/docs/$.tsx`).
- Social images are 1200×630 PNGs generated per page at `/og/docs/<page>/image.png` (`src/lib/og.tsx`).
- `/sitemap.xml` lists every page and `/robots.txt` points to it; both are written at build time.
- Absolute URLs use `https://docs.carp.dk`. Set `VITE_SITE_URL` to serve the docs from another domain.

## Deploy

The site runs as a Docker container behind `docs.carp.dk`.

- `Dockerfile` builds the site with Bun and runs the self-contained Node server on port 3000.
- `.github/workflows/docker.yml` type-checks, lints and publishes the image to
  `ghcr.io/carp-dk/carp-docs-fumadocs`: `latest` on every push to `main`, `1.2.3` and `1.2` for
  version tags (`v1.2.3`), and a `sha-…` tag for every build. Pull requests only build.
- `deploy/docker-compose.yml` is the Portainer stack.

| Setting | Where | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Portainer stack environment variable | Ask AI (required for Ask AI) |
| `OPENROUTER_MODEL` | Portainer stack environment variable | OpenRouter model id (optional) |
| `PORTAINER_WEBHOOK_URL` | GitHub repository secret | Redeploys the stack after `latest` is published (optional) |
| `SITE_URL` | GitHub repository variable | Public URL, if not `https://docs.carp.dk` (optional) |

The OpenRouter settings are read when the container starts, so they never go into the image or
into GitHub. To build and run the image locally:

```bash
docker build -t carp-docs .
docker run -p 3000:3000 -e OPENROUTER_API_KEY=… carp-docs
```

## CARP-specific files

| What | Where |
| --- | --- |
| Site name and repository | `appName` and `gitConfig` in `src/lib/shared.ts` |
| CARP isotype | `BrandMark` in `src/components/ui/brand-icons.tsx` (sized in `navigation.css`) |
| Navbar menus | `src/lib/layout.shared.tsx` |
| Opening on the docs: `/` redirects to `/docs` | `src/routes/index.tsx` and `routeRules` in `vite.config.ts` |
| Favicon | `src/routes/__root.tsx`, `public/favicon.svg` |
| Package name | `package.json` and `bun.lock` |

The theme's default palette is already the CARP palette: CARP blue `#006398`, navy `#001d32`
and isotype red `#d61d41`, in `src/styles/theme.css`.

## Theme updates

The `template` remote points at the theme repository. Its history is separate from this one,
so bring changes over one commit at a time:

```bash
git fetch template
git log --oneline template/main
git cherry-pick <commit>
```
