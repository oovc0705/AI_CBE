package com.example.backend.entity;

import com.example.backend.dto.ProductTranslationRequest;
import com.example.backend.dto.ProductVariantRequest;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Product {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private String category;
    private Instant createdAt;
    private Instant updatedAt;

    private Long brandId;
    private Long categoryId;
    private String slug;
    private ProductStatus status;
    private JsonNode titleI18n;
    private JsonNode descI18n;
    private JsonNode metaSeo;
    private JsonNode images;

    private String brand;
    private String brandLogoUrl;
    private Integer stock;

    private transient List<ProductSku> skus;

    private String sku;
    private List<ProductTranslationRequest> translations;
    private List<ProductVariantRequest> variants;
}
