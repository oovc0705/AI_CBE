package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.ShippingCarrierRequest;
import com.example.backend.entity.ShippingCarrier;
import com.example.backend.service.ShippingCarrierService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/shipping/carriers")
@RequiredArgsConstructor
public class AdminShippingCarrierController {

    private final ShippingCarrierService shippingCarrierService;

    @GetMapping
    public Result<List<ShippingCarrier>> list(@RequestParam(required = false) Boolean enabled) {
        return Result.success(shippingCarrierService.list(enabled));
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody ShippingCarrierRequest req) {
        ShippingCarrier carrier = shippingCarrierService.create(req);
        return Result.success(Map.of("id", carrier.getId()), "添加成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody ShippingCarrierRequest req) {
        shippingCarrierService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        shippingCarrierService.delete(id);
        return Result.success(null, "删除成功");
    }

    @GetMapping("/{id}/track")
    public Result<Map<String, Object>> track(@PathVariable String id, @RequestParam String tracking_number) {
        ShippingCarrier carrier = shippingCarrierService.getById(id);
        if (carrier == null) {
            return Result.error(404, "物流商不存在");
        }
        // 返回模拟的物流跟踪信息
        Map<String, Object> result = new HashMap<>();
        result.put("carrier", carrier.getName());
        result.put("tracking_number", tracking_number);
        result.put("status", "IN_TRANSIT");
        List<Map<String, Object>> events = new ArrayList<>();
        Map<String, Object> e1 = new HashMap<>();
        e1.put("timestamp", "2026-06-28T10:00:00Z");
        e1.put("location", "Shanghai");
        e1.put("description", "包裹已揽收");
        events.add(e1);
        Map<String, Object> e2 = new HashMap<>();
        e2.put("timestamp", "2026-06-29T08:00:00Z");
        e2.put("location", "Shanghai Airport");
        e2.put("description", "已发往目的地");
        events.add(e2);
        Map<String, Object> e3 = new HashMap<>();
        e3.put("timestamp", "2026-06-30T06:00:00Z");
        e3.put("location", "In Transit");
        e3.put("description", "运输中");
        events.add(e3);
        result.put("events", events);
        result.put("estimated_delivery", "2026-07-02");
        return Result.success(result);
    }
}
