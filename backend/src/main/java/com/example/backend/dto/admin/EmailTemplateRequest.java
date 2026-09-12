package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class EmailTemplateRequest {

    private String name;
    private String code;
    private String subject;

    @JsonProperty("body_html")
    private String bodyHtml;

    private List<String> variables;
}
