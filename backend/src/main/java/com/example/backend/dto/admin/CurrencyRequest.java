package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CurrencyRequest {

    private String code;
    private String name;
    private String symbol;

    @JsonProperty("exchange_rate")
    private Double exchangeRate;

    private Integer decimals;

    @JsonProperty("is_default")
    private Boolean isDefault;

    private Boolean enabled;
}
