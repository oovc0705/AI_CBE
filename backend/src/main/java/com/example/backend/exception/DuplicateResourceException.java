package com.example.backend.exception;

/**
 * 资源唯一性冲突（编码/名称/邮箱已存在）。由 GlobalExceptionHandler 映射为 HTTP 409。
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
