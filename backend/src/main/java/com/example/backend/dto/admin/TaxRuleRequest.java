package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TaxRuleRequest {

    private String name;

    @JsonProperty("country_code")
    private String countryCode;

    @JsonProperty("region_code")
    private String regionCode;

    @JsonProperty("tax_rate")
    private Double taxRate;

    @JsonProperty("tax_type")
    private String taxType;

    @JsonProperty("is_shipping_taxable")
    private Boolean isShippingTaxable;

    private Boolean enabled;

    private Integer priority;
}
