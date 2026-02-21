FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
# Prisma schema engine requires OpenSSL on Alpine
RUN apk add --no-cache openssl

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p public
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Prisma runtime (query engine)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Prisma CLI (migrate deploy)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
# Run migrations; if failed migration state (P3009), reset schema and retry; then start server
CMD ["sh", "-c", "out=$(node node_modules/prisma/build/index.js migrate deploy 2>&1); if echo \"$out\" | grep -q 'P3009'; then echo 'Resetting failed migration state...'; printf 'DROP SCHEMA IF EXISTS public CASCADE;\\nCREATE SCHEMA public;\\n' | node node_modules/prisma/build/index.js db execute --schema prisma/schema.prisma --stdin; node node_modules/prisma/build/index.js migrate deploy; else echo \"$out\"; fi && node server.js"]
