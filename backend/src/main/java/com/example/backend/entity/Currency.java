package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Currency {

    private String id;
    private String code;
    private String name;
    private String symbol;
    private Double exchangeRate;
    private Integer decimals;
    private Boolean isDefault;
    private Boolean enabled;
    private Instant rateUpdatedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
