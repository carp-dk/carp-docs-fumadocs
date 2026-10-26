import { createFileRoute } from '@tanstack/react-router';
import { buildReferenceGraph } from '@/lib/docs-graph';

export const Route = createFileRoute('/api/docs-graph')({
  server: { handlers: { GET: async () => Response.json(await buildReferenceGraph(), { headers: { 'Cache-Control': 'public, max-age=300' } }) } },
});
