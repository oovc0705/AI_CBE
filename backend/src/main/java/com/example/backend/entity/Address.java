package com.example.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.time.Instant;

/**
 * 收货地址表
 * address_data 使用 JSONB 灵活存储各国地址格式
 */
@Data
public class Address {
    private Long id;
    private Long userId;
    private Boolean isDefault;
    private JsonNode addressData;
    private Instant createdAt;
    private Instant updatedAt;

    private User user;
}
