package com.example.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;

@Data
public class EmailCampaignRequest {

    private String name;

    @JsonProperty("template_id")
    private String templateId;

    private String subject;

    @JsonProperty("body_html")
    private String bodyHtml;

    @JsonProperty("scheduled_at")
    private Instant scheduledAt;

    @JsonProperty("recipient_count")
    private Integer recipientCount;
}
