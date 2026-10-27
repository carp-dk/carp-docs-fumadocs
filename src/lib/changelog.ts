import type { ChangelogEntry } from '@fumadocs/changelog';

export interface ChangelogSource {
  /** pub.dev package name; its version history gives each release's publish date. */
  package: string;
  /** GitHub repository, `owner/name`. */
  repo: string;
  branch: string;
  /** Path of the changelog in the repository. */
  file: string;
}

// Each package section's changelog, by the section's path in content/docs. A section's
// `changelog` page fetches and renders it in the browser on every visit.
export const changelogSources: Record<string, ChangelogSource> = {
  'mobile-sensing': { package: 'carp_mobile_sensing', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'carp_mobile_sensing/CHANGELOG.md' },
  'flutter-plugins/health': { package: 'health', repo: 'carp-dk/carp-health-flutter', branch: 'main', file: 'CHANGELOG.md' },
  'flutter-plugins/debug-toolkit': { package: 'carp_debug_flutter', repo: 'carp-dk/carp_debug_flutter', branch: 'main', file: 'CHANGELOG.md' },
  'flutter-plugins/research-package': { package: 'research_package', repo: 'carp-dk/research.package', branch: 'master', file: 'CHANGELOG.md' },
  'sampling-packages/apple-watch': { package: 'carp_aware_package', repo: 'carp-dk/carp_aware_package', branch: 'main', file: 'CHANGELOG.md' },
  'sampling-packages/context': { package: 'carp_context_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_context_package/CHANGELOG.md' },
  'sampling-packages/connectivity': { package: 'carp_connectivity_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_connectivity_package/CHANGELOG.md' },
  'sampling-packages/communication': { package: 'carp_communication_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_communication_package/CHANGELOG.md' },
  'sampling-packages/apps': { package: 'carp_apps_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_apps_package/CHANGELOG.md' },
  'sampling-packages/audio': { package: 'carp_audio_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_audio_package/CHANGELOG.md' },
  'sampling-packages/survey': { package: 'carp_survey_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_survey_package/CHANGELOG.md' },
  'sampling-packages/health': { package: 'carp_health_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_health_package/CHANGELOG.md' },
  'sampling-packages/polar': { package: 'carp_polar_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_polar_package/CHANGELOG.md' },
  'sampling-packages/esense': { package: 'carp_esense_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_esense_package/CHANGELOG.md' },
  'sampling-packages/movesense': { package: 'carp_movesense_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_movesense_package/CHANGELOG.md' },
  'sampling-packages/movisens': { package: 'carp_movisens_package', repo: 'carp-dk/carp.sensing-flutter', branch: 'main', file: 'packages/carp_movisens_package/CHANGELOG.md' },
};

/** A changelog entry as sent to the client: the date is an ISO string, and missing for unpublished versions. */
export type ChangelogItem = Omit<ChangelogEntry, 'date'> & { date?: string };

export interface ChangelogData {
  source: ChangelogSource;
  entries: ChangelogItem[];
}

/** The changelog key for a page, when the page is a section's `changelog` page. */
export function changelogKey(slugs: string[]) {
  const section = slugs.slice(0, -1).join('/');
  return slugs.at(-1) === 'changelog' && Object.hasOwn(changelogSources, section) ? section : undefined;
}

/** The changelog file on GitHub. */
export const changelogFileUrl = (source: ChangelogSource) => `https://github.com/${source.repo}/blob/${source.branch}/${source.file}`;

/**
 * Fetch a section's changelog in the browser: the CHANGELOG.md from GitHub and the publish dates
 * from pub.dev, which both allow cross-origin requests. Each call revalidates with the servers.
 * If pub.dev fails, entries come back without dates; if GitHub fails, this throws.
 */
export async function fetchChangelog(key: string, signal: AbortSignal): Promise<ChangelogData> {
  const source = changelogSources[key];
  const [markdown, published] = await Promise.all([
    fetchText(`https://raw.githubusercontent.com/${source.repo}/${source.branch}/${source.file}`, signal),
    fetchPublishDates(source.package, signal).catch(error => {
      if (signal.aborted) throw error;
      return new Map<string, string>();
    }),
  ]);
  return { source, entries: parseChangelog(markdown, source, published) };
}

async function fetchText(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return response.text();
}

/** Publish date of each version of a pub.dev package. */
async function fetchPublishDates(name: string, signal: AbortSignal) {
  const response = await fetch(`https://pub.dev/api/packages/${name}`, { signal, cache: 'no-cache', headers: { accept: 'application/vnd.pub.v2+json' } });
  if (!response.ok) throw new Error(`pub.dev returned ${response.status}`);
  const { versions } = await response.json() as { versions: { version: string; published?: string }[] };
  return new Map(versions.flatMap(({ version, published }) => published ? [[version, published] as const] : []));
}

const versionPattern = /\d+\.\d+\.\d+(?:[-+][\w.-]+)?/;

/** Split a CHANGELOG.md at its `## <version>` headings into entries, newest first as written. */
export function parseChangelog(markdown: string, source: ChangelogSource, published: Map<string, string>): ChangelogItem[] {
  const base = `https://github.com/${source.repo}/blob/${source.branch}/${source.file.slice(0, source.file.lastIndexOf('/') + 1)}`;
  const sections = markdown.replace(/\r\n/g, '\n').split(/^##[ \t]+/m).slice(1);
  const seen = new Set<string>();
  return sections.flatMap(section => {
    const [heading, ...body] = section.split('\n');
    const title = heading.replace(/^\[([^\]]+)\].*$/, '$1').trim();
    const version = versionPattern.exec(title)?.[0];
    let id = `v${(version ?? title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    if (seen.has(id)) id = `${id}-${seen.size}`;
    seen.add(id);
    const date = version ? published.get(version) : undefined;
    return [{
      id,
      title,
      date,
      versions: version ? [{ name: source.package, version }] : undefined,
      url: version && date ? `https://pub.dev/packages/${source.package}/versions/${version}` : undefined,
      content: absolutizeLinks(body.join('\n').trim(), base),
    }];
  });
}

/** Point relative links and images at the repository, since they are relative to the changelog file. */
function absolutizeLinks(markdown: string, base: string) {
  return markdown.replace(/(!?\[[^\]]*\]\()(?!https?:|mailto:|#|\/\/)([^)\s]+)/g, (_, prefix: string, target: string) => `${prefix}${new URL(target, base).href}`);
}
