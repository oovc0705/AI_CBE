package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class AdminRoleRequest {

    private String name;

    @JsonProperty("display_name")
    private String displayName;

    private String description;

    @JsonProperty("is_system")
    private Boolean isSystem;

    private List<String> permissions;
}
