package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.entity.Coupon;
import com.example.backend.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping
    public Result<Page<Coupon>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("id").descending());
        return Result.success(couponService.list(pageable));
    }

    @GetMapping("/{id}")
    public Result<Coupon> getById(@PathVariable Long id) {
        Coupon coupon = couponService.getById(id);
        if (coupon == null) {
            return Result.error(404, "Coupon not found");
        }
        return Result.success(coupon);
    }

    @PostMapping
    public Result<Coupon> create(@RequestBody Coupon coupon) {
        return Result.success(couponService.create(coupon));
    }

    @PutMapping("/{id}")
    public Result<Coupon> update(@PathVariable Long id, @RequestBody Coupon coupon) {
        Coupon updated = couponService.update(id, coupon);
        if (updated == null) {
            return Result.error(404, "Coupon not found");
        }
        return Result.success(updated);
    }

    @PostMapping("/{id}/toggle")
    public Result<Coupon> toggle(@PathVariable Long id) {
        Coupon updated = couponService.toggleStatus(id);
        if (updated == null) {
            return Result.error(404, "Coupon not found");
        }
        return Result.success(updated);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        if (!couponService.delete(id)) {
            return Result.error(404, "Coupon not found");
        }
        return Result.success();
    }
}
