package com.example.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Request logging filter — records method, path, status, duration.
 * Sensitive data (Authorization header, query params with tokens) is masked.
 */
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private static final long SLOW_THRESHOLD_MS = 3000;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        long start = System.currentTimeMillis();
        String method = request.getMethod();
        String path = sanitizePath(request.getRequestURI());

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - start;
            int status = response.getStatus();

            if (duration > SLOW_THRESHOLD_MS) {
                log.warn("[SLOW] {} {} -> {} ({}ms)", method, path, status, duration);
            } else {
                log.info("{} {} -> {} ({}ms)", method, path, status, duration);
            }
        }
    }

    /** Mask sensitive path segments (tokens, passwords, etc.) */
    private String sanitizePath(String uri) {
        if (uri == null) return "/unknown";
        // Mask paths containing sensitive keywords
        return uri.replaceAll("(token|password|secret|key)=([^&]*)", "$1=***");
    }

    /** Skip static resources and actuator to reduce noise */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.startsWith("/swagger-ui")
                || uri.startsWith("/v3/api-docs")
                || uri.endsWith(".ico")
                || uri.endsWith(".css")
                || uri.endsWith(".js");
    }
}
