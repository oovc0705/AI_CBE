# ================= 构建阶段 =================
FROM node:22-alpine AS builder

WORKDIR /app

# 利用缓存层：先复制依赖文件
COPY package.json package-lock.json* ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# ================= 运行阶段 =================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 仅复制运行所需文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
