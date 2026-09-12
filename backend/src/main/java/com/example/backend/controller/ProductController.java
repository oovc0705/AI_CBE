package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.ProductDetailDto;
import com.example.backend.dto.ProductSitemapDto;
import com.example.backend.dto.SearchResponse;
import com.example.backend.entity.Product;
import com.example.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public Result<Product> create(@RequestBody Product product) {
        return Result.success(productService.create(product));
    }

    @PutMapping("/{id}")
    public Result<Product> update(@PathVariable Long id, @RequestBody Product product) {
        return Result.success(productService.update(id, product));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return Result.success(null);
    }

    @DeleteMapping
    public Result<Integer> deleteByIds(@RequestParam List<Long> ids) {
        return Result.success(productService.deleteByIds(ids));
    }

    @GetMapping("/{id}")
    public Result<ProductDetailDto> getById(@PathVariable Long id) {
        return Result.success(productService.getDetailById(id));
    }

    @GetMapping
    public Result<Page<Product>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("id").descending());
        return Result.success(productService.list(keyword, pageable));
    }

    @GetMapping("/sitemap-data")
    public Result<List<ProductSitemapDto>> sitemapData() {
        return Result.success(productService.getSitemapData());
    }

    /** Public brand list for storefront filtering (multi-brand). */
    @GetMapping("/brands")
    public Result<List<java.util.Map<String, Object>>> brands() {
        return Result.success(productService.getAllBrands());
    }

    /** Public category list for storefront filtering. */
    @GetMapping("/categories")
    public Result<List<String>> categories() {
        return Result.success(productService.getAllCategories());
    }

    /**
     * Full-text search with facets, filters, and caching (TTL=5min).
     * Uses PostgreSQL tsvector + GIN index instead of LIKE '%keyword%'.
     */
    @GetMapping("/search")
    public Result<SearchResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String brands,
            @RequestParam(defaultValue = "relevance") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return Result.success(productService.search(q, category, minPrice, maxPrice, brands, sort, pageable));
    }
}
