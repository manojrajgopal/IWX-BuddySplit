# syntax=docker/dockerfile:1.6
# ─────────────────────────────────────────────────────────────
# IWX BuddySplit — Frontend (Next.js) production image
# Uses Next.js "standalone" output → tiny runtime image.
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci --workspace frontend --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY package.json package-lock.json* ./
COPY frontend ./frontend
WORKDIR /app/frontend
# Public env vars baked at build time. Pass via --build-arg at `docker build`.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_WS_PATH=/realtime
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_WS_PATH=$NEXT_PUBLIC_WS_PATH
RUN npm run build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
RUN apk add --no-cache tini \
 && addgroup -S app && adduser -S app -G app
# Standalone bundle + static assets + public/
COPY --from=build --chown=app:app /app/frontend/.next/standalone ./
COPY --from=build --chown=app:app /app/frontend/.next/static ./frontend/.next/static
COPY --from=build --chown=app:app /app/frontend/public ./frontend/public
USER app
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "frontend/server.js"]
