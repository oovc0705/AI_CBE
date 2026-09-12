package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TranslationValue {

    private String id;
    private String keyId;
    private String locale;
    private String value;
    private Boolean isTranslated;
    private String updatedBy;
    private Instant createdAt;
    private Instant updatedAt;
}
