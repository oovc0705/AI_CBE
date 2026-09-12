package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentGateway {

    private String id;
    private String name;
    private String displayName;
    private Boolean enabled;
    private Boolean connected;
    private JsonNode config;
    private String lastFourDigits;
    private Instant createdAt;
    private Instant updatedAt;
}
