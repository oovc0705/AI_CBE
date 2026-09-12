package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ProductReviewRequest {

    private String status;

    @JsonProperty("merchant_reply")
    private String merchantReply;
}
