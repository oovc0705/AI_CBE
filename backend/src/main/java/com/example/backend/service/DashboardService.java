package com.example.backend.service;

import com.example.backend.mapper.OrderMapper;
import com.example.backend.mapper.ProductMapper;
import com.example.backend.mapper.SupportRequestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderMapper orderMapper;
    private final ProductMapper productMapper;
    private final SupportRequestMapper supportRequestMapper;

    // region debug-point dashboard-overview
    private static final String DEBUG_URL = System.getenv().getOrDefault("DEBUG_SERVER_URL", "http://127.0.0.1:7777/event");
    private static final String SESSION_ID = System.getenv().getOrDefault("DEBUG_SESSION_ID", "dashboard-copilot-subscriber");

    private void debugLog(String hypothesisId, String message, Object payload) {
        try {
            URL url = new URL(DEBUG_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(500);
            conn.setReadTimeout(500);

            Map<String, Object> body = new HashMap<>();
            body.put("sessionId", SESSION_ID);
            body.put("hypothesisId", hypothesisId);
            body.put("message", message);
            body.put("payload", payload);
            body.put("timestamp", System.currentTimeMillis());

            String json = toJson(body);
            try (var out = conn.getOutputStream()) {
                out.write(json.getBytes(StandardCharsets.UTF_8));
            }
            conn.getResponseCode();
            conn.disconnect();
        } catch (Exception ignored) {
            // 调试日志不得影响业务
        }
    }

    private String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(escape(e.getKey())).append("\":");
            Object v = e.getValue();
            if (v == null) {
                sb.append("null");
            } else if (v instanceof Number || v instanceof Boolean) {
                sb.append(v);
            } else {
                sb.append("\"").append(escape(String.valueOf(v))).append("\"");
            }
        }
        sb.append("}");
        return sb.toString();
    }

    private String escape(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
    // endregion debug-point dashboard-overview

    public Map<String, Object> getOverview() {
        Map<String, Object> overview = new HashMap<>();

        List<String> paidStatuses = List.of("PAID", "SHIPPED", "COMPLETED");
        List<String> allActiveStatuses = List.of("PENDING", "PAID", "SHIPPED", "COMPLETED");

        debugLog("H2", "status filters", Map.of("paidStatuses", paidStatuses, "allActiveStatuses", allActiveStatuses));

        BigDecimal todayRevenue = orderMapper.sumTotalAmountByStatusInAndCreatedAtAfterDays(paidStatuses, 0);
        BigDecimal sevenDayRevenue = orderMapper.sumTotalAmountByStatusInAndCreatedAtAfterDays(paidStatuses, 7);
        BigDecimal thirtyDayRevenue = orderMapper.sumTotalAmountByStatusInAndCreatedAtAfterDays(paidStatuses, 30);

        long todayOrders = orderMapper.countByStatusInAndCreatedAtAfterDays(allActiveStatuses, 0);
        long sevenDayOrders = orderMapper.countByStatusInAndCreatedAtAfterDays(allActiveStatuses, 7);
        long totalOrders = orderMapper.countAll();

        long totalProducts = productMapper.countAll();
        long lowStockProducts = productMapper.countLowStock(10);

        long openTickets = supportRequestMapper.countByStatus("OPEN");
        long pendingTickets = supportRequestMapper.countByStatus("IN_PROGRESS");

        overview.put("todayRevenue", todayRevenue);
        overview.put("sevenDayRevenue", sevenDayRevenue);
        overview.put("thirtyDayRevenue", thirtyDayRevenue);
        overview.put("todayOrders", todayOrders);
        overview.put("sevenDayOrders", sevenDayOrders);
        overview.put("totalOrders", totalOrders);
        overview.put("totalProducts", totalProducts);
        overview.put("lowStockProducts", lowStockProducts);
        overview.put("openTickets", openTickets);
        overview.put("pendingTickets", pendingTickets);

        debugLog("H4", "overview result", overview);

        return overview;
    }

    public List<Map<String, Object>> getSalesTrend(int days) {
        return orderMapper.getDailySalesTrend(Math.min(days, 90));
    }

    public List<Map<String, Object>> getTopProducts(int days, int limit) {
        return orderMapper.getTopSellingProducts(Math.min(days, 90), Math.min(limit, 20));
    }
}
