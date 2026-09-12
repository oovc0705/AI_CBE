package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SystemNotification {

    private String id;
    private String type;
    private String title;
    private String content;
    private JsonNode data;
    private Boolean isRead;
    private String recipientId;
    private Instant createdAt;
}
