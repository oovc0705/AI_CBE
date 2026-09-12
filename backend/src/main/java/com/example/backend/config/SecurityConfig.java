package com.example.backend.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /** API 文档开关：本地开发开启以便前端 openapi 生成，生产关闭后文档端点需鉴权 */
    @Value("${springdoc.api-docs.enabled:true}")
    private boolean apiDocsEnabled;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers(
                    "/api/login/account",
                    "/api/storefront/**",
                    "/api/health",
                    "/api/cart/**",
                    "/api/policies/**",
                    "/api/sitemap.xml",
                    "/api/subscribers",
                    "/actuator/health"
                ).permitAll();
                if (apiDocsEnabled) {
                    auth.requestMatchers(
                        "/actuator/info",
                        "/actuator/prometheus",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html"
                    ).permitAll();
                }
                auth
                // 商品：只读公开（C 端浏览），写操作限运营角色
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers("/api/products/**").hasAnyRole("ADMIN", "OPERATOR")
                // 订单：游客结账（创建/支付/售后请求）与只读查询公开，管理操作限运营角色
                .requestMatchers(HttpMethod.GET, "/api/orders/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/orders/*/pay", "/api/orders/*/support-requests").permitAll()
                .requestMatchers("/api/orders/**").hasAnyRole("ADMIN", "OPERATOR")
                // 管理端：写操作限 ADMIN/OPERATOR，只读查询额外允许 VIEWER
                .requestMatchers(HttpMethod.GET, "/api/admin/**").hasAnyRole("ADMIN", "OPERATOR", "VIEWER")
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "OPERATOR")
                .anyRequest().authenticated();
            })
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                        "{\"success\":false,\"errorCode\":\"401\",\"errorMessage\":\"请先登录\"}"
                    );
                })
                .accessDeniedHandler((request, response, deniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                        "{\"success\":false,\"errorCode\":\"403\",\"errorMessage\":\"无权访问该资源\"}"
                    );
                })
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
