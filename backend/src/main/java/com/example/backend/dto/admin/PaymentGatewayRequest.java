package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class PaymentGatewayRequest {

    private String name;

    @JsonProperty("display_name")
    private String displayName;

    private Boolean enabled;
    private Boolean connected;
    private JsonNode config;

    @JsonProperty("last_four_digits")
    private String lastFourDigits;
}
