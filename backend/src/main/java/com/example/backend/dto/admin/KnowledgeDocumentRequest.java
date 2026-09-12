package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class KnowledgeDocumentRequest {

    private String title;
    private String collection;

    @JsonProperty("document_type")
    private String documentType;

    @JsonProperty("file_url")
    private String fileUrl;

    @JsonProperty("file_name")
    private String fileName;

    @JsonProperty("file_size")
    private Integer fileSize;

    private String content;
    private String source;
    private JsonNode metadata;
}
