package com.example.backend.controller;

import com.example.backend.service.AdminExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/export")
@RequiredArgsConstructor
public class AdminExportController {

    private final AdminExportService adminExportService;

    @GetMapping("/orders")
    public ResponseEntity<byte[]> exportOrders() {
        byte[] csv = adminExportService.exportOrders();
        return downloadResponse(csv, "orders");
    }

    @GetMapping("/products")
    public ResponseEntity<byte[]> exportProducts() {
        byte[] csv = adminExportService.exportProducts();
        return downloadResponse(csv, "products");
    }

    @GetMapping("/users")
    public ResponseEntity<byte[]> exportUsers() {
        byte[] csv = adminExportService.exportUsers();
        return downloadResponse(csv, "users");
    }

    @GetMapping("/reviews")
    public ResponseEntity<byte[]> exportReviews() {
        byte[] csv = adminExportService.exportReviews();
        return downloadResponse(csv, "reviews");
    }

    @GetMapping("/transactions")
    public ResponseEntity<byte[]> exportTransactions() {
        byte[] csv = adminExportService.exportTransactions();
        return downloadResponse(csv, "transactions");
    }

    private ResponseEntity<byte[]> downloadResponse(byte[] csv, String name) {
        String filename = String.format("%s_%s.csv", name, LocalDate.now());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(csv);
    }
}
