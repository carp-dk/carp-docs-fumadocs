'use client';

import { useEffect, useState } from 'react';
import { GitHubIcon } from '@/components/ui/brand-icons';
import { Icon } from './actions';

interface Repository { description: string | null; stargazers_count: number; forks_count: number }
export function GithubInfo({ owner, repo }: { owner: string; repo: string }) {
  const [data, setData] = useState<{ key: string; repository?: Repository; unavailable?: boolean }>();
  const key = `${owner}/${repo}`;
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { signal: controller.signal, headers: { Accept: 'application/vnd.github+json' } })
      .then(async response => { if (!response.ok) throw new Error('Repository information unavailable'); return response.json() as Promise<Repository>; })
      .then(repository => setData({ key, repository }))
      .catch(() => { if (!controller.signal.aborted) setData({ key, unavailable: true }); })
      .finally(() => window.clearTimeout(timer));
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [owner, repo, key]);
  const repository = data?.key === key ? data.repository : undefined;
  return <a className="docs-github-info not-prose" href={`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`} target="_blank" rel="noopener noreferrer">
    <GitHubIcon aria-hidden="true" /><span><strong>{key}</strong>{repository?.description && <span className="docs-github-description">{repository.description}</span>}</span>
    {repository && <span className="docs-github-stats"><span aria-label={`${repository.stargazers_count} stars`}>{new Intl.NumberFormat('en', { notation: 'compact' }).format(repository.stargazers_count)} stars</span><span>{new Intl.NumberFormat('en', { notation: 'compact' }).format(repository.forks_count)} forks</span></span>}
    <Icon name="ExternalLink" />
  </a>;
}
export const GitHubInfo = GithubInfo;
