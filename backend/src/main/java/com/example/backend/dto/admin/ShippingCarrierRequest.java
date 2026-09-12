package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class ShippingCarrierRequest {

    private String name;
    private String code;

    @JsonProperty("logo_url")
    private String logoUrl;

    @JsonProperty("contact_phone")
    private String contactPhone;

    private String website;

    @JsonProperty("tracking_url_template")
    private String trackingUrlTemplate;

    @JsonProperty("api_type")
    private String apiType;

    @JsonProperty("api_config")
    private JsonNode apiConfig;

    private Boolean enabled;

    @JsonProperty("sort_order")
    private Integer sortOrder;
}
