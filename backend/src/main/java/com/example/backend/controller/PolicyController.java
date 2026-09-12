package com.example.backend.controller;

import com.example.backend.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {

    @Value("${app.support-email:support@mystore.com}")
    private String supportEmail;

    @Value("${app.support-whatsapp:}")
    private String supportWhatsapp;

    @Value("${app.trust-badges.authentic:Authentic Guaranteed}")
    private String badgeAuthentic;

    @Value("${app.trust-badges.shipping:Fast Shipping}")
    private String badgeShipping;

    @Value("${app.trust-badges.returns:7-Day Free Returns}")
    private String badgeReturns;

    @Value("${app.trust-badges.secure:Secure Checkout}")
    private String badgeSecure;

    @GetMapping("/{slug}")
    public Result<Map<String, Object>> getPolicy(@PathVariable String slug) {
        // Static policy metadata; full content is served by the frontend from JSON.
        Map<String, String> titleMap = Map.of(
            "privacy-policy", "Privacy Policy",
            "terms-of-service", "Terms of Service",
            "refund-policy", "Refund Policy",
            "shipping-policy", "Shipping Policy"
        );

        if (!titleMap.containsKey(slug)) {
            return Result.error(404, "Policy not found");
        }

        Map<String, Object> data = Map.of(
            "slug", slug,
            "title", titleMap.get(slug),
            "supportEmail", supportEmail,
            "supportWhatsapp", supportWhatsapp
        );

        return Result.success(data);
    }

    @GetMapping("/trust-badges")
    public Result<Map<String, Object>> getTrustBadges() {
        Map<String, Object> badges = Map.of(
            "badges", new Object[]{
                Map.of("label", badgeAuthentic, "icon", "shield"),
                Map.of("label", badgeShipping, "icon", "truck"),
                Map.of("label", badgeReturns, "icon", "refresh"),
                Map.of("label", badgeSecure, "icon", "lock")
            },
            "supportEmail", supportEmail,
            "supportWhatsapp", supportWhatsapp
        );
        return Result.success(badges);
    }
}
