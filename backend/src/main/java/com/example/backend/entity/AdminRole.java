package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminRole {

    private String id;
    private String name;
    private String displayName;
    private String description;
    private Boolean isSystem;
    private JsonNode permissions;
    private Instant createdAt;
    private Instant updatedAt;
}
