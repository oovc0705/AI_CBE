package com.example.backend.security;

/**
 * JWT 认证后的当前用户，作为 Authentication 的 principal。
 * id 取自 token 的 subject，可能为非数字（开发兜底账号），使用前需自行解析。
 */
public record AuthUser(String id, String username, String role) {

    /** principal 为 AuthUser 且 id 是数字时返回用户 ID，否则返回 null（游客/兜底账号） */
    public static Long resolveId(Object principal) {
        if (principal instanceof AuthUser user && user.id() != null && user.id().matches("\\d+")) {
            return Long.parseLong(user.id());
        }
        return null;
    }
}
