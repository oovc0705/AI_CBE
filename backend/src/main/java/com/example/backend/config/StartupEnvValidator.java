package com.example.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

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
