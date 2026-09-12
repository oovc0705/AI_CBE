package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TranslationValueRequest {

    @JsonProperty("key_id")
    private String keyId;

    private String locale;
    private String value;

    @JsonProperty("is_translated")
    private Boolean isTranslated;

    @JsonProperty("updated_by")
    private String updatedBy;
}
