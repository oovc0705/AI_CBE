package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.entity.Subscriber;
import com.example.backend.service.SubscriberService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 订阅者管理 API（管理端）。
 */
@RestController
@RequestMapping("/api/admin/subscribers")
@RequiredArgsConstructor
public class AdminSubscriberController {

    private final SubscriberService subscriberService;

    @GetMapping
    public Result<Page<Subscriber>> list(
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("id").descending());
        return Result.success(subscriberService.list(active, pageable));
    }

    @GetMapping("/{id}")
    public Result<Subscriber> getById(@PathVariable Long id) {
        Subscriber subscriber = subscriberService.getById(id);
        if (subscriber == null) {
            return Result.error(404, "Subscriber not found");
        }
        return Result.success(subscriber);
    }

    @PutMapping("/{id}")
    public Result<Subscriber> update(@PathVariable Long id, @RequestBody SubscriberUpdateRequest body) {
        Subscriber subscriber = new Subscriber();
        subscriber.setEmail(body.getEmail());
        subscriber.setSource(body.getSource());
        subscriber.setActive(body.getActive());
        Subscriber updated = subscriberService.update(id, subscriber);
        if (updated == null) {
            return Result.error(404, "Subscriber not found");
        }
        return Result.success(updated);
    }

    @PostMapping("/{id}/toggle")
    public Result<Void> toggleActive(@PathVariable Long id) {
        if (!subscriberService.toggleActive(id)) {
            return Result.error(404, "Subscriber not found");
        }
        return Result.success();
    }

    @GetMapping("/stats")
    public Result<Map<String, Long>> stats() {
        return Result.success(subscriberService.stats());
    }

    @Data
    public static class SubscriberUpdateRequest {
        private String email;
        private String source;
        private Boolean active;
    }
}
