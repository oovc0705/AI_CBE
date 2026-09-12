package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class ShippingTemplateRequest {

    private String name;

    @JsonProperty("billing_type")
    private String billingType;

    @JsonProperty("free_shipping_threshold")
    private Double freeShippingThreshold;

    @JsonProperty("is_default")
    private Boolean isDefault;

    private Boolean enabled;

    private List<ShippingRuleRequest> rules;
}
