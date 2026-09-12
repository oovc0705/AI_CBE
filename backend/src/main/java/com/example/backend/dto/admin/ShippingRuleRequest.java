package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ShippingRuleRequest {

    private String region;

    @JsonProperty("country_code")
    private String countryCode;

    @JsonProperty("first_unit")
    private Double firstUnit;

    @JsonProperty("first_unit_fee")
    private Double firstUnitFee;

    @JsonProperty("additional_unit")
    private Double additionalUnit;

    @JsonProperty("additional_unit_fee")
    private Double additionalUnitFee;
}
