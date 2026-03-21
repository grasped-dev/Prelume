# -------- Base --------
FROM node:18-alpine AS base
WORKDIR /app

# -------- Dependencies --------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# -------- Builder --------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_ vars are inlined at build time
ARG NEXT_PUBLIC_ELEVENLABS_AGENT_ID
ENV NEXT_PUBLIC_ELEVENLABS_AGENT_ID=$NEXT_PUBLIC_ELEVENLABS_AGENT_ID

ENV NODE_ENV=production
RUN npm run build

# -------- Runner --------
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Cloud Run sets PORT (defaults to 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
