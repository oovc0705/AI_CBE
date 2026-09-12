package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.time.Instant;
import java.util.List;

/**
 * 分类表 - 支持多级分类与多语言名称
 */
@Data
public class Category {
    private Long id;
    private Long parentId;
    private JsonNode nameI18n;
    private String slug;
    private Instant createdAt;
    private Instant updatedAt;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String name;

    private Category parent;
    private List<Category> children;
    private List<Product> products;
}
