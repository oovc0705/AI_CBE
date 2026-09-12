package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SystemNotificationRequest {

    @JsonProperty("is_read")
    private Boolean isRead;
}
