package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TranslationKey {

    private String id;
    private String key;
    private String namespace;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;

    @JsonProperty("translations")
    private Map<String, String> translations = new HashMap<>();

    @JsonProperty("translated_locales")
    private List<String> translatedLocales = new ArrayList<>();
}
