package com.example.backend.service;

import com.example.backend.dto.ProductImportResult;
import com.example.backend.dto.ProductVariantRequest;
import com.example.backend.entity.Product;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductImportService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final ProductService productService;

    public ProductImportResult importCsv(MultipartFile file) {
        ProductImportResult result = new ProductImportResult();
        if (file == null || file.isEmpty()) {
            result.getErrors().add(new ProductImportResult.ImportError(0, "", "File is empty"));
            result.setFailed(1);
            return result;
        }

        List<Row> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = CSVParser.parse(reader, CSVFormat.DEFAULT
                     .withFirstRecordAsHeader()
                     .withIgnoreHeaderCase()
                     .withTrim())) {
            int rowNumber = 1;
            for (CSVRecord record : parser) {
                rowNumber++;
                Row row = parseRow(record, rowNumber, result);
                if (row != null) {
                    rows.add(row);
                }
            }
        } catch (Exception e) {
            result.getErrors().add(new ProductImportResult.ImportError(0, "", "Failed to parse CSV: " + e.getMessage()));
            result.setFailed(result.getFailed() + 1);
            return result;
        }

        Map<String, List<Row>> groups = new LinkedHashMap<>();
        for (Row row : rows) {
            groups.computeIfAbsent(row.productSlug, k -> new ArrayList<>()).add(row);
        }

        result.setTotal(groups.size());
        for (Map.Entry<String, List<Row>> entry : groups.entrySet()) {
            importGroup(entry.getKey(), entry.getValue(), result);
        }

        return result;
    }

    public byte[] generateTemplate() {
        List<String> header = List.of(
                "product_slug", "name", "description", "category", "brand",
                "image_url", "price", "stock", "sku", "variant_attributes", "variant_price", "variant_stock");
        List<List<String>> rows = List.of(
                List.of("nike-pegasus-41", "Nike Pegasus 41", "Premium running shoes", "Shoes", "Nike",
                        "https://cdn.example.com/pegasus.jpg", "129.00", "50", "PEG-41-BLK-9",
                        "{\"Color\":\"Black\",\"Size\":\"US 9\"}", "129.00", "25"),
                List.of("nike-pegasus-41", "Nike Pegasus 41", "Premium running shoes", "Shoes", "Nike",
                        "https://cdn.example.com/pegasus.jpg", "129.00", "50", "PEG-41-WHT-10",
                        "{\"Color\":\"White\",\"Size\":\"US 10\"}", "129.00", "25"),
                List.of("asics-gel-kayano-31", "ASICS Gel-Kayano 31", "Stability running shoe", "Shoes", "ASICS",
                        "https://cdn.example.com/kayano.jpg", "159.00", "30", "", "", "", "")
        );
        StringWriter writer = new StringWriter();
        try (org.apache.commons.csv.CSVPrinter printer = new org.apache.commons.csv.CSVPrinter(writer,
                CSVFormat.DEFAULT.withHeader(header.toArray(new String[0])))) {
            for (List<String> row : rows) {
                printer.printRecord(row);
            }
            printer.flush();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate template", e);
        }
        return writer.toString().getBytes(StandardCharsets.UTF_8);
    }

    private Row parseRow(CSVRecord record, int rowNumber, ProductImportResult result) {
        Row row = new Row();
        row.rowNumber = rowNumber;
        row.productSlug = get(record, "product_slug");
        row.name = get(record, "name");
        row.description = get(record, "description");
        row.category = get(record, "category");
        row.brand = get(record, "brand");
        row.imageUrl = get(record, "image_url");
        row.sku = get(record, "sku");
        row.variantAttributes = get(record, "variant_attributes");
        row.price = parseDecimal(get(record, "price"));
        row.stock = parseInt(get(record, "stock"));
        row.variantPrice = parseDecimal(get(record, "variant_price"));
        row.variantStock = parseInt(get(record, "variant_stock"));

        if (row.productSlug == null || row.productSlug.isBlank()) {
            result.getErrors().add(new ProductImportResult.ImportError(rowNumber, row.source(), "product_slug is required"));
            result.setFailed(result.getFailed() + 1);
            return null;
        }
        if (row.name == null || row.name.isBlank()) {
            result.getErrors().add(new ProductImportResult.ImportError(rowNumber, row.source(), "name is required"));
            result.setFailed(result.getFailed() + 1);
            return null;
        }
        return row;
    }

    private void importGroup(String productSlug, List<Row> rows, ProductImportResult result) {
        Row first = rows.get(0);
        Product product = new Product();
        product.setSlug(productSlug);
        product.setName(first.name);
        product.setDescription(first.description);
        product.setCategory(first.category);
        product.setBrand(first.brand);
        product.setImageUrl(first.imageUrl);
        product.setPrice(first.price);
        product.setStock(first.stock);

        List<ProductVariantRequest> variants = new ArrayList<>();
        for (Row row : rows) {
            if (row.sku == null || row.sku.isBlank()) {
                continue;
            }
            ProductVariantRequest variant = new ProductVariantRequest();
            variant.setSku(row.sku);
            variant.setEnabled(true);
            try {
                variant.setAttributes(parseAttributes(row.variantAttributes));
            } catch (Exception e) {
                result.getErrors().add(new ProductImportResult.ImportError(row.rowNumber, row.source(), "Invalid variant_attributes: " + e.getMessage()));
                result.setFailed(result.getFailed() + 1);
                return;
            }
            variant.setPrice(row.variantPrice != null ? row.variantPrice : product.getPrice());
            variant.setStock(row.variantStock != null ? row.variantStock : 0);
            variants.add(variant);
        }

        if (!variants.isEmpty()) {
            product.setVariants(variants);
        } else {
            product.setSku(productSlug);
        }

        if (product.getPrice() == null && !variants.isEmpty() && variants.get(0).getPrice() != null) {
            product.setPrice(variants.get(0).getPrice());
        }
        if (product.getPrice() == null) {
            result.getErrors().add(new ProductImportResult.ImportError(first.rowNumber, first.source(), "price or variant_price is required"));
            result.setFailed(result.getFailed() + 1);
            return;
        }

        try {
            productService.create(product);
            result.setImported(result.getImported() + 1);
        } catch (Exception e) {
            result.getErrors().add(new ProductImportResult.ImportError(first.rowNumber, first.source(), e.getMessage()));
            result.setFailed(result.getFailed() + 1);
        }
    }

    private String get(CSVRecord record, String name) {
        return record.isMapped(name) ? record.get(name) : null;
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return new BigDecimal(value.trim());
    }

    private Integer parseInt(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Integer.parseInt(value.trim());
    }

    private Map<String, String> parseAttributes(String json) throws Exception {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        JsonNode node = OBJECT_MAPPER.readTree(json);
        Map<String, String> map = new LinkedHashMap<>();
        node.fields().forEachRemaining(entry -> map.put(entry.getKey(), entry.getValue().asText()));
        return map;
    }

    private static class Row {
        int rowNumber;
        String productSlug;
        String name;
        String description;
        String category;
        String brand;
        String imageUrl;
        String sku;
        String variantAttributes;
        BigDecimal price;
        Integer stock;
        BigDecimal variantPrice;
        Integer variantStock;

        String source() {
            return productSlug + " / " + (sku != null ? sku : "base");
        }
    }
}
