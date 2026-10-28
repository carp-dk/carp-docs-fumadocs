# syntax=docker/dockerfile:1

# Production image for the CARP docs: a Node server (Nitro) that serves the prerendered pages,
# search, Ask AI and the Open Graph images. Built and published by .github/workflows/docker.yml.

# --- Build: install with Bun (it applies the M3E patch in patches/) and build the site ---
FROM oven/bun:1.4.4 AS build
# Vite runs on Node, as in local builds, rather than on Bun's Node fallback: Bun counts packages
# such as undici and ws as built-in modules, so a build on Bun leaves them out of the server bundle,
# and the runtime image has no node_modules to find them in.
COPY --from=node:24-bookworm-slim /usr/local/bin/node /usr/local/bin/node
WORKDIR /app

COPY package.json bun.lock ./
COPY patches ./patches
RUN bun install --frozen-lockfile

COPY . .
# The public URL used for canonical links, Open Graph and the sitemap.
ARG VITE_SITE_URL=https://docs.carp.dk
ENV VITE_SITE_URL=$VITE_SITE_URL NITRO_PRESET=node-server
# A production build: minified, prerendered, with precompressed static files.
RUN NODE_ENV=production bun run build

# --- Runtime: only the self-contained server output ---
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
USER node
# Fail the image build when the server cannot serve pages from .output alone, for example when the
# bundle imports a package that the build left out.
RUN node --input-type=module <<'EOF'
import { spawn } from 'node:child_process';
const server = spawn(process.execPath, ['.output/server/index.mjs'], { env: { ...process.env, HOST: '127.0.0.1', PORT: '3999' }, stdio: 'inherit' });
let failure = 'the server did not answer';
for (let attempt = 0; attempt < 40 && failure; attempt++) {
  await new Promise(resolve => setTimeout(resolve, 500));
  failure = '';
  for (const path of ['/docs', '/docs/backend-api', '/llms.txt', '/sitemap.xml']) {
    const response = await fetch(`http://127.0.0.1:3999${path}`, { signal: AbortSignal.timeout(10_000) }).catch(error => error);
    if (!response.ok) failure ||= `${path}: ${response.status ?? response.message}`;
  }
}
server.kill();
if (failure) {
  console.error(`The server failed the smoke test (${failure}).`);
  process.exit(1);
}
EOF
EXPOSE 3000

# OPENROUTER_API_KEY (and optionally OPENROUTER_MODEL) are read at runtime: set them on the
# container, never in the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/docs').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

CMD ["node", ".output/server/index.mjs"]
