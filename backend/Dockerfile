# ================= 构建阶段 =================
FROM eclipse-temurin:23-jdk-alpine AS builder

WORKDIR /app

# 先复制依赖描述文件，利用 Docker 缓存层
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline -B

# 复制源码并构建
COPY src src
RUN ./mvnw clean package -DskipTests -B && \
    mkdir -p target/dependency && \
    (cd target/dependency; jar -xf ../*.jar)

# ================= 运行阶段 =================
FROM eclipse-temurin:23-jre-alpine

WORKDIR /app

# 创建非 root 用户运行应用
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 从构建阶段复制分层 jar 内容
COPY --from=builder /app/target/dependency/BOOT-INF/lib /app/lib
COPY --from=builder /app/target/dependency/META-INF /app/META-INF
COPY --from=builder /app/target/dependency/BOOT-INF/classes /app

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

# Spring Boot 分层启动
ENTRYPOINT ["java", "-cp", "/app:/app/lib/*", "com.example.backend.BackendApplication"]
