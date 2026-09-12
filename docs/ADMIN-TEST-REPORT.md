# Admin Full API Test Report

- Generated: 2026-07-03 21:02:51
- Backend base: http://localhost:8081
- AI service:   http://localhost:8000
- Login user:   admin (dev fallback)

## 1. Summary

| Metric | Count |
|--------|-------|
| Total requests | 113 |
| 2xx success    | 104 |
| 4xx client err | 0 |
| 5xx / network  | 9 |
| Other (3xx)    | 0 |

## 2. Failures (status < 200 or >= 300)

| Module | Method | Path | Status | Note | Response snippet |
|--------|--------|------|--------|------|------------------|
| Currencies | POST | /api/admin/currencies | 500 |  |  |
| Currencies | POST | /api/admin/currencies | 500 |  |  |
| Currencies | POST | /api/admin/currencies | 500 |  |  |
| Currencies | POST | /api/admin/currencies | 500 |  |  |
| Currencies | POST | /api/admin/currencies | 500 |  |  |
| ShippingCarriers | POST | /api/admin/shipping/carriers | 500 |  |  |
| ShippingCarriers | POST | /api/admin/shipping/carriers | 500 |  |  |
| ShippingCarriers | POST | /api/admin/shipping/carriers | 500 |  |  |
| ShippingCarriers | POST | /api/admin/shipping/carriers | 500 |  |  |

## 3. Module data snapshot (data retained for admin UI)

> 鍏ㄩ儴鏁版嵁宸蹭繚鐣欙紝鏃犱换浣?DELETE銆傝繍琛屽悗 admin 鍚勯〉闈㈠彲瑙佺殑璁板綍鏁帮細

| Module | Endpoint | Records |
|--------|----------|---------|
| Products | /api/admin/products?page=0&size=1 | 52 |
| Categories | /api/admin/categories?page=0&size=1 | 6 |
| Brands | /api/admin/brands?page=0&size=1 | 38 |
| Orders | /api/admin/orders?page=0&size=1 | 6 |
| Coupons | /api/admin/coupons?page=0&size=1 | 5 |
| Promotions | /api/admin/promotions | 20 |
| Reviews | /api/admin/reviews?page=0&size=1 | 0 |
| Subscribers | /api/admin/subscribers?page=0&size=1 | 1 |
| Support | /api/admin/support?page=0&size=1 | 1 |
| Notifications | /api/admin/notifications?page=0&size=1 | 0 |
| EmailTemplates | /api/admin/email/templates | 3 |
| EmailCampaigns | /api/admin/email/campaigns | 8 |
| KBDocuments | /api/admin/kb/documents | 7 |
| Faq | /api/admin/kb/faq | 20 |
| Translations | /api/admin/translations/keys | 4 |
| Currencies | /api/admin/currencies | 9 |
| TaxRules | /api/admin/tax/rules | 16 |
| ShippingCarriers | /api/admin/shipping/carriers | 4 |
| ShippingTemplates | /api/admin/shipping/templates | 1 |
| PaymentGateways | /api/admin/payment/gateways | 16 |
| PaymentTransactions | /api/admin/payment/transactions?page=0&size=1 | 0 |
| RBAC Users | /api/admin/rbac/users | 0 |
| RBAC Roles | /api/admin/rbac/roles | 4 |

## 4. Full request log

| Module | Method | Path | Status | Latency(ms) | Note | Response snippet |
|--------|--------|------|--------|-------------|------|------------------|
| Auth | GET | /api/currentUser | 200 | 13 | OK | {"code":200,"data":{"name":"admin","avatar":null,"userid":"admin","email":"admin@example.com","access":"admin"},"message |
| Auth | POST | /api/login/outLogin | 200 | 5 | OK | {"code":200,"data":null,"message":"success","success":true} |
| Dashboard | GET | /api/admin/dashboard/overview | 200 | 43 | OK | {"code":200,"data":{"todayRevenue":0,"sevenDayOrders":4,"pendingTickets":1,"openTickets":0,"lowStockProducts":3,"totalPr |
| Dashboard | GET | /api/admin/dashboard/sales-trend?days=30 | 200 | 7 | OK | {"code":200,"data":[{"date":"2026-06-27","revenue":611.00,"order_count":4},{"date":"2026-06-24","revenue":273.99,"order_ |
| Dashboard | GET | /api/admin/dashboard/top-products?days=30&limit=5 | 200 | 9 | OK | {"code":200,"data":[{"revenue":130.00,"productid":11,"productname":"Under Armour HeatGear Hoodie","totalsold":2},{"reven |
| Dashboard | GET | /api/admin/dashboard/stats | 200 | 33 | OK | {"code":200,"data":{"todayRevenue":0,"sevenDayOrders":4,"pendingTickets":1,"openTickets":0,"lowStockProducts":3,"totalPr |
| Products | GET | /api/admin/products?page=0&size=5 | 200 | 22 | OK | {"code":200,"data":{"content":[{"brand":"FlipBelt","brandId":34,"category":"Accessories","categoryId":4,"createdAt":"202 |
| Products | GET | /api/admin/products?page=0&size=20&keyword=shirt | 200 | 15 | OK | {"code":200,"data":{"content":[{"brand":"Nike","brandId":1,"category":"Apparel","categoryId":3,"createdAt":"2026-06-21T0 |
| Products | POST | /api/admin/products/batch/price | 200 | 46 | OK | {"code":200,"data":[],"message":"success","success":true} |
| Products | POST | /api/admin/products/batch/status | 200 | 8 | OK | {"code":400,"data":null,"message":"Invalid status","success":false} |
| Products | POST | /api/admin/products/batch/restock | 200 | 8 | OK | {"code":200,"data":[],"message":"success","success":true} |
| Products | GET | /api/admin/products/import/template | 200 | 20 | OK | product_slug,name,description,category,brand,image_url,price,stock,sku,variant_attributes,variant_price,variant_stock n |
| Products | POST | /api/admin/products/import | 200 | 59 | OK | {"code":200,"data":{"errors":[{"row":2,"source":"null / AUTO-","reason":"product_slug is required"}],"failed":1,"importe |
| Orders | GET | /api/admin/orders?page=0&size=5 | 200 | 12 | OK | {"code":200,"data":{"content":[{"couponId":null,"createdAt":"2026-06-27T14:02:32.741106Z","currency":"USD","customerEmai |
| Orders | GET | /api/admin/orders?page=0&size=10&status=PENDING | 200 | 10 | OK | {"code":200,"data":{"content":[],"first":false,"last":false,"number":0,"size":10,"totalElements":0,"totalPages":0},"mess |
| Categories | GET | /api/admin/categories?page=0&size=20 | 200 | 17 | OK | {"code":200,"data":{"content":[{"children":null,"createdAt":"2026-06-29T13:03:53.945226Z","id":6,"nameI18n":{"array":fal |
| Categories | POST | /api/admin/categories | 200 | 52 | OK | {"code":200,"data":{"children":null,"createdAt":null,"id":18,"nameI18n":{"array":false,"bigDecimal":false,"bigInteger":f |
| Categories | GET | /api/admin/categories/18 | 200 | 52 | OK | {"code":200,"data":{"children":null,"createdAt":"2026-07-03T13:02:50.047101Z","id":18,"nameI18n":{"array":false,"bigDeci |
| Categories | PUT | /api/admin/categories/18 | 200 | 26 | OK | {"code":200,"data":{"children":null,"createdAt":"2026-07-03T13:02:50.047101Z","id":18,"nameI18n":{"array":false,"bigDeci |
| Categories | DELETE | /api/admin/categories/18 | 200 | 12 | OK | {"code":200,"data":null,"message":"success","success":true} |
| Brands | GET | /api/admin/brands?page=0&size=20 | 200 | 14 | OK | {"code":200,"data":{"content":[{"createdAt":"2026-06-30T13:38:28.944496Z","id":44,"logoUrl":null,"name":"Test Brand v2", |
| Brands | POST | /api/admin/brands | 200 | 11 | OK | {"code":200,"data":{"createdAt":null,"id":45,"logoUrl":null,"name":"Test Brand","products":null,"slug":"test-brand-21025 |
| Brands | PUT | /api/admin/brands/45 | 200 | 12 | OK | {"code":200,"data":{"createdAt":"2026-07-03T13:02:50.179546Z","id":45,"logoUrl":null,"name":"Test Brand v2","products":n |
| Coupons | GET | /api/admin/coupons?page=0&size=20 | 200 | 14 | OK | {"code":200,"data":{"content":[{"code":"TEST7451","createdAt":"2026-07-02T13:35:56.950311Z","expiresAt":"2027-12-31T00:0 |
| Coupons | POST | /api/admin/coupons | 200 | 21 | OK | {"code":200,"data":{"code":"TEST210250","createdAt":null,"expiresAt":null,"id":13,"minOrderAmount":null,"status":"ACTIVE |
| Coupons | GET | /api/admin/coupons/13 | 200 | 7 | OK | {"code":200,"data":{"code":"TEST210250","createdAt":"2026-07-03T13:02:50.226678Z","expiresAt":null,"id":13,"minOrderAmou |
| Coupons | PUT | /api/admin/coupons/13 | 200 | 13 | OK | {"code":200,"data":{"code":"TEST210250","createdAt":"2026-07-03T13:02:50.226678Z","expiresAt":null,"id":13,"minOrderAmou |
| Coupons | POST | /api/admin/coupons/13/toggle | 200 | 10 | OK | {"code":200,"data":{"code":"TEST210250","createdAt":"2026-07-03T13:02:50.226678Z","expiresAt":null,"id":13,"minOrderAmou |
| Promotions | GET | /api/admin/promotions | 200 | 8 | OK | {"code":200,"data":[{"createdAt":"2026-06-30T13:38:29.063074Z","discountType":"FIXED","discountValue":20.0,"enabled":fal |
| Promotions | GET | /api/admin/promotions?enabled=true | 200 | 8 | OK | {"code":200,"data":[{"createdAt":"2026-06-30T13:38:29.054824Z","discountType":"PERCENTAGE","discountValue":15.0,"enabled |
| Promotions | POST | /api/admin/promotions | 200 | 22 | OK | {"code":200,"data":{"id":"c572d1e8-7449-4e1b-9c08-d7a148fb7ee9"},"message":"åå»ºæå","success":true} |
| Promotions | POST | /api/admin/promotions | 200 | 10 | OK | {"code":200,"data":{"id":"772446ee-6892-4a25-bad5-70ec7f4888b6"},"message":"åå»ºæå","success":true} |
| Promotions | POST | /api/admin/promotions | 200 | 8 | OK | {"code":200,"data":{"id":"41408fd1-c13c-4b19-858e-515c6e101a21"},"message":"åå»ºæå","success":true} |
| Promotions | POST | /api/admin/promotions | 200 | 9 | OK | {"code":200,"data":{"id":"4ec9be48-dde3-4fd4-8493-bac10ece6985"},"message":"åå»ºæå","success":true} |
| Promotions | POST | /api/admin/promotions | 200 | 11 | OK | {"code":200,"data":{"id":"723d3e16-9498-4418-80a5-501e44d999c8"},"message":"åå»ºæå","success":true} |
| Reviews | GET | /api/admin/reviews/stats | 200 | 23 | OK | {"code":200,"data":{"total":0,"approved":0,"rejected":0,"pending":0,"average_rating":0.0},"message":"success","success": |
| Reviews | GET | /api/admin/reviews?page=0&size=20 | 200 | 9 | OK | {"code":200,"data":{"content":[],"first":false,"last":true,"number":-1,"size":20,"totalElements":0,"totalPages":0},"mess |
| Subscribers | GET | /api/admin/subscribers?page=0&size=20 | 200 | 12 | OK | {"code":200,"data":{"content":[{"active":true,"createdAt":"2026-06-27T15:01:18.785498Z","email":"3176868773@qq.com","id" |
| Subscribers | GET | /api/admin/subscribers/stats | 200 | 9 | OK | {"code":200,"data":{"inactive":0,"total":1,"active":1},"message":"success","success":true} |
| EmailCampaigns | GET | /api/admin/email/campaigns | 200 | 9 | OK | {"code":200,"data":[{"bodyHtml":"<p>Use code WELCOME15</p>","createdAt":"2026-06-30T13:38:29.189717Z","createdBy":"admin |
| EmailTemplates | GET | /api/admin/email/templates | 200 | 6 | OK | {"code":200,"data":[],"message":"success","success":true} |
| EmailTemplates | POST | /api/admin/email/templates | 200 | 15 | OK | {"code":200,"data":{"id":"43011d17-5c01-44d3-9354-a9f6f607ce91"},"message":"åå»ºæå","success":true} |
| EmailTemplates | POST | /api/admin/email/templates | 200 | 10 | OK | {"code":200,"data":{"id":"77850723-283e-49cb-8e2e-9b593ad23f0c"},"message":"åå»ºæå","success":true} |
| EmailTemplates | POST | /api/admin/email/templates | 200 | 9 | OK | {"code":200,"data":{"id":"7f5770ec-016e-4524-86b4-49c4bbb19a65"},"message":"åå»ºæå","success":true} |
| EmailCampaigns | POST | /api/admin/email/campaigns | 200 | 11 | OK | {"code":200,"data":{"id":"965e7689-e6b8-4570-840d-43223bbc2e09"},"message":"åå»ºæå","success":true} |
| EmailCampaigns | POST | /api/admin/email/campaigns | 200 | 8 | OK | {"code":200,"data":{"id":"340c713c-8720-45a9-af55-cb4952b189dc"},"message":"åå»ºæå","success":true} |
| Support | GET | /api/admin/support/stats | 200 | 15 | OK | {"code":200,"data":{"total":1,"inProgress":1,"closed":0,"open":0,"resolved":0},"message":"success","success":true} |
| Support | GET | /api/admin/support?page=0&size=20 | 200 | 15 | OK | {"code":200,"data":{"content":[{"adminReply":"å°æ¬çå®¢æ·æ¨å¥½ï¼éå¸¸æ±æ­ç»æ¨å¸¦æ¥ä¸ä¾¿ãå³äºæ¨çè®¢å |
| Support | GET | /api/admin/support?page=0&size=1 | 200 | 9 | OK | {"code":200,"data":{"content":[{"adminReply":"å°æ¬çå®¢æ·æ¨å¥½ï¼éå¸¸æ±æ­ç»æ¨å¸¦æ¥ä¸ä¾¿ãå³äºæ¨çè®¢å |
| Notifications | GET | /api/admin/notifications?page=0&size=20 | 200 | 7 | OK | {"code":200,"data":{"content":[],"first":false,"last":true,"number":-1,"size":20,"totalElements":0,"totalPages":0},"mess |
| Notifications | GET | /api/admin/notifications/stats | 200 | 7 | OK | {"code":200,"data":{"total":0,"unread":0},"message":"success","success":true} |
| Notifications | PUT | /api/admin/notifications/read-all | 200 | 6 | OK | {"code":200,"data":null,"message":"å¨é¨å·²è¯»","success":true} |
| KnowledgeBase | GET | /api/admin/kb/documents | 200 | 6 | OK | {"code":200,"data":[{"chunkCount":0,"collection":"copilot_kb","content":"ï»¿auto test content\r\n","createdAt":"2026-06- |
| KnowledgeBase | POST | /api/admin/kb/documents/upload | 200 | 32 | OK | {"code":200,"data":{"id":"499933a9-3666-4d3b-8302-b84f1a918cdd"},"message":"上传成功","success":true} |
| KnowledgeBase | GET | /api/admin/kb/documents | 200 | 6 | OK | {"code":200,"data":[{"chunkCount":0,"collection":"copilot_kb","content":"ï»¿auto test content\r\n","createdAt":"2026-07- |
| KnowledgeBase | POST | /api/admin/kb/documents/499933a9-3666-4d3b-8302-b84f1a918cdd/train | 200 | 11 | OK | {"code":200,"data":null,"message":"å·²å¼å§è®­ç»","success":true} |
| Faq | GET | /api/admin/kb/faq | 200 | 11 | OK | {"code":200,"data":[{"answer":"Log in to your account and visit My Orders. Tracking info appears once the order ships.", |
| Faq | POST | /api/admin/kb/faq | 200 | 11 | OK | {"code":200,"data":{"id":"7625fb70-7ade-4ad7-b038-19d0d8e04c35"},"message":"åå»ºæå","success":true} |
| Faq | POST | /api/admin/kb/faq | 200 | 8 | OK | {"code":200,"data":{"id":"850bde50-3642-4861-b1ca-990c80723b2e"},"message":"åå»ºæå","success":true} |
| Faq | POST | /api/admin/kb/faq | 200 | 8 | OK | {"code":200,"data":{"id":"1762e2ff-1a21-49c4-9b69-43e93a21c9ac"},"message":"åå»ºæå","success":true} |
| Faq | POST | /api/admin/kb/faq | 200 | 8 | OK | {"code":200,"data":{"id":"9d98319d-9924-4d98-887b-11170fa90593"},"message":"åå»ºæå","success":true} |
| Faq | POST | /api/admin/kb/faq | 200 | 7 | OK | {"code":200,"data":{"id":"07063765-d2d7-4ac0-89e2-8e4d2e8c7865"},"message":"åå»ºæå","success":true} |
| Translations | GET | /api/admin/translations | 200 | 16 | OK | {"code":200,"data":{"content":[{"createdAt":"2026-06-30T12:50:58.146980Z","description":"auto test v2","id":"56a830ff-87 |
| Translations | GET | /api/admin/translations/stats | 200 | 8 | OK | {"code":200,"data":{"locales":{"en-US":{"total":8,"progress":100,"translated":8}},"total_keys":3},"message":"success","s |
| Translations | GET | /api/admin/translations/export?locale=en-US | 200 | 9 | OK | {"9cb120a6-2bf4-4218-a867-e0f1dca9c6e5.en-US":"auto 2","d583d129-692d-4f3c-9628-fc54a0662f0d.en-US":"auto 2","56a830ff-8 |
| Translations | GET | /api/admin/translations/keys | 200 | 6 | OK | {"code":200,"data":[{"createdAt":"2026-06-30T12:50:58.146980Z","description":"auto test v2","id":"56a830ff-87b0-4231-8b6 |
| Translations | POST | /api/admin/translations/keys | 200 | 11 | OK | {"code":200,"data":{"id":"4be5dcdb-bb25-44b2-a726-753cc9ccc681"},"message":"åå»ºæå","success":true} |
| Translations | PUT | /api/admin/translations/keys/4be5dcdb-bb25-44b2-a726-753cc9ccc681 | 200 | 10 | OK | {"code":200,"data":null,"message":"æ´æ°æå","success":true} |
| Translations | GET | /api/admin/translations/keys/4be5dcdb-bb25-44b2-a726-753cc9ccc681/values | 200 | 6 | OK | {"code":200,"data":[],"message":"success","success":true} |
| Translations | POST | /api/admin/translations/values | 200 | 10 | OK | {"code":200,"data":null,"message":"ä¿å­æå","success":true} |
| Translations | PUT | /api/admin/translations/keys/4be5dcdb-bb25-44b2-a726-753cc9ccc681/values/en-US | 200 | 12 | OK | {"code":200,"data":null,"message":"ä¿å­æå","success":true} |
| Currencies | GET | /api/admin/currencies | 200 | 6 | OK | {"code":200,"data":[{"code":"CNY","createdAt":"2026-06-30T12:50:58.237319Z","decimals":2,"enabled":true,"exchangeRate":7 |
| Currencies | POST | /api/admin/currencies | 500 | 40 |  |  |
| Currencies | POST | /api/admin/currencies | 500 | 22 |  |  |
| Currencies | POST | /api/admin/currencies | 500 | 12 |  |  |
| Currencies | POST | /api/admin/currencies | 500 | 9 |  |  |
| Currencies | POST | /api/admin/currencies | 500 | 11 |  |  |
| TaxRules | GET | /api/admin/tax/rules | 200 | 9 | OK | {"code":200,"data":[{"countryCode":"JP","createdAt":"2026-06-30T13:38:29.509287Z","enabled":true,"id":"0f4cb230-1b90-40a |
| TaxRules | POST | /api/admin/tax/rules | 200 | 34 | OK | {"code":200,"data":{"id":"166e8cc8-985b-442b-b2bb-f31201de9833"},"message":"åå»ºæå","success":true} |
| TaxRules | POST | /api/admin/tax/rules | 200 | 7 | OK | {"code":200,"data":{"id":"2ab40f53-9d2d-4676-87cd-2aa655354ca0"},"message":"åå»ºæå","success":true} |
| TaxRules | POST | /api/admin/tax/rules | 200 | 8 | OK | {"code":200,"data":{"id":"b28f0f18-5e11-4ecb-a513-77a22b1207bd"},"message":"åå»ºæå","success":true} |
| TaxRules | POST | /api/admin/tax/rules | 200 | 7 | OK | {"code":200,"data":{"id":"2c8657c3-2ad1-4184-90af-f356c80545ff"},"message":"åå»ºæå","success":true} |
| TaxRules | GET | /api/admin/tax/rules/calculate?country_code=US&subtotal=100 | 200 | 7 | OK | {"code":200,"data":{"shipping_fee":0,"tax_amount":0.3500,"total":100.3500,"subtotal":100,"applied_rules":[{"rate":0.0875 |
| ShippingCarriers | GET | /api/admin/shipping/carriers | 200 | 4 | OK | {"code":200,"data":[{"apiType":"REST","code":"ups","contactPhone":"1-800-742-5877","createdAt":"2026-06-30T12:50:58.3152 |
| ShippingCarriers | POST | /api/admin/shipping/carriers | 500 | 13 |  |  |
| ShippingCarriers | POST | /api/admin/shipping/carriers | 500 | 12 |  |  |
| ShippingCarriers | POST | /api/admin/shipping/carriers | 500 | 10 |  |  |
| ShippingCarriers | POST | /api/admin/shipping/carriers | 500 | 11 |  |  |
| ShippingTemplates | GET | /api/admin/shipping/templates | 200 | 18 | OK | {"code":200,"data":{"content":[{"billingType":"weight","createdAt":"2026-06-29T14:43:22.711120Z","enabled":true,"id":"47 |
| PaymentGateways | GET | /api/admin/payment/gateways | 200 | 8 | OK | {"code":200,"data":[{"connected":false,"createdAt":"2026-06-30T13:38:29.634238Z","displayName":"WeChat Pay","enabled":fa |
| PaymentGateways | POST | /api/admin/payment/gateways | 200 | 10 | OK | {"code":200,"data":{"id":"1d6d2e46-60cd-4450-8a8f-0176bee067ec"},"message":"åå»ºæå","success":true} |
| PaymentGateways | POST | /api/admin/payment/gateways | 200 | 8 | OK | {"code":200,"data":{"id":"8db24fdc-a6ce-43eb-8bf8-796bb0c277c4"},"message":"åå»ºæå","success":true} |
| PaymentGateways | POST | /api/admin/payment/gateways | 200 | 7 | OK | {"code":200,"data":{"id":"7302b242-2cec-454f-a202-7113bc85314d"},"message":"åå»ºæå","success":true} |
| PaymentGateways | POST | /api/admin/payment/gateways | 200 | 8 | OK | {"code":200,"data":{"id":"17882e78-94bc-4bdf-9591-e8a1db27b411"},"message":"åå»ºæå","success":true} |
| PaymentTransactions | GET | /api/admin/payment/transactions | 200 | 12 | OK | {"code":200,"data":{"content":[],"first":true,"last":true,"number":0,"size":20,"totalElements":0,"totalPages":0},"messag |
| PaymentTransactions | GET | /api/admin/payment/transactions/reconcile | 200 | 8 | OK | {"code":200,"data":{"totalTransactions":0,"totalAmount":0.0,"currency":"USD"},"message":"success","success":true} |
| RBAC | GET | /api/admin/rbac/users | 200 | 7 | OK | {"code":200,"data":[],"message":"success","success":true} |
| RBAC | GET | /api/admin/rbac/roles | 200 | 4 | OK | {"code":200,"data":[],"message":"success","success":true} |
| RBAC | POST | /api/admin/rbac/roles | 200 | 13 | OK | {"code":200,"data":{"id":"f3a0b10d-f3f5-4904-bc14-9724697df086"},"message":"åå»ºæå","success":true} |
| RBAC | POST | /api/admin/rbac/roles | 200 | 10 | OK | {"code":200,"data":{"id":"c9c4f40b-392c-4f1b-b3ec-7ba969909f17"},"message":"åå»ºæå","success":true} |
| RBAC | POST | /api/admin/rbac/roles | 200 | 9 | OK | {"code":200,"data":{"id":"411e549e-512b-414c-831d-87b5dd341d50"},"message":"åå»ºæå","success":true} |
| RBAC | POST | /api/admin/rbac/roles | 200 | 8 | OK | {"code":200,"data":{"id":"56644b8f-8b7f-4611-8797-b8fe110b3bce"},"message":"åå»ºæå","success":true} |
| Audit | GET | /api/admin/audit/logs?page=0&size=20 | 200 | 10 | OK | {"code":200,"data":{"content":[],"first":false,"last":true,"number":-1,"size":20,"totalElements":0,"totalPages":0},"mess |
| Export | GET | /api/admin/export/products | 200 | 8 | OK | id,name,price,stock,status,created_at 81,FlipBelt Running Belt,32.00,10,ACTIVE,2026-06-29 21:09:29.651546 63,Reebok Floa |
| Export | GET | /api/admin/export/orders | 200 | 4 | OK | id,user_id,total_amount,status,created_at 27,,159.00,PAID,2026-06-27 22:02:32.741106 26,,139.00,PAID,2026-06-27 22:00:28 |
| Export | GET | /api/admin/export/users | 200 | 4 | OK | id,username,email,role,created_at  |
| Export | GET | /api/admin/export/reviews | 200 | 4 | OK | id,product_id,product_name,user_id,user_name,rating,title,content,status,merchant_reply,created_at  |
| Export | GET | /api/admin/export/transactions | 200 | 4 | OK | id,order_id,gateway_id,gateway_transaction_id,amount,currency,status,created_at  |
| SiteConfig | GET | /api/admin/site-config | 200 | 5 | OK | {"code":200,"data":{"descriptionTemplate":"Premium quality products at affordable prices. Shop now at MyStore.","gaMeasu |
| StorefrontSiteConfig | GET | /api/storefront/site-config | 200 | 4 | OK | {"code":200,"data":{"descriptionTemplate":"Premium quality products at affordable prices. Shop now at MyStore.","gaMeasu |
| AI Service | GET | /health | 200 | 0 | OK | {"status":"ok"} |
| AI Service | GET | /api/copilot/sessions | 200 | 0 | OK | {"success":true,"data":[{"id":"copilot_100436e66ff84507","title":"IDä¸º81çååï¼åºå­æ¹ä¸º9","created_at":"2026-0 |
| AI Service | GET | /api/copilot/operations | 200 | 0 | OK | {"success":true,"data":[]} |
