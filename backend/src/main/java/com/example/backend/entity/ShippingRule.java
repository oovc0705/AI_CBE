package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShippingRule {

    private String id;
    private String templateId;
    private String region;
    private String countryCode;
    private Double firstUnit;
    private Double firstUnitFee;
    private Double additionalUnit;
    private Double additionalUnitFee;
    private Instant createdAt;
}
