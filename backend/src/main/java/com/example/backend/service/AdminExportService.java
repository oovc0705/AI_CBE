package com.example.backend.service;

import com.example.backend.mapper.OrderMapper;
import com.example.backend.mapper.PaymentTransactionMapper;
import com.example.backend.mapper.ProductMapper;
import com.example.backend.mapper.ProductReviewMapper;
import com.example.backend.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminExportService {

    private final OrderMapper orderMapper;
    private final ProductMapper productMapper;
    private final UserMapper userMapper;
    private final ProductReviewMapper productReviewMapper;
    private final PaymentTransactionMapper paymentTransactionMapper;

    public byte[] exportOrders() {
        List<Map<String, Object>> rows = orderMapper.findAllForExport();
        return toCsv(rows, List.of("id", "user_id", "total_amount", "status", "created_at"));
    }

    public byte[] exportProducts() {
        List<Map<String, Object>> rows = productMapper.findAllForExport();
        return toCsv(rows, List.of("id", "name", "price", "stock", "status", "created_at"));
    }

    public byte[] exportUsers() {
        List<Map<String, Object>> rows = userMapper.findAllForExport();
        return toCsv(rows, List.of("id", "username", "email", "role", "created_at"));
    }

    public byte[] exportReviews() {
        List<Map<String, Object>> rows = productReviewMapper.findAllForExport();
        return toCsv(rows, List.of("id", "product_id", "product_name", "user_id", "user_name", "rating", "title", "content", "status", "merchant_reply", "created_at"));
    }

    public byte[] exportTransactions() {
        List<Map<String, Object>> rows = paymentTransactionMapper.findAllForExport();
        return toCsv(rows, List.of("id", "order_id", "gateway_id", "gateway_transaction_id", "amount", "currency", "status", "created_at"));
    }

    private byte[] toCsv(List<Map<String, Object>> rows, List<String> headers) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(",", headers)).append("\n");
        for (Map<String, Object> row : rows) {
            for (int i = 0; i < headers.size(); i++) {
                if (i > 0) sb.append(",");
                Object value = row.get(headers.get(i));
                sb.append(escapeCsv(value == null ? "" : String.valueOf(value)));
            }
            sb.append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
