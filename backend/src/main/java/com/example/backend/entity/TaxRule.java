package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaxRule {

    private String id;
    private String name;
    private String countryCode;
    private String regionCode;
    private Double taxRate;
    private String taxType;
    private Boolean isShippingTaxable;
    private Boolean enabled;
    private Integer priority;
    private Instant createdAt;
    private Instant updatedAt;
}
