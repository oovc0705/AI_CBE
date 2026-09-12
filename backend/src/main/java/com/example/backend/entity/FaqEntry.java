package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FaqEntry {

    private String id;
    private String question;
    private String answer;
    private String category;
    private String locale;
    private Integer sortOrder;
    private Boolean enabled;
    private Instant createdAt;
    private Instant updatedAt;
}
