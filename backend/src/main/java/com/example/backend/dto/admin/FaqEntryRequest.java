package com.example.backend.dto.admin;

import lombok.Data;

@Data
public class FaqEntryRequest {

    private String question;
    private String answer;
    private String category;
    private String locale;

    private Integer sortOrder;
    private Boolean enabled;
}
