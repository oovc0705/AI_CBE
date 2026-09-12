package com.example.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Validates critical environment variables at startup.
 * If any required config is missing, the application fails fast with a clear message.
 */
@Component
public class StartupEnvValidator {

    private static final Logger log = LoggerFactory.getLogger(StartupEnvValidator.class);

    @Value("${spring.datasource.url:}")
    private String databaseUrl;

    @Value("${spring.datasource.username:}")
    private String databaseUsername;

    @Value("${spring.datasource.password:}")
    private String databasePassword;

    @Value("${spring.data.redis.host:}")
    private String redisHost;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    /** 曾随源码公开的演示默认值，严禁在任何环境使用 */
    private static final String KNOWN_DEV_JWT_SECRET = "change-me-in-production-32-char-secret";

    @EventListener(ApplicationReadyEvent.class)
    public void validate() {
        StringBuilder missing = new StringBuilder();

        if (isBlank(databaseUrl)) {
            missing.append("  - DATABASE_URL (spring.datasource.url)\n");
        }
        if (isBlank(databaseUsername)) {
            missing.append("  - DATABASE_USERNAME (spring.datasource.username)\n");
        }
        if (isBlank(databasePassword)) {
            missing.append("  - DATABASE_PASSWORD (spring.datasource.password)\n");
        }
        if (isBlank(redisHost)) {
            missing.append("  - REDIS_HOST (spring.data.redis.host)\n");
        }
        if (isBlank(jwtSecret)) {
            missing.append("  - JWT_SECRET (jwt.secret)\n");
        } else if (KNOWN_DEV_JWT_SECRET.equals(jwtSecret)) {
            missing.append("  - JWT_SECRET (jwt.secret) 仍为源码公开的演示默认值，必须更换\n");
        } else if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            missing.append("  - JWT_SECRET (jwt.secret) 长度不足 32 字节\n");
        }

        if (!missing.isEmpty()) {
            String msg = "Startup failed — missing required environment variables:\n" + missing;
            log.error(msg);
            throw new IllegalStateException(msg);
        }

        log.info("Environment validation passed. All required variables are set.");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
