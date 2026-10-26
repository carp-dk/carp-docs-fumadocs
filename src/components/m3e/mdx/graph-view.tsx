'use client';

import { createContext, use, useEffect, useId, useMemo, useState } from 'react';
import Link from 'fumadocs-core/link';
import { usePathname, useRouter } from 'fumadocs-core/framework';
import { Button, IconButton } from './actions';
import { TextField } from './forms';

export interface DocsGraph { nodes: { id: string; text: string; url: string }[]; links: { source: string; target: string }[] }
export const DocsGraphContext = createContext<DocsGraph>({ nodes: [], links: [] });

export function GraphView({ graph: suppliedGraph }: { graph?: DocsGraph }) {
  const context = use(DocsGraphContext);
  const [references, setReferences] = useState<DocsGraph>();
  useEffect(() => {
    if (suppliedGraph) return;
    const controller = new AbortController();
    fetch('/api/docs-graph', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Graph unavailable');
      return response.json() as Promise<DocsGraph>;
    }).then(setReferences).catch(() => { /* The page-tree graph remains usable offline. */ });
    return () => controller.abort();
  }, [suppliedGraph]);
  const graph = suppliedGraph ?? references ?? context;
  const pathname = usePathname();
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [zoom, setZoom] = useState(1);
  const id = useId();
  const nodes = useMemo(() => graph.nodes.filter(node => `${node.text} ${node.url}`.toLowerCase().includes(filter.toLowerCase())), [graph.nodes, filter]);
  const positions = useMemo(() => new Map(nodes.map((node, index) => {
    const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
    // Leave room outside the ellipse for labels instead of stacking two rings.
    const side = Math.abs(Math.cos(angle)) < 0.15 ? 0 : Math.cos(angle) > 0 ? 1 : -1;
    return [node.id, { x: 400 + Math.cos(angle) * 235, y: 270 + Math.sin(angle) * 205, side }];
  })), [nodes]);
  return <section className="docs-graph not-prose" aria-labelledby={id}>
    <div className="docs-graph-toolbar"><span id={id} className="m3-title-medium">Documentation map</span><div className="docs-component-actions">
      <Button size="extra-small" aria-label="Zoom out graph" disabled={zoom <= 0.75} onClick={() => setZoom(z => Math.max(0.75, z - 0.25))}>−</Button>
      <Button size="extra-small" aria-label="Zoom in graph" disabled={zoom >= 2} onClick={() => setZoom(z => Math.min(2, z + 0.25))}>+</Button>
      <IconButton size="extra-small" icon="RefreshCw" label="Reset graph view" onClick={() => { setZoom(1); setFilter(''); }} />
    </div></div>
    <TextField label="Find a page in the graph" value={filter} onValueChange={setFilter} />
    <div className="docs-graph-viewport"><svg viewBox={`${400 - 400 / zoom} ${270 - 270 / zoom} ${800 / zoom} ${540 / zoom}`} aria-label="Linked documentation pages">
      {graph.links.map(link => { const a = positions.get(link.source); const b = positions.get(link.target); return a && b ? <line key={`${link.source}-${link.target}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} /> : null; })}
      {nodes.map(node => { const point = positions.get(node.id)!; return <a key={node.id} href={node.url} aria-label={node.text} aria-current={pathname === node.url ? 'page' : undefined} onClick={event => {
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); router.push(node.url); }
      }}><g transform={`translate(${point.x},${point.y})`}><title>{node.text}</title><circle r={pathname === node.url ? 11 : 7} /><text x={point.side * 14} y={point.side ? 4 : point.y < 270 ? -18 : 24} textAnchor={point.side === 1 ? 'start' : point.side === -1 ? 'end' : 'middle'}>{node.text.length > 23 ? `${node.text.slice(0, 21)}…` : node.text}</text></g></a>; })}
    </svg></div>
    <p className="docs-graph-caption" role="status">{nodes.length} {nodes.length === 1 ? 'page' : 'pages'} · select a node to open its page</p>
    <details className="docs-graph-list"><summary>Browse pages as a list</summary><ul>{nodes.map(node => <li key={node.id}><Link href={node.url}>{node.text}</Link></li>)}</ul></details>
  </section>;
}
