package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductReview {

    private String id;
    private String productId;
    private String productName;
    private String userId;
    private String userName;
    private String orderId;
    private Integer rating;
    private String title;
    private String content;
    private JsonNode images;
    private String status;
    private String merchantReply;
    private Instant repliedAt;
    private String repliedBy;
    private Instant createdAt;
    private Instant updatedAt;
}
