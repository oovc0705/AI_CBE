package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShippingCarrier {

    private String id;
    private String name;
    private String code;
    private String logoUrl;
    private String contactPhone;
    private String website;
    private String trackingUrlTemplate;
    private String apiType;
    private JsonNode apiConfig;
    private Boolean enabled;
    private Integer sortOrder;
    private Instant createdAt;
    private Instant updatedAt;
}
