# syntax=docker/dockerfile:1.6
# ─────────────────────────────────────────────────────────────
# IWX BuddySplit — Backend (NestJS) production image
# Multi-stage build → small final image, no dev deps shipped.
# ─────────────────────────────────────────────────────────────

# 1) deps: install ALL deps (incl. dev) so we can compile TS
FROM node:20-alpine AS deps
WORKDIR /app
# argon2 needs build tools on alpine
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace backend --include-workspace-root

# 2) build: compile NestJS → dist/
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY package.json package-lock.json* ./
COPY backend ./backend
WORKDIR /app/backend
RUN npx nest build

# 3) runtime: only prod deps + compiled JS
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache python3 make g++ tini \
 && addgroup -S app && adduser -S app -G app
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/package.json
RUN npm ci --workspace backend --omit=dev --include-workspace-root \
 && apk del python3 make g++ \
 && npm cache clean --force
COPY --from=build /app/backend/dist ./backend/dist
USER app
WORKDIR /app/backend
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
# Run migrations then start the API. Safe to re-run (TypeORM is idempotent).
CMD ["sh", "-c", "node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js && node dist/main.js"]
