package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.entity.Brand;
import com.example.backend.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandService brandService;

    @GetMapping
    public Result<Page<Brand>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("id").descending());
        return Result.success(brandService.list(pageable));
    }

    @GetMapping("/{id}")
    public Result<Brand> getById(@PathVariable Long id) {
        Brand brand = brandService.getById(id);
        if (brand == null) {
            return Result.error(404, "Brand not found");
        }
        return Result.success(brand);
    }

    @PostMapping
    public Result<Brand> create(@RequestBody Brand brand) {
        return Result.success(brandService.create(brand));
    }

    @PutMapping("/{id}")
    public Result<Brand> update(@PathVariable Long id, @RequestBody Brand brand) {
        Brand updated = brandService.update(id, brand);
        if (updated == null) {
            return Result.error(404, "Brand not found");
        }
        return Result.success(updated);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        if (!brandService.delete(id)) {
            return Result.error(404, "Brand not found");
        }
        return Result.success();
    }
}
