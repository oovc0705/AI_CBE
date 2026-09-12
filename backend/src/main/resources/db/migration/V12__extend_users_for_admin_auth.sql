-- 扩展 users 表以支持 admin 前端登录认证

-- 1. 添加 username 字段（可选，用于 B 端管理员登录）
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- 2. 为已有用户填充 username（默认使用 email）
UPDATE users SET username = email WHERE username IS NULL;

-- 3. 扩展 role CHECK 约束，支持 OPERATOR / VIEWER
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('CUSTOMER', 'ADMIN', 'OPERATOR', 'VIEWER'));
