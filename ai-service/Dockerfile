# ================= 构建阶段 =================
FROM python:3.12-slim AS builder

WORKDIR /app

# 安装系统依赖（如有编译需求）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 利用缓存层：先复制依赖文件
COPY requirements.txt* ./
RUN pip install --no-cache-dir --user -r requirements.txt 2>/dev/null || true

# ================= 运行阶段 =================
FROM python:3.12-slim AS runner

WORKDIR /app

# 创建非 root 用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 从构建阶段复制已安装的包
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

# 复制应用代码
COPY . .

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# 默认使用 uvicorn 运行，可根据需要替换为 gunicorn
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
