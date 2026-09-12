package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentTransaction {

    private String id;
    private String orderId;
    private String gatewayId;
    private String gatewayTransactionId;
    private Double amount;
    private String currency;
    private String status;
    private JsonNode rawResponse;
    private Instant createdAt;
    private Instant updatedAt;
}
