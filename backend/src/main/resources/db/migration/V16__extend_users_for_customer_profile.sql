-- V16: 扩展 users 表以支持 C 端用户个人中心
-- 新增字段：phone、language、currency、member_level、points、preferences

-- 1. 手机号（可选）
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 2. 语言偏好（默认 en）
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- 3. 货币偏好（默认 USD）
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

-- 4. 会员等级（默认 regular）
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_level VARCHAR(20) DEFAULT 'regular';
ALTER TABLE users ADD CONSTRAINT users_member_level_check 
    CHECK (member_level IN ('regular', 'silver', 'gold', 'platinum'));

-- 5. 积分余额（默认 0）
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ADD CONSTRAINT users_points_check CHECK (points >= 0);

-- 6. 用户偏好设置（JSONB，存储通知、隐私、营销等偏好）
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- 7. 为已有用户设置默认值
UPDATE users 
SET 
    language = 'en',
    currency = 'USD',
    member_level = 'regular',
    points = 0,
    preferences = '{}'::jsonb
WHERE language IS NULL OR currency IS NULL OR member_level IS NULL;

-- 8. 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_users_member_level ON users(member_level);
CREATE INDEX IF NOT EXISTS idx_users_language ON users(language);