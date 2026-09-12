package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class KnowledgeDocument {

    private String id;
    private String title;
    private String collection;
    private String documentType;
    private String fileUrl;
    private String fileName;
    private Integer fileSize;
    private String content;
    private String source;
    private JsonNode metadata;
    private String status;
    private Integer chunkCount;
    private String errorMessage;
    private Instant trainedAt;
    private String uploadedBy;
    private Instant createdAt;
    private Instant updatedAt;
}
