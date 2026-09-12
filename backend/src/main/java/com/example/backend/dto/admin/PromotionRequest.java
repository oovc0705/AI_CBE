package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
public class PromotionRequest {

    private String name;
    private String type;

    @JsonProperty("discount_type")
    private String discountType;

    @JsonProperty("discount_value")
    private Double discountValue;

    @JsonProperty("min_order_amount")
    private Double minOrderAmount;

    @JsonProperty("max_discount")
    private Double maxDiscount;

    @JsonProperty("usage_limit")
    private Integer usageLimit;

    @JsonProperty("starts_at")
    private Instant startsAt;

    @JsonProperty("ends_at")
    private Instant endsAt;

    @JsonProperty("applicable_product_ids")
    private JsonNode applicableProductIds;

    private Boolean enabled;
}
