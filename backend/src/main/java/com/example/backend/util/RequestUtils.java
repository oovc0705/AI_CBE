package com.example.backend.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 请求相关的通用工具。
 */
public final class RequestUtils {

    private RequestUtils() {
    }

    /** 取客户端 IP：优先 X-Forwarded-For 首段（反向代理场景）。 */
    public static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
