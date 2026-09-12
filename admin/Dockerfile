# ================= 构建阶段 =================
FROM node:22-alpine AS builder

WORKDIR /app

# 利用缓存层：先复制依赖文件
COPY package.json package-lock.json* ./
RUN npm ci

# 复制源码并构建生产包
COPY . .
RUN npm run build

# ================= 运行阶段 (Nginx 托管静态文件) =================
FROM nginx:1.25-alpine

# 复制构建产物到 Nginx 默认目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置（单页应用路由支持）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
