package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Promotion {

    private String id;
    private String name;
    private String type;
    private String discountType;
    private Double discountValue;
    private Double minOrderAmount;
    private Double maxDiscount;
    private Integer usageLimit;
    private Integer usedCount;
    private Instant startsAt;
    private Instant endsAt;
    private JsonNode applicableProductIds;
    private Boolean enabled;
    private Instant createdAt;
    private Instant updatedAt;
}
