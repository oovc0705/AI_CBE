package com.example.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Data
public class ProductSkuDto {
    private Long id;
    private String skuCode;
    private Map<String, String> attributes = new HashMap<>();
    private BigDecimal price;
    private Integer stock;
}
