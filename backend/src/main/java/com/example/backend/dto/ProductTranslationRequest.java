package com.example.backend.dto;

import lombok.Data;

@Data
public class ProductTranslationRequest {
    private String locale;
    private String name;
    private String description;
}
