package com.example.backend.dto.admin;

import lombok.Data;

@Data
public class TranslationKeyRequest {

    private String key;
    private String namespace;
    private String description;
}
