package com.example.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

/**
 * 数据初始化器 - 在应用启动时自动插入测试数据
 * 只在表为空时插入，避免重复数据
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("开始检查并初始化测试数据...");
        
        try {
            initializeTestData();
            log.info("测试数据初始化完成");
        } catch (Exception e) {
            log.error("测试数据初始化失败: {}", e.getMessage(), e);
        }
    }

    private void initializeTestData() {
        // 检查并插入用户数据
        initializeUsers();
        
        // 检查并插入管理员用户
        initializeAdminUsers();
        
        // 检查并插入角色
        initializeRoles();
        
        // 检查并插入商品评论
        initializeProductReviews();
        
        // 检查并插入运费模板
        initializeShippingTemplates();
        
        // 检查并插入运费规则
        initializeShippingRules();
        
        // 检查并插入物流商
        initializeShippingCarriers();
        
        // 检查并插入支付网关
        initializePaymentGateways();
        
        // 检查并插入支付交易
        initializePaymentTransactions();
        
        // 检查并插入促销活动
        initializePromotions();
        
        // 检查并插入邮件模板
        initializeEmailTemplates();
        
        // 检查并插入邮件营销活动
        initializeEmailCampaigns();
        
        // 检查并插入订阅者
        initializeSubscribers();
        
        // 检查并插入系统通知
        initializeNotifications();
        
        // 检查并插入知识库文档
        initializeKnowledgeDocuments();
        
        // 检查并插入FAQ
        initializeFAQ();
        
        // 检查并插入货币
        initializeCurrencies();
        
        // 检查并插入税费规则
        initializeTaxRules();
        
        // 检查并插入审计日志
        initializeAuditLogs();
        
        // 检查并插入翻译
        initializeTranslations();
    }

    private void initializeUsers() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        if (count != null && count > 0) {
            log.info("users表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化用户数据...");
        jdbcTemplate.update(
            "INSERT INTO users (email, password_hash, role, first_name, last_name, avatar_url) VALUES (?, ?, ?, ?, ?, ?)",
            "customer@example.com", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "CUSTOMER", "张", "三", "https://i.pravatar.cc/150?u=customer1"
        );
        jdbcTemplate.update(
            "INSERT INTO users (email, password_hash, role, first_name, last_name, avatar_url) VALUES (?, ?, ?, ?, ?, ?)",
            "customer2@example.com", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "CUSTOMER", "李", "四", "https://i.pravatar.cc/150?u=customer2"
        );
        jdbcTemplate.update(
            "INSERT INTO users (email, password_hash, role, first_name, last_name, avatar_url) VALUES (?, ?, ?, ?, ?, ?)",
            "customer3@example.com", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "CUSTOMER", "王", "五", "https://i.pravatar.cc/150?u=customer3"
        );
        log.info("已插入3个用户");
    }

    private void initializeAdminUsers() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM admin_users", Integer.class);
        if (count != null && count > 0) {
            log.info("admin_users表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化管理员用户...");
        jdbcTemplate.update(
            "INSERT INTO admin_users (id, email, password_hash, first_name, last_name, avatar_url, role_id, is_active, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "au-1", "admin@example.com", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "Admin", "User", "https://i.pravatar.cc/150?u=admin", "ar-1", true, java.time.OffsetDateTime.now().minusHours(1)
        );
        jdbcTemplate.update(
            "INSERT INTO admin_users (id, email, password_hash, first_name, last_name, avatar_url, role_id, is_active, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "au-2", "editor@example.com", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "Editor", "User", "https://i.pravatar.cc/150?u=editor", "ar-2", true, java.time.OffsetDateTime.now().minusHours(2)
        );
        log.info("已插入2个管理员用户");
    }

    private void initializeRoles() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM admin_roles", Integer.class);
        if (count != null && count > 0) {
            log.info("admin_roles表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化角色数据...");
        jdbcTemplate.update(
            "INSERT INTO admin_roles (id, name, display_name, description, is_system, permissions) VALUES (?, ?, ?, ?, ?, ?::jsonb)",
            "ar-1", "SUPER_ADMIN", "超级管理员", "拥有所有权限", true, "[\"*\"]"
        );
        jdbcTemplate.update(
            "INSERT INTO admin_roles (id, name, display_name, description, is_system, permissions) VALUES (?, ?, ?, ?, ?, ?::jsonb)",
            "ar-2", "EDITOR", "编辑", "内容编辑权限", false, "[\"products:read\", \"products:write\", \"reviews:read\", \"reviews:write\"]"
        );
        jdbcTemplate.update(
            "INSERT INTO admin_roles (id, name, display_name, description, is_system, permissions) VALUES (?, ?, ?, ?, ?, ?::jsonb)",
            "ar-3", "OPERATOR", "运营", "运营相关权限", false, "[\"orders:read\", \"orders:write\", \"promotions:read\", \"promotions:write\"]"
        );
        log.info("已插入3个角色");
    }

    private void initializeProductReviews() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM product_reviews", Integer.class);
        if (count != null && count > 0) {
            log.info("product_reviews表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化商品评论...");
        jdbcTemplate.update(
            "INSERT INTO product_reviews (id, product_id, product_name, user_id, user_name, order_id, rating, title, content, images, status, merchant_reply, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?)",
            "pr-1", "1", "跨境蓝牙音箱", "1", "张三", "1", 5, "音质非常好", "音质清晰，低音浑厚，续航也很长，非常满意！", "[\"https://picsum.photos/200/200?random=1\"]", "approved", "感谢您的好评！", java.time.OffsetDateTime.now().minusDays(3)
        );
        jdbcTemplate.update(
            "INSERT INTO product_reviews (id, product_id, product_name, user_id, user_name, order_id, rating, title, content, images, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
            "pr-2", "2", "智能手表", "2", "李四", "2", 4, "功能丰富", "功能很多，但表带有点短", null, "approved", java.time.OffsetDateTime.now().minusDays(5)
        );
        jdbcTemplate.update(
            "INSERT INTO product_reviews (id, product_id, product_name, user_id, user_name, order_id, rating, title, content, images, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
            "pr-3", "3", "无线充电器", "3", "王五", "3", 3, "充电速度一般", "充电速度没有宣传的那么快", null, "pending", java.time.OffsetDateTime.now().minusDays(1)
        );
        jdbcTemplate.update(
            "INSERT INTO product_reviews (id, product_id, product_name, user_id, user_name, order_id, rating, title, content, images, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
            "pr-4", "1", "跨境蓝牙音箱", "2", "李四", "4", 5, "第二次购买", "帮朋友买的，质量一如既往的好", "[\"https://picsum.photos/200/200?random=2\"]", "approved", java.time.OffsetDateTime.now().minusDays(7)
        );
        jdbcTemplate.update(
            "INSERT INTO product_reviews (id, product_id, product_name, user_id, user_name, order_id, rating, title, content, images, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
            "pr-5", "4", "USB-C数据线", "1", "张三", "5", 2, "不太耐用", "用了一个月就坏了", null, "rejected", java.time.OffsetDateTime.now().minusDays(10)
        );
        log.info("已插入5条商品评论");
    }

    private void initializeShippingTemplates() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM shipping_templates", Integer.class);
        if (count != null && count > 0) {
            log.info("shipping_templates表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化运费模板...");
        jdbcTemplate.update(
            "INSERT INTO shipping_templates (id, name, is_default, billing_type, free_shipping_threshold, enabled) VALUES (?, ?, ?, ?, ?, ?)",
            "st-1", "标准运费模板", true, "weight", 99.0, true
        );
        jdbcTemplate.update(
            "INSERT INTO shipping_templates (id, name, is_default, billing_type, free_shipping_threshold, enabled) VALUES (?, ?, ?, ?, ?, ?)",
            "st-2", "国际快递模板", false, "weight", 199.0, true
        );
        jdbcTemplate.update(
            "INSERT INTO shipping_templates (id, name, is_default, billing_type, free_shipping_threshold, enabled) VALUES (?, ?, ?, ?, ?, ?)",
            "st-3", "经济小包模板", false, "piece", 49.0, true
        );
        log.info("已插入3个运费模板");
    }

    private void initializeShippingRules() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM shipping_rules", Integer.class);
        if (count != null && count > 0) {
            log.info("shipping_rules表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化运费规则...");
        jdbcTemplate.update(
            "INSERT INTO shipping_rules (id, template_id, region, country_code, first_unit, first_unit_fee, additional_unit, additional_unit_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "sr-1", "st-1", "中国大陆", "CN", 1.0, 0.0, 1.0, 10.0
        );
        jdbcTemplate.update(
            "INSERT INTO shipping_rules (id, template_id, region, country_code, first_unit, first_unit_fee, additional_unit, additional_unit_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "sr-2", "st-1", "美国", "US", 1.0, 30.0, 1.0, 15.0
        );
        jdbcTemplate.update(
            "INSERT INTO shipping_rules (id, template_id, region, country_code, first_unit, first_unit_fee, additional_unit, additional_unit_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "sr-3", "st-1", "欧洲", "EU", 1.0, 45.0, 1.0, 20.0
        );
        jdbcTemplate.update(
            "INSERT INTO shipping_rules (id, template_id, region, country_code, first_unit, first_unit_fee, additional_unit, additional_unit_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "sr-4", "st-2", "全球", "GLOBAL", 0.5, 80.0, 0.5, 40.0
        );
        jdbcTemplate.update(
            "INSERT INTO shipping_rules (id, template_id, region, country_code, first_unit, first_unit_fee, additional_unit, additional_unit_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "sr-5", "st-3", "东南亚", "SEA", 1.0, 15.0, 1.0, 5.0
        );
        log.info("已插入5条运费规则");
    }

    private void initializeShippingCarriers() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM shipping_carriers", Integer.class);
        if (count != null && count > 0) {
            log.info("shipping_carriers表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化物流商...");
        jdbcTemplate.update(
            "INSERT INTO shipping_carriers (id, name, code, logo_url, contact_phone, website, tracking_url_template, api_type, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "sc-1", "顺丰速运", "SF", "https://logo.sf-express.com/logo.png", "400-811-1111", "https://www.sf-express.com", "https://www.sf-express.com/cn/dynamic_system.html?module=tracking&tracking_number={trackingNo}", "api", true
        );
        jdbcTemplate.update(
            "INSERT INTO shipping_carriers (id, name, code, logo_url, contact_phone, website, tracking_url_template, api_type, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "sc-2", "DHL Express", "DHL", "https://logo.dhl.com/logo.png", "+49-228-1890", "https://www.dhl.com", "https://www.dhl.com/en/express/tracking.html?AWB={trackingNo}", "api", true
        );
        jdbcTemplate.update(
            "INSERT INTO shipping_carriers (id, name, code, logo_url, website, tracking_url_template, api_type, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "sc-3", "FedEx", "FEDEX", "https://www.fedex.com", "https://www.fedex.com/apps/fedextrack/?tracknumbers={trackingNo}", "api", true
        );
        log.info("已插入3个物流商");
    }

    private void initializePaymentGateways() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM payment_gateways", Integer.class);
        if (count != null && count > 0) {
            log.info("payment_gateways表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化支付网关...");
        jdbcTemplate.update(
            "INSERT INTO payment_gateways (id, name, display_name, enabled, connected, config, last_four_digits) VALUES (?, ?, ?, ?, ?, ?::jsonb, ?)",
            "pg-1", "stripe", "Stripe信用卡", true, true, "{\"publishable_key\": \"pk_test_xxx\", \"currency\": \"USD\"}", "4242"
        );
        jdbcTemplate.update(
            "INSERT INTO payment_gateways (id, name, display_name, enabled, connected, config) VALUES (?, ?, ?, ?, ?, ?::jsonb)",
            "pg-2", "paypal", "PayPal", true, true, "{\"client_id\": \"xxx\", \"currency\": \"USD\"}"
        );
        jdbcTemplate.update(
            "INSERT INTO payment_gateways (id, name, display_name, enabled, connected, config) VALUES (?, ?, ?, ?, ?, ?::jsonb)",
            "pg-3", "alipay", "支付宝", true, false, "{\"app_id\": \"xxx\", \"currency\": \"CNY\"}"
        );
        jdbcTemplate.update(
            "INSERT INTO payment_gateways (id, name, display_name, enabled, connected, config) VALUES (?, ?, ?, ?, ?, ?::jsonb)",
            "pg-4", "wechatpay", "微信支付", false, false, "{\"mch_id\": \"xxx\", \"currency\": \"CNY\"}"
        );
        log.info("已插入4个支付网关");
    }

    private void initializePaymentTransactions() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM payment_transactions", Integer.class);
        if (count != null && count > 0) {
            log.info("payment_transactions表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化支付交易...");
        jdbcTemplate.update(
            "INSERT INTO payment_transactions (id, order_id, gateway_id, gateway_transaction_id, amount, currency, status, raw_response, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)",
            "pt-1", "1", "pg-1", "txn_001", 299.99, "USD", "completed", "{\"gateway\": \"stripe\", \"last4\": \"4242\"}", java.time.OffsetDateTime.now().minusDays(5)
        );
        jdbcTemplate.update(
            "INSERT INTO payment_transactions (id, order_id, gateway_id, gateway_transaction_id, amount, currency, status, raw_response, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)",
            "pt-2", "2", "pg-2", "PAY-12345", 159.00, "USD", "completed", "{\"gateway\": \"paypal\"}", java.time.OffsetDateTime.now().minusDays(3)
        );
        jdbcTemplate.update(
            "INSERT INTO payment_transactions (id, order_id, gateway_id, gateway_transaction_id, amount, currency, status, raw_response, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)",
            "pt-3", "3", "pg-1", "txn_003", 89.99, "USD", "pending", "{\"gateway\": \"stripe\"}", java.time.OffsetDateTime.now().minusDays(1)
        );
        jdbcTemplate.update(
            "INSERT INTO payment_transactions (id, order_id, gateway_id, gateway_transaction_id, amount, currency, status, raw_response, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)",
            "pt-4", "4", "pg-3", "ALIPAY-001", 199.00, "CNY", "completed", "{\"gateway\": \"alipay\"}", java.time.OffsetDateTime.now().minusDays(7)
        );
        jdbcTemplate.update(
            "INSERT INTO payment_transactions (id, order_id, gateway_id, gateway_transaction_id, amount, currency, status, failure_reason, raw_response, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)",
            "pt-5", "5", "pg-1", "txn_005", 599.00, "USD", "failed", "Card declined", "{\"gateway\": \"stripe\", \"error\": \"card_declined\"}", java.time.OffsetDateTime.now().minusDays(2)
        );
        log.info("已插入5条支付交易");
    }

    private void initializePromotions() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM promotions", Integer.class);
        if (count != null && count > 0) {
            log.info("promotions表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化促销活动...");
        jdbcTemplate.update(
            "INSERT INTO promotions (id, name, type, discount_type, discount_value, min_order_amount, max_discount, usage_limit, used_count, starts_at, ends_at, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "promo-1", "新用户9折", "coupon", "percentage", 10.0, 50.0, 100.0, 1000, 256, java.time.OffsetDateTime.now().minusDays(30), java.time.OffsetDateTime.now().plusDays(30), true
        );
        jdbcTemplate.update(
            "INSERT INTO promotions (id, name, type, discount_type, discount_value, min_order_amount, max_discount, usage_limit, used_count, starts_at, ends_at, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "promo-2", "满200减30", "coupon", "fixed", 30.0, 200.0, 30.0, 500, 128, java.time.OffsetDateTime.now().minusDays(15), java.time.OffsetDateTime.now().plusDays(15), true
        );
        jdbcTemplate.update(
            "INSERT INTO promotions (id, name, type, discount_type, discount_value, min_order_amount, starts_at, ends_at, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "promo-3", "黑五8折", "auto", "percentage", 20.0, 0.0, java.time.OffsetDateTime.now().plusDays(120), java.time.OffsetDateTime.now().plusDays(125), true
        );
        log.info("已插入3个促销活动");
    }

    private void initializeEmailTemplates() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM email_templates", Integer.class);
        if (count != null && count > 0) {
            log.info("email_templates表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化邮件模板...");
        jdbcTemplate.update(
            "INSERT INTO email_templates (id, name, code, subject, body_html, variables) VALUES (?, ?, ?, ?, ?, ?::jsonb)",
            "et-1", "欢迎邮件", "welcome", "欢迎注册跨境电商平台！", "<h1>欢迎{{name}}</h1><p>感谢您的注册</p>", "[\"name\"]"
        );
        jdbcTemplate.update(
            "INSERT INTO email_templates (id, name, code, subject, body_html, variables) VALUES (?, ?, ?, ?, ?, ?::jsonb)",
            "et-2", "订单确认", "order_confirm", "订单{{orderNo}}已确认", "<h1>订单确认</h1><p>订单号：{{orderNo}}</p>", "[\"orderNo\", \"amount\"]"
        );
        jdbcTemplate.update(
            "INSERT INTO email_templates (id, name, code, subject, body_html, variables) VALUES (?, ?, ?, ?, ?, ?::jsonb)",
            "et-3", "发货通知", "shipping_notify", "您的订单{{orderNo}}已发货", "<h1>发货通知</h1><p>快递单号：{{trackingNo}}</p>", "[\"orderNo\", \"trackingNo\"]"
        );
        log.info("已插入3个邮件模板");
    }

    private void initializeEmailCampaigns() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM email_campaigns", Integer.class);
        if (count != null && count > 0) {
            log.info("email_campaigns表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化邮件营销活动...");
        jdbcTemplate.update(
            "INSERT INTO email_campaigns (id, name, template_id, subject, body_html, status, recipient_count, sent_count, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "ec-1", "618大促通知", "et-1", "618大促来袭，全场8折！", "<h1>618大促</h1>", "sent", 5000, 4800, "au-1", java.time.OffsetDateTime.now().minusDays(10)
        );
        jdbcTemplate.update(
            "INSERT INTO email_campaigns (id, name, template_id, subject, body_html, status, recipient_count, sent_count, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "ec-2", "新品上架通知", "et-1", "新品上架，抢先体验！", "<h1>新品发布</h1>", "sent", 3000, 2900, "au-1", java.time.OffsetDateTime.now().minusDays(5)
        );
        jdbcTemplate.update(
            "INSERT INTO email_campaigns (id, name, template_id, subject, body_html, status, recipient_count, scheduled_at, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "ec-3", "双11预热", "et-2", "双11预热，提前加购享优惠", "<h1>双11预热</h1>", "scheduled", 8000, java.time.OffsetDateTime.now().plusDays(30), "au-2", java.time.OffsetDateTime.now().minusDays(2)
        );
        log.info("已插入3个邮件营销活动");
    }

    private void initializeSubscribers() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM subscribers", Integer.class);
        if (count != null && count > 0) {
            log.info("subscribers表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化订阅者...");
        jdbcTemplate.update(
            "INSERT INTO subscribers (email, name, status, subscribed_at) VALUES (?, ?, ?, ?)",
            "subscriber1@example.com", "订阅用户1", "active", java.time.OffsetDateTime.now().minusDays(30)
        );
        jdbcTemplate.update(
            "INSERT INTO subscribers (email, name, status, subscribed_at) VALUES (?, ?, ?, ?)",
            "subscriber2@example.com", "订阅用户2", "active", java.time.OffsetDateTime.now().minusDays(20)
        );
        jdbcTemplate.update(
            "INSERT INTO subscribers (email, name, status, subscribed_at) VALUES (?, ?, ?, ?)",
            "subscriber3@example.com", "订阅用户3", "unsubscribed", java.time.OffsetDateTime.now().minusDays(15)
        );
        log.info("已插入3个订阅者");
    }

    private void initializeNotifications() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM system_notifications", Integer.class);
        if (count != null && count > 0) {
            log.info("system_notifications表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化系统通知...");
        jdbcTemplate.update(
            "INSERT INTO system_notifications (id, type, title, content, data, is_read, recipient_id, created_at) VALUES (?, ?, ?, ?, ?::jsonb, ?, ?, ?)",
            "sn-1", "order", "新订单通知", "您有一个新订单 #1001", "{\"orderId\": \"1001\", \"amount\": 299.99}", false, "au-1", java.time.OffsetDateTime.now().minusHours(1)
        );
        jdbcTemplate.update(
            "INSERT INTO system_notifications (id, type, title, content, data, is_read, recipient_id, created_at) VALUES (?, ?, ?, ?, ?::jsonb, ?, ?, ?)",
            "sn-2", "review", "新评论通知", "商品\"蓝牙音箱\"收到新评价", "{\"reviewId\": \"pr-1\", \"productId\": \"1\"}", false, "au-1", java.time.OffsetDateTime.now().minusHours(3)
        );
        jdbcTemplate.update(
            "INSERT INTO system_notifications (id, type, title, content, data, is_read, recipient_id, created_at) VALUES (?, ?, ?, ?, ?::jsonb, ?, ?, ?)",
            "sn-3", "system", "系统更新", "系统将于今晚22:00进行维护升级", "{\"maintenanceTime\": \"22:00\"}", true, "au-1", java.time.OffsetDateTime.now().minusDays(1)
        );
        jdbcTemplate.update(
            "INSERT INTO system_notifications (id, type, title, content, data, is_read, recipient_id, created_at) VALUES (?, ?, ?, ?, ?::jsonb, ?, ?, ?)",
            "sn-4", "payment", "支付成功", "订单 #1002 支付成功", "{\"orderId\": \"1002\", \"amount\": 159.00}", true, "au-2", java.time.OffsetDateTime.now().minusDays(2)
        );
        log.info("已插入4条系统通知");
    }

    private void initializeKnowledgeDocuments() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM knowledge_documents", Integer.class);
        if (count != null && count > 0) {
            log.info("knowledge_documents表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化知识库文档...");
        jdbcTemplate.update(
            "INSERT INTO knowledge_documents (id, title, collection, document_type, file_name, file_size, content, source, status, chunk_count, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "kd-1", "平台退换货政策", "copilot_kb", "txt", "return_policy.txt", 2048, "1. 自签收之日起7天内可申请无理由退货\n2. 商品需保持原包装完整\n3. 退货运费由买家承担", "manual_upload", "trained", 5, "au-1", java.time.OffsetDateTime.now().minusDays(7)
        );
        jdbcTemplate.update(
            "INSERT INTO knowledge_documents (id, title, collection, document_type, file_name, file_size, content, source, status, chunk_count, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "kd-2", "物流配送说明", "copilot_kb", "txt", "shipping_guide.txt", 3072, "1. 标准配送：5-10个工作日\n2. 快速配送：2-5个工作日\n3. 国际快递：7-15个工作日", "manual_upload", "trained", 8, "au-1", java.time.OffsetDateTime.now().minusDays(5)
        );
        jdbcTemplate.update(
            "INSERT INTO knowledge_documents (id, title, collection, document_type, file_name, file_size, content, source, status, chunk_count, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "kd-3", "常见问题FAQ", "copilot_kb", "txt", "faq.txt", 4096, "Q: 如何修改收货地址？\nA: 订单未发货前可在\"我的订单\"中修改\n\nQ: 支持哪些支付方式？\nA: 支持Stripe、PayPal、支付宝、微信支付", "manual_upload", "trained", 12, "au-2", java.time.OffsetDateTime.now().minusDays(3)
        );
        log.info("已插入3个知识库文档");
    }

    private void initializeFAQ() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM faq_entries", Integer.class);
        if (count != null && count > 0) {
            log.info("faq_entries表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化FAQ...");
        jdbcTemplate.update(
            "INSERT INTO faq_entries (id, question, answer, category, locale, sort_order, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)",
            "faq-1", "如何注册账号？", "点击页面右上角\"注册\"按钮，填写邮箱和密码即可完成注册。", "account", "zh", 1, true
        );
        jdbcTemplate.update(
            "INSERT INTO faq_entries (id, question, answer, category, locale, sort_order, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)",
            "faq-2", "How to register?", "Click the \"Register\" button in the upper right corner, fill in your email and password to complete registration.", "account", "en", 1, true
        );
        jdbcTemplate.update(
            "INSERT INTO faq_entries (id, question, answer, category, locale, sort_order, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)",
            "faq-3", "配送需要多长时间？", "标准配送5-10个工作日，快速配送2-5个工作日，国际快递7-15个工作日。", "shipping", "zh", 2, true
        );
        jdbcTemplate.update(
            "INSERT INTO faq_entries (id, question, answer, category, locale, sort_order, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)",
            "faq-4", "支持哪些支付方式？", "目前支持Stripe信用卡、PayPal、支付宝和微信支付。", "payment", "zh", 3, true
        );
        jdbcTemplate.update(
            "INSERT INTO faq_entries (id, question, answer, category, locale, sort_order, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)",
            "faq-5", "如何申请退货？", "自签收之日起7天内可在\"我的订单\"中申请退货，商品需保持原包装完整。", "returns", "zh", 4, true
        );
        log.info("已插入5条FAQ");
    }

    private void initializeCurrencies() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM currencies", Integer.class);
        if (count != null && count > 0) {
            log.info("currencies表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化货币...");
        jdbcTemplate.update(
            "INSERT INTO currencies (id, code, name, symbol, exchange_rate, decimals, is_default, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "cur-1", "USD", "美元", "$", 1.0, 2, true, true
        );
        jdbcTemplate.update(
            "INSERT INTO currencies (id, code, name, symbol, exchange_rate, decimals, is_default, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "cur-2", "CNY", "人民币", "¥", 7.2, 2, false, true
        );
        jdbcTemplate.update(
            "INSERT INTO currencies (id, code, name, symbol, exchange_rate, decimals, is_default, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "cur-3", "EUR", "欧元", "€", 0.92, 2, false, true
        );
        jdbcTemplate.update(
            "INSERT INTO currencies (id, code, name, symbol, exchange_rate, decimals, is_default, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "cur-4", "GBP", "英镑", "£", 0.79, 2, false, true
        );
        jdbcTemplate.update(
            "INSERT INTO currencies (id, code, name, symbol, exchange_rate, decimals, is_default, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            "cur-5", "JPY", "日元", "¥", 150.0, 0, false, true
        );
        log.info("已插入5种货币");
    }

    private void initializeTaxRules() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM tax_rules", Integer.class);
        if (count != null && count > 0) {
            log.info("tax_rules表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化税费规则...");
        jdbcTemplate.update(
            "INSERT INTO tax_rules (id, name, country_code, region_code, tax_rate, tax_type, is_shipping_taxable, enabled, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "tr-1", "美国加州增值税", "US", "CA", 7.25, "vat", false, true, 1
        );
        jdbcTemplate.update(
            "INSERT INTO tax_rules (id, name, country_code, region_code, tax_rate, tax_type, is_shipping_taxable, enabled, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "tr-2", "欧盟VAT", "EU", null, 20.0, "vat", true, true, 1
        );
        jdbcTemplate.update(
            "INSERT INTO tax_rules (id, name, country_code, region_code, tax_rate, tax_type, is_shipping_taxable, enabled, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "tr-3", "英国VAT", "GB", null, 20.0, "vat", true, true, 1
        );
        jdbcTemplate.update(
            "INSERT INTO tax_rules (id, name, country_code, region_code, tax_rate, tax_type, is_shipping_taxable, enabled, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "tr-4", "日本消费税", "JP", null, 10.0, "vat", false, true, 1
        );
        log.info("已插入4条税费规则");
    }

    private void initializeAuditLogs() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM audit_logs", Integer.class);
        if (count != null && count > 0) {
            log.info("audit_logs表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化审计日志...");
        jdbcTemplate.update(
            "INSERT INTO audit_logs (id, action, resource_type, resource_id, user_id, user_name, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
            "al-1", "CREATE", "product", "1", "au-1", "admin@example.com", "{\"name\": \"跨境蓝牙音箱\"}", "192.168.1.100", java.time.OffsetDateTime.now().minusHours(1)
        );
        jdbcTemplate.update(
            "INSERT INTO audit_logs (id, action, resource_type, resource_id, user_id, user_name, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
            "al-2", "UPDATE", "order", "1", "au-1", "admin@example.com", "{\"status\": \"SHIPPED\"}", "192.168.1.100", java.time.OffsetDateTime.now().minusHours(2)
        );
        jdbcTemplate.update(
            "INSERT INTO audit_logs (id, action, resource_type, resource_id, user_id, user_name, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
            "al-3", "DELETE", "promotion", "promo-old", "au-2", "editor@example.com", "{\"name\": \"过期活动\"}", "192.168.1.101", java.time.OffsetDateTime.now().minusHours(3)
        );
        jdbcTemplate.update(
            "INSERT INTO audit_logs (id, action, resource_type, resource_id, user_id, user_name, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
            "al-4", "APPROVE", "review", "pr-1", "au-1", "admin@example.com", "{\"rating\": 5}", "192.168.1.100", java.time.OffsetDateTime.now().minusHours(4)
        );
        jdbcTemplate.update(
            "INSERT INTO audit_logs (id, action, resource_type, resource_id, user_id, user_name, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
            "al-5", "LOGIN", "admin_user", "au-1", "au-1", "admin@example.com", "{\"result\": \"success\"}", "192.168.1.100", java.time.OffsetDateTime.now().minusHours(5)
        );
        log.info("已插入5条审计日志");
    }

    private void initializeTranslations() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM translation_keys", Integer.class);
        if (count != null && count > 0) {
            log.info("translation_keys表已有{}条数据，跳过初始化", count);
            return;
        }
        
        log.info("初始化翻译数据...");
        jdbcTemplate.update(
            "INSERT INTO translation_keys (id, key, namespace, description) VALUES (?, ?, ?, ?)",
            "tk-1", "common.welcome", "common", "欢迎语"
        );
        jdbcTemplate.update(
            "INSERT INTO translation_keys (id, key, namespace, description) VALUES (?, ?, ?, ?)",
            "tk-2", "common.add_to_cart", "common", "加入购物车按钮"
        );
        jdbcTemplate.update(
            "INSERT INTO translation_keys (id, key, namespace, description) VALUES (?, ?, ?, ?)",
            "tk-3", "order.status.pending", "order", "订单状态-待处理"
        );
        
        jdbcTemplate.update(
            "INSERT INTO translation_values (id, key_id, locale, value, is_translated) VALUES (?, ?, ?, ?, ?)",
            "tv-1", "tk-1", "zh", "欢迎光临", true
        );
        jdbcTemplate.update(
            "INSERT INTO translation_values (id, key_id, locale, value, is_translated) VALUES (?, ?, ?, ?, ?)",
            "tv-2", "tk-1", "en", "Welcome", true
        );
        jdbcTemplate.update(
            "INSERT INTO translation_values (id, key_id, locale, value, is_translated) VALUES (?, ?, ?, ?, ?)",
            "tv-3", "tk-2", "zh", "加入购物车", true
        );
        jdbcTemplate.update(
            "INSERT INTO translation_values (id, key_id, locale, value, is_translated) VALUES (?, ?, ?, ?, ?)",
            "tv-4", "tk-2", "en", "Add to Cart", true
        );
        jdbcTemplate.update(
            "INSERT INTO translation_values (id, key_id, locale, value, is_translated) VALUES (?, ?, ?, ?, ?)",
            "tv-5", "tk-3", "zh", "待处理", true
        );
        jdbcTemplate.update(
            "INSERT INTO translation_values (id, key_id, locale, value, is_translated) VALUES (?, ?, ?, ?, ?)",
            "tv-6", "tk-3", "en", "Pending", true
        );
        log.info("已插入3个翻译键和6个翻译值");
    }
}
