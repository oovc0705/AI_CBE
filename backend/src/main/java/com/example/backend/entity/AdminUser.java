package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminUser {

    private String id;
    private String email;
    private String passwordHash;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String roleId;
    private String roleName;
    private Boolean isActive;
    private Instant lastLoginAt;
    private Instant createdAt;
    private Instant updatedAt;
}
