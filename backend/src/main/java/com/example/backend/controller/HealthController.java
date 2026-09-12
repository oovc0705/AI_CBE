package com.example.backend.controller;

import com.example.backend.common.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;
    private final RedisConnectionFactory redisConnectionFactory;

    @Autowired
    public HealthController(DataSource dataSource, RedisConnectionFactory redisConnectionFactory) {
        this.dataSource = dataSource;
        this.redisConnectionFactory = redisConnectionFactory;
    }

    @GetMapping
    public Result<Map<String, Object>> health() {
        Map<String, Object> details = new LinkedHashMap<>();
        String overallStatus = "UP";

        // Database check
        try (Connection conn = dataSource.getConnection()) {
            conn.isValid(2);
            details.put("db", Map.of("status", "UP"));
        } catch (Exception e) {
            details.put("db", Map.of("status", "DOWN", "error", e.getMessage()));
            overallStatus = "DOWN";
        }

        // Redis check
        try {
            redisConnectionFactory.getConnection().ping();
            details.put("redis", Map.of("status", "UP"));
        } catch (Exception e) {
            details.put("redis", Map.of("status", "DOWN", "error", e.getMessage()));
            overallStatus = "DOWN";
        }

        details.put("status", overallStatus);
        return Result.success(details);
    }
}
