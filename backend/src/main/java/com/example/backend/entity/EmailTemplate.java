package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EmailTemplate {

    private String id;
    private String name;
    private String code;
    private String subject;
    private String bodyHtml;
    private JsonNode variables;
    private Instant createdAt;
    private Instant updatedAt;
}
