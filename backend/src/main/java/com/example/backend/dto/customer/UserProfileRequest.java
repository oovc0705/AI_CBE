package com.example.backend.dto.customer;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

/**
 * C端用户个人资料更新请求
 */
@Data
public class UserProfileRequest {

    private String firstName;

    private String lastName;

    private String phone;

    private String avatarUrl;

    private String language;

    private String currency;

    private JsonNode preferences;
}
