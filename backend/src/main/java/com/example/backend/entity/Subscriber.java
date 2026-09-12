package com.example.backend.entity;

import lombok.Data;
import java.time.Instant;

/**
 * 邮件订阅者实体
 */
@Data
public class Subscriber {
    private Long id;
    private String email;
    private String source;
    private Boolean active;
    private Instant subscribedAt;
    private Instant unsubscribedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
