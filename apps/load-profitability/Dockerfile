FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/load-profitability/package.json ./apps/load-profitability/
COPY packages/ ./packages/

RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build --workspace=apps/load-profitability

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3015

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/load-profitability/.next/standalone ./
COPY --from=builder /app/apps/load-profitability/.next/static ./apps/load-profitability/.next/static
COPY --from=builder /app/apps/load-profitability/public ./apps/load-profitability/public

USER nextjs

EXPOSE 3015

CMD ["node", "apps/load-profitability/server.js"]
