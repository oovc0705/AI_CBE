package com.example.backend.dto;

import com.example.backend.entity.Product;
import com.example.backend.entity.ProductStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductSearchDto {
    private Long id;
    private String slug;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private String category;
    private String brand;
    private String brandLogoUrl;
    private Integer stock;
    private ProductStatus status;

    public static ProductSearchDto from(Product product) {
        ProductSearchDto dto = new ProductSearchDto();
        dto.setId(product.getId());
        dto.setSlug(product.getSlug());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setImageUrl(product.getImageUrl());
        dto.setCategory(product.getCategory());
        dto.setBrand(product.getBrand());
        dto.setBrandLogoUrl(product.getBrandLogoUrl());
        dto.setStock(product.getStock());
        dto.setStatus(product.getStatus());
        return dto;
    }
}
