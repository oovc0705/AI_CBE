package com.example.backend.entity;

import lombok.Data;
import java.time.Instant;

@Data
public class SupportRequest {
    private Long id;
    private Long orderId;
    private Long userId;
    private String type = "GENERAL";
    private String subject = "";
    private String message = "";
    private String status = "OPEN";
    private String priority = "NORMAL";
    private String contactEmail;
    private String adminReply;
    private Instant repliedAt;
    private Long repliedBy;
    private String aiSuggestedReply;
    private Instant closedAt;
    private Instant createdAt;
    private Instant updatedAt;

    private String userEmail;
    private String orderNo;
}
