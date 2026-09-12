package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLog {

    private String id;
    private String action;
    private String resourceType;
    private String resourceId;
    private String userId;
    private String userName;
    private JsonNode details;
    private String ipAddress;
    private Instant createdAt;
}
