package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.PageResponse;
import com.example.backend.entity.Product;
import com.example.backend.entity.ProductStatus;
import com.example.backend.service.ProductService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 管理员商品操作 API（供 AI Copilot 调用）。
 */
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @GetMapping
    public Result<PageResponse<Product>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productService.list(keyword, pageable);
        PageResponse<Product> response = new PageResponse<>();
        response.setContent(productPage.getContent());
        response.setTotalElements(productPage.getTotalElements());
        response.setTotalPages(productPage.getTotalPages());
        response.setNumber(productPage.getNumber());
        response.setSize(productPage.getSize());
        return Result.success(response);
    }

    @GetMapping("/{id}")
    public Result<Product> getById(@PathVariable Long id) {
        try {
            Product product = productService.getById(id);
            return Result.success(product);
        } catch (RuntimeException e) {
            return Result.error(404, e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        try {
            productService.delete(id);
            return Result.success(null, "删除成功");
        } catch (RuntimeException e) {
            return Result.error(404, e.getMessage());
        }
    }

    @PostMapping("/{id}/price")
    public Result<Product> updatePrice(@PathVariable Long id, @RequestBody PriceRequest body) {
        try {
            return Result.success(productService.updatePrice(id, body.getPrice()));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/{id}/status")
    public Result<Product> setStatus(@PathVariable Long id, @RequestBody StatusRequest body) {
        try {
            ProductStatus status = ProductStatus.valueOf(body.getStatus().toUpperCase());
            return Result.success(productService.setStatus(id, status));
        } catch (IllegalArgumentException e) {
            return Result.error(400, "Invalid status");
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/{id}/restock")
    public Result<Product> restock(@PathVariable Long id, @RequestBody RestockRequest body) {
        try {
            return Result.success(productService.restock(id, body.getQuantity()));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/batch/price")
    public Result<List<Product>> batchUpdatePrices(@RequestBody BatchPriceRequest body) {
        try {
            return Result.success(productService.batchUpdatePrices(body.getItems()));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/batch/status")
    public Result<List<Product>> batchSetStatus(@RequestBody BatchStatusRequest body) {
        try {
            ProductStatus status = ProductStatus.valueOf(body.getStatus().toUpperCase());
            return Result.success(productService.batchSetStatus(body.getProductIds(), status));
        } catch (IllegalArgumentException e) {
            return Result.error(400, "Invalid status");
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/batch/restock")
    public Result<List<Product>> batchRestock(@RequestBody BatchRestockRequest body) {
        try {
            return Result.success(productService.batchRestock(body.getItems()));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @Data
    public static class PriceRequest {
        private BigDecimal price;
    }

    @Data
    public static class StatusRequest {
        private String status;
    }

    @Data
    public static class RestockRequest {
        private Integer quantity;
    }

    @Data
    public static class BatchPriceRequest {
        private List<Map<String, Object>> items;
    }

    @Data
    public static class BatchStatusRequest {
        private List<Long> productIds;
        private String status;
    }

    @Data
    public static class BatchRestockRequest {
        private List<Map<String, Object>> items;
    }
}
