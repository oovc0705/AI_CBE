package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.entity.Subscriber;
import com.example.backend.service.SubscriberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Pattern;

/**
 * 邮件订阅控制器（C端订阅入口）。
 * 管理端接口统一在 AdminSubscriberController。
 */
@RestController
@RequiredArgsConstructor
public class SubscriberController {

    private final SubscriberService subscriberService;

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    /**
     * C端订阅接口
     */
    @PostMapping("/api/subscribers")
    public ResponseEntity<Result<Subscriber>> subscribe(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank() || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            return ResponseEntity.badRequest()
                    .body(Result.error(400, "Invalid email format"));
        }

        SubscriberService.SubscribeResult result = subscriberService.subscribe(email.trim().toLowerCase());
        if (result.isNew()) {
            Result<Subscriber> res = Result.success(result.subscriber());
            res.setCode(201);
            res.setMessage("Subscribed successfully");
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        }
        Result<Subscriber> res = Result.success(result.subscriber());
        res.setMessage("Already subscribed");
        return ResponseEntity.ok(res);
    }
}
