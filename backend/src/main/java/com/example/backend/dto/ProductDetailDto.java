package com.example.backend.dto;

import com.example.backend.entity.Product;
import com.example.backend.entity.ProductSku;
import com.example.backend.entity.ProductStatus;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Data
public class ProductDetailDto {
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
    private List<String> images;
    private List<ProductSkuDto> skus;

    public static ProductDetailDto from(Product product, List<ProductSku> skuList) {
        ProductDetailDto dto = new ProductDetailDto();
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
        dto.setImages(toImageList(product.getImages()));
        if (skuList != null) {
            dto.setSkus(skuList.stream().map(ProductDetailDto::toSkuDto).toList());
        }
        return dto;
    }

    private static List<String> toImageList(JsonNode images) {
        List<String> list = new ArrayList<>();
        if (images != null && images.isArray()) {
            Iterator<JsonNode> it = images.elements();
            while (it.hasNext()) {
                JsonNode node = it.next();
                if (node.isTextual()) {
                    list.add(node.asText());
                }
            }
        }
        return list;
    }

    private static ProductSkuDto toSkuDto(ProductSku sku) {
        ProductSkuDto dto = new ProductSkuDto();
        dto.setId(sku.getId());
        dto.setSkuCode(sku.getSkuCode());
        if (sku.getAttributes() != null && sku.getAttributes().isObject()) {
            sku.getAttributes().fields().forEachRemaining(entry ->
                    dto.getAttributes().put(entry.getKey(), entry.getValue().asText()));
        }
        dto.setPrice(sku.getPrice());
        dto.setStock(sku.getStock());
        return dto;
    }
}
