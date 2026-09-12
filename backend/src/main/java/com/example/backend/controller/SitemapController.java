package com.example.backend.controller;

import com.example.backend.dto.ProductSitemapDto;
import com.example.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class SitemapController {

    private final ProductService productService;

    @Value("${app.site-url:https://mystore.com}")
    private String siteUrl;

    private static final DateTimeFormatter W3C_DATE =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX")
                    .withZone(ZoneOffset.UTC);

    private static final String[] STATIC_PATHS = {
            "/",
            "/about",
            "/shipping-policy",
            "/refund-policy",
            "/terms-of-service",
    };

    @GetMapping(value = "/api/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemapXml() {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // Static pages
        for (String path : STATIC_PATHS) {
            xml.append("  <url>\n");
            xml.append("    <loc>").append(siteUrl).append(path).append("</loc>\n");
            if ("/".equals(path)) {
                xml.append("    <changefreq>daily</changefreq>\n");
                xml.append("    <priority>1.0</priority>\n");
            } else {
                xml.append("    <changefreq>monthly</changefreq>\n");
                xml.append("    <priority>0.5</priority>\n");
            }
            xml.append("  </url>\n");
        }

        // Product pages
        List<ProductSitemapDto> products = productService.getSitemapData();
        for (ProductSitemapDto p : products) {
            xml.append("  <url>\n");
            xml.append("    <loc>").append(siteUrl).append("/products/").append(p.getId()).append("</loc>\n");
            Instant updatedAt = p.getUpdatedAt();
            if (updatedAt != null) {
                xml.append("    <lastmod>").append(W3C_DATE.format(updatedAt)).append("</lastmod>\n");
            }
            xml.append("    <changefreq>weekly</changefreq>\n");
            xml.append("    <priority>0.8</priority>\n");
            xml.append("  </url>\n");
        }

        xml.append("</urlset>");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(xml.toString());
    }
}
