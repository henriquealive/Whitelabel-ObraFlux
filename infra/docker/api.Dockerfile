# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/database/package.json ./packages/database/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY . .

RUN pnpm --filter @obraflux/shared build
RUN pnpm --filter @obraflux/database generate
RUN pnpm --filter api build

# ── Stage 3: development (with hot reload) ─────────────────────────────────────
FROM deps AS development
WORKDIR /app

COPY . .

RUN pnpm --filter @obraflux/shared build
RUN pnpm --filter @obraflux/database generate

EXPOSE 3001
CMD ["pnpm", "--filter", "api", "dev"]

# ── Stage 4: production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production

# Copy root manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/database/package.json ./packages/database/package.json

# Install production deps only
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built artefacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/database/generated ./packages/database/generated
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Run prisma db push then start the API
CMD ["sh", "-c", "cd packages/database && npx prisma db push --accept-data-loss && cd /app && node apps/api/dist/main.js"]
