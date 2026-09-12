package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShippingTemplate {

    private String id;
    private String name;
    private Boolean isDefault;
    private String billingType;
    private Double freeShippingThreshold;
    private Boolean enabled;
    private Instant createdAt;
    private Instant updatedAt;

    private List<ShippingRule> rules;
}
