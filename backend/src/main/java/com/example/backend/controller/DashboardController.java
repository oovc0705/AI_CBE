package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public Result<Map<String, Object>> getOverview() {
        return Result.success(dashboardService.getOverview());
    }

    @GetMapping("/sales-trend")
    public Result<List<Map<String, Object>>> getSalesTrend(
            @RequestParam(defaultValue = "30") int days) {
        return Result.success(dashboardService.getSalesTrend(days));
    }

    @GetMapping("/top-products")
    public Result<List<Map<String, Object>>> getTopProducts(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "10") int limit) {
        return Result.success(dashboardService.getTopProducts(days, limit));
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats() {
        return Result.success(dashboardService.getOverview());
    }
}
