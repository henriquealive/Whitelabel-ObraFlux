# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

# Build args for public env vars (baked at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_WS_URL

COPY . .

RUN pnpm --filter @obraflux/shared build
RUN pnpm --filter web build

# ── Stage 3: development ───────────────────────────────────────────────────────
FROM deps AS development
WORKDIR /app

COPY . .

RUN pnpm --filter @obraflux/shared build

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "dev"]

# ── Stage 4: production (standalone output) ────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Add non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Next.js standalone build
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/healthz || exit 1

CMD ["node", "apps/web/server.js"]
