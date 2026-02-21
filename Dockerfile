FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

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
# Run migrations then start server
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
