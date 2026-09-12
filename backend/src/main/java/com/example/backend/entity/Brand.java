package com.example.backend.entity;

import lombok.Data;
import java.time.Instant;
import java.util.List;

/**
 * 品牌表 - 支持多品牌需求
 */
@Data
public class Brand {
    private Long id;
    private String name;
    private String slug;
    private String logoUrl;
    private Instant createdAt;
    private Instant updatedAt;

    private List<Product> products;
}
