# Detention & Demurrage Calculator — Docker Build
# Stateless tool — no database required
# Run from the monorepo root: docker build -f apps/detention-calculator/Dockerfile .

FROM node:20-alpine AS base

# ─── Install dependencies ────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/detention-calculator/package.json ./apps/detention-calculator/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY packages/freight-core/package.json ./packages/freight-core/

RUN npm ci

# ─── Build ───────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/detention-calculator
RUN npm run build

# ─── Production ──────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3011

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/detention-calculator/.next/standalone ./
COPY --from=builder /app/apps/detention-calculator/.next/static ./.next/static

USER nextjs

EXPOSE 3011

CMD ["node", "server.js"]
