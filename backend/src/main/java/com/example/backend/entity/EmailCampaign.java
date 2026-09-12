package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EmailCampaign {

    private String id;
    private String name;
    private String templateId;
    private String subject;
    private String bodyHtml;
    private String status;
    private Integer recipientCount;
    private Integer sentCount;
    private Instant scheduledAt;
    private Instant sentAt;
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}
