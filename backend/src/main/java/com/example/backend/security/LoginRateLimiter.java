package com.example.backend.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 登录速率限制：Redis 计数，多副本部署下共享同一窗口。
 *
 * Redis 不可用时降级为单实例内存计数（fail-open 但仍有基本防护），
 * 并记录 warn——不要因为缓存故障把所有用户挡在门外。
 */
@Slf4j
@Component
public class LoginRateLimiter {

    private final StringRedisTemplate redis;

    @Value("${app.login-rate-limit.max-attempts:10}")
    private int maxAttempts;

    @Value("${app.login-rate-limit.window-seconds:60}")
    private long windowSeconds;

    private final Map<String, Attempt> localFallback = new ConcurrentHashMap<>();

    public LoginRateLimiter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /** 记录一次尝试并判断是否已超限。key 建议为 "login:" + 客户端 IP。 */
    public boolean isLimited(String key) {
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, Duration.ofSeconds(windowSeconds));
            }
            return count != null && count > maxAttempts;
        } catch (Exception e) {
            log.warn("Redis rate limit unavailable, falling back to in-memory counter: {}", e.getMessage());
            return isLimitedLocally(key);
        }
    }

    /** 登录成功后清除计数，避免正常用户被自己的成功请求累积限流。 */
    public void reset(String key) {
        try {
            redis.delete(key);
        } catch (Exception e) {
            log.warn("Failed to reset rate limit key {}: {}", key, e.getMessage());
        }
        localFallback.remove(key);
    }

    private boolean isLimitedLocally(String key) {
        long now = System.currentTimeMillis();
        Attempt attempt = localFallback.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart > windowSeconds * 1000) {
                return new Attempt(new AtomicInteger(0), now);
            }
            return existing;
        });
        return attempt.count.incrementAndGet() > maxAttempts;
    }

    private static final class Attempt {
        final AtomicInteger count;
        final long windowStart;

        Attempt(AtomicInteger count, long windowStart) {
            this.count = count;
            this.windowStart = windowStart;
        }
    }
}
