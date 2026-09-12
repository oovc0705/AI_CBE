package com.example.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class ProductVariantRequest {
    private Long id;
    private String sku;
    private Map<String, String> attributes;
    private BigDecimal price;
    private Integer stock;
    private Boolean enabled;
}
