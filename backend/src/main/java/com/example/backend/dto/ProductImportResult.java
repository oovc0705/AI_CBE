package com.example.backend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ProductImportResult {
    private int total;
    private int imported;
    private int failed;
    private List<ImportError> errors = new ArrayList<>();

    @Data
    public static class ImportError {
        private int row;
        private String source;
        private String reason;

        public ImportError(int row, String source, String reason) {
            this.row = row;
            this.source = source;
            this.reason = reason;
        }
    }
}
