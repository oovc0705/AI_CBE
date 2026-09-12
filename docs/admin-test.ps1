#requires -Version 5.1
<#
.SYNOPSIS
  Admin 后台全量接口真实联调测试（Java 后端 + PostgreSQL + ai-service + admin 前端）。
.DESCRIPTION
  通过 admin/ant.design 登录拿 token，逐个调用 admin controller 暴露的端点，
  把每个请求的状态码/响应/耗时/错误信息汇总成 Markdown 报告。
.NOTES
  - 测试数据**全部保留**（不删除任何已存在或新建的数据）
  - 每次运行会向空模块额外 seed 一批示例数据，保证 admin 每个功能页都有可见数据
  - 默认 baseUrl=http://localhost:8080（如果跑在 8081 可通过 -BaseUrl 改）
  - 输出 docs/ADMIN-TEST-REPORT.md
#>
param(
  [string]$BaseUrl = 'http://localhost:8081',
  [string]$OutputMd = 'd:\ai_cbe\docs\ADMIN-TEST-REPORT.md',
  [string]$AdminUser = 'admin',
  [string]$AdminPass = 'ant.design'
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

# -------------------- 工具函数 --------------------
function Write-TestRow {
  param(
    [string]$Group, [string]$Method, [string]$Url,
    [int]$Status, [string]$Note, [int]$Ms, [string]$Sample
  )
  $sampleShort = ''
  if ($Sample) {
    $sampleShort = $Sample.Substring(0, [Math]::Min(120, $Sample.Length))
  }
  $noteEscaped = $Note.Replace('|','\|')
  $sampleEscaped = $sampleShort.Replace('|','\|').Replace("`r",'').Replace("`n",' ')
  $script:Rows += [pscustomobject]@{
    Group = $Group; Method = $Method; Url = $Url;
    Status = $Status; Note = $noteEscaped; Ms = $Ms; Sample = $sampleEscaped
  }
}

function Invoke-AdminApi {
  <#
    .SYNOPSIS 调用一次后台 API 并记录
  #>
  param(
    [Parameter(Mandatory)][string]$Group,
    [Parameter(Mandatory)][ValidateSet('GET','POST','PUT','DELETE','PATCH')][string]$Method,
    [Parameter(Mandatory)][string]$Url,
    [string]$Body = '',
    [hashtable]$Headers = @{}
  )
  $full = if ($Url.StartsWith('http')) { $Url } else { "$BaseUrl$Url" }
  $hdr = @{ 'Authorization' = "Bearer $script:Token"; 'Accept' = 'application/json' }
  foreach ($k in $Headers.Keys) { $hdr[$k] = $Headers[$k] }
  $params = @{
    Uri = $full
    Method = $Method
    Headers = $hdr
    UseBasicParsing = $true
    TimeoutSec = 15
  }
  if ($Body) {
    $params['Body'] = $Body
    $params['ContentType'] = 'application/json'
  }
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $resp = Invoke-WebRequest @params
    $sw.Stop()
    $code = [int]$resp.StatusCode
    $content = $resp.Content
    $note = if ($code -ge 200 -and $code -lt 300) { 'OK' } else { "HTTP $code" }
    Write-TestRow -Group $Group -Method $Method -Url $Url -Status $code -Note $note -Ms $sw.ElapsedMilliseconds -Sample $content
    return [pscustomobject]@{ Status=$code; Content=$content; Ok=($code -ge 200 -and $code -lt 300) }
  } catch {
    $sw.Stop()
    $code = 0; $content = ''
    if ($_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
      try { $content = (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch {}
    } elseif ($_.Exception.Message) {
      $content = $_.Exception.Message
    }
    Write-TestRow -Group $Group -Method $Method -Url $Url -Status $code -Note $content -Ms $sw.ElapsedMilliseconds -Sample $content
    return [pscustomobject]@{ Status=$code; Content=$content; Ok=$false }
  }
}

function Get-Json {
  param([string]$Text, [string]$Path = '$')
  try {
    $j = $Text | ConvertFrom-Json -ErrorAction Stop
    if ($Path -eq '$') { return $j }
    return $j.$Path
  } catch { return $null }
}

function Send-MultipartForm {
  <#
    .SYNOPSIS 使用 .NET HttpClient 发送 multipart/form-data
    .NOTES  PowerShell 内置 Invoke-WebRequest 不支持 -Form；这里直接用 .NET
  #>
  param(
    [Parameter(Mandatory)][string]$Url,
    [Parameter(Mandatory)][hashtable]$FileFields,
    [hashtable]$TextFields = @{},
    [hashtable]$Headers = @{}
  )
  Add-Type -AssemblyName System.Net.Http -ErrorAction SilentlyContinue
  $handler = [System.Net.Http.HttpClientHandler]::new()
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromSeconds(30)
  $content = [System.Net.Http.MultipartFormDataContent]::new()
  foreach ($k in $TextFields.Keys) {
    $sc = [System.Net.Http.StringContent]::new([string]$TextFields[$k])
    $content.Add($sc, $k)
  }
  $tempFiles = @()
  foreach ($k in $FileFields.Keys) {
    $path = $FileFields[$k]
    $fs = [System.IO.File]::OpenRead($path)
    $fc = [System.Net.Http.StreamContent]::new($fs)
    $fc.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/octet-stream')
    $content.Add($fc, $k, [System.IO.Path]::GetFileName($path))
  }
  $req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, $Url)
  foreach ($k in $Headers.Keys) { $req.Headers.TryAddWithoutValidation($k, $Headers[$k]) | Out-Null }
  $req.Content = $content
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $resp = $client.SendAsync($req).GetAwaiter().GetResult()
    $sw.Stop()
    $body = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $code = [int]$resp.StatusCode
    return [pscustomobject]@{ Status=$code; Content=$body; Ms=$sw.ElapsedMilliseconds }
  } catch {
    $sw.Stop()
    $code = 0; $body = $_.Exception.Message
    if ($_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
      try { $body = (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch {}
    }
    return [pscustomobject]@{ Status=$code; Content=$body; Ms=$sw.ElapsedMilliseconds }
  } finally {
    $client.Dispose()
  }
}

# -------------------- 1. 登录拿 token --------------------
Write-Host "==> 1. 登录 $AdminUser@$BaseUrl" -ForegroundColor Cyan
$loginBody = "{`"username`":`"$AdminUser`",`"password`":`"$AdminPass`",`"type`":`"account`"}"
$loginResp = Invoke-WebRequest -Uri "$BaseUrl/api/login/account" -Method POST -ContentType 'application/json' -Body $loginBody -UseBasicParsing -TimeoutSec 10
$loginJson = $loginResp.Content | ConvertFrom-Json
$script:Token = $loginJson.data.token
if (-not $script:Token) { throw '登录失败，无法获取 token' }
# 整个脚本共用的 Authorization 头
$script:AuthHeader = @{ 'Authorization' = "Bearer $script:Token"; 'Accept' = 'application/json' }
Write-Host "    token len: $($script:Token.Length)" -ForegroundColor Green

$script:Rows = @()
$createdIds = @{}

# -------------------- 2. 公共/认证 --------------------
Invoke-AdminApi -Group 'Auth' -Method 'GET'  -Url '/api/currentUser' | Out-Null
Invoke-AdminApi -Group 'Auth' -Method 'POST' -Url '/api/login/outLogin' -Body '{}' | Out-Null

# -------------------- 3. Dashboard --------------------
Invoke-AdminApi -Group 'Dashboard' -Method 'GET' -Url '/api/admin/dashboard/overview' | Out-Null
Invoke-AdminApi -Group 'Dashboard' -Method 'GET' -Url '/api/admin/dashboard/sales-trend?days=30' | Out-Null
Invoke-AdminApi -Group 'Dashboard' -Method 'GET' -Url '/api/admin/dashboard/top-products?days=30&limit=5' | Out-Null
Invoke-AdminApi -Group 'Dashboard' -Method 'GET' -Url '/api/admin/dashboard/stats' | Out-Null

# -------------------- 4. 商品 --------------------
$prodList = Invoke-AdminApi -Group 'Products' -Method 'GET' -Url '/api/admin/products?page=0&size=5'
$firstProduct = Get-Json $prodList.Content 'data.content[0]'
Invoke-AdminApi -Group 'Products' -Method 'GET' -Url '/api/admin/products?page=0&size=20&keyword=shirt' | Out-Null
if ($firstProduct) {
  $pid = $firstProduct.id
  Invoke-AdminApi -Group 'Products' -Method 'GET' -Url "/api/admin/products/$pid" | Out-Null
  Invoke-AdminApi -Group 'Products' -Method 'POST' -Url "/api/admin/products/$pid/price" -Body '{"price":99.99}' | Out-Null
  Invoke-AdminApi -Group 'Products' -Method 'POST' -Url "/api/admin/products/$pid/status" -Body '{"status":"ONLINE"}' | Out-Null
  Invoke-AdminApi -Group 'Products' -Method 'POST' -Url "/api/admin/products/$pid/restock" -Body '{"quantity":5}' | Out-Null
}
Invoke-AdminApi -Group 'Products' -Method 'POST' -Url '/api/admin/products/batch/price'  -Body '{"items":[]}' | Out-Null
Invoke-AdminApi -Group 'Products' -Method 'POST' -Url '/api/admin/products/batch/status' -Body '{"productIds":[],"status":"OFFLINE"}' | Out-Null
Invoke-AdminApi -Group 'Products' -Method 'POST' -Url '/api/admin/products/batch/restock' -Body '{"items":[]}' | Out-Null
# 导入
Invoke-AdminApi -Group 'Products' -Method 'GET'  -Url '/api/admin/products/import/template' | Out-Null
# 真实 multipart：用一个最简单的 CSV（无变体，避免 CSV 中引号问题）
$tmpCsv = New-TemporaryFile
$csvBody = @"
product_slug,name,description,category,brand,image_url,price,stock,sku,variant_attributes,variant_price,variant_stock
auto-slug-$ts,Auto Product,auto test,Test Brand-$ts,Test Category-$ts,https://cdn.example.com/auto.jpg,99.00,10,AUTO-$ts,,,, 
"@
$csvBody | Out-File -FilePath $tmpCsv.FullName -Encoding utf8
$impForm = @{ file = $tmpCsv.FullName }
$ir = Send-MultipartForm -Url "$BaseUrl/api/admin/products/import" -FileFields $impForm -Headers $script:AuthHeader
Write-TestRow -Group 'Products' 'POST' '/api/admin/products/import' $ir.Status 'OK' $ir.Ms $ir.Content
Remove-Item $tmpCsv.FullName -Force -ErrorAction SilentlyContinue

# -------------------- 5. 订单 --------------------
$orderList = Invoke-AdminApi -Group 'Orders' -Method 'GET' -Url '/api/admin/orders?page=0&size=5'
$firstOrder = Get-Json $orderList.Content 'data.content[0]'
if ($firstOrder) {
  $oid = $firstOrder.id
  Invoke-AdminApi -Group 'Orders' -Method 'GET'  -Url "/api/admin/orders/$oid" | Out-Null
  Invoke-AdminApi -Group 'Orders' -Method 'GET'  -Url "/api/admin/orders/$oid/payments" | Out-Null
  Invoke-AdminApi -Group 'Orders' -Method 'POST' -Url "/api/admin/orders/$oid/status" -Body '{"status":"PENDING"}' | Out-Null
}
Invoke-AdminApi -Group 'Orders' -Method 'GET' -Url '/api/admin/orders?page=0&size=10&status=PENDING' | Out-Null

# -------------------- 6. 品类 / 品牌 --------------------
Invoke-AdminApi -Group 'Categories' -Method 'GET' -Url '/api/admin/categories?page=0&size=20' | Out-Null
$ts = (Get-Date -Format 'HHmmss')
$catBody = "{`"name`":`"Test Category`",`"slug`":`"test-cat-$ts`",`"description`":`"auto test`"}"
$catCreate = Invoke-AdminApi -Group 'Categories' -Method 'POST' -Url '/api/admin/categories' -Body $catBody
$newCat = Get-Json $catCreate.Content 'data'
if ($newCat -and $newCat.id) {
  Invoke-AdminApi -Group 'Categories' -Method 'GET'    -Url "/api/admin/categories/$($newCat.id)" | Out-Null
  Invoke-AdminApi -Group 'Categories' -Method 'PUT'    -Url "/api/admin/categories/$($newCat.id)" -Body '{"name":"Test Category v2"}' | Out-Null
  Invoke-AdminApi -Group 'Categories' -Method 'DELETE' -Url "/api/admin/categories/$($newCat.id)" | Out-Null
  $createdIds['cat'] = $newCat.id
}

Invoke-AdminApi -Group 'Brands' -Method 'GET' -Url '/api/admin/brands?page=0&size=20' | Out-Null
$brandBody = "{`"name`":`"Test Brand`",`"slug`":`"test-brand-$ts`"}"
$brandCreate = Invoke-AdminApi -Group 'Brands' -Method 'POST' -Url '/api/admin/brands' -Body $brandBody
$newBrand = Get-Json $brandCreate.Content 'data'
if ($newBrand -and $newBrand.id) {
  Invoke-AdminApi -Group 'Brands' -Method 'PUT' -Url "/api/admin/brands/$($newBrand.id)" -Body '{"name":"Test Brand v2"}' | Out-Null
}

# -------------------- 7. 优惠券 --------------------
Invoke-AdminApi -Group 'Coupons' -Method 'GET' -Url '/api/admin/coupons?page=0&size=20' | Out-Null
$coupBody = "{`"code`":`"TEST$ts`",`"name`":`"auto test`",`"type`":`"FIXED`",`"value`":10,`"status`":`"ACTIVE`"}"
$coupCreate = Invoke-AdminApi -Group 'Coupons' -Method 'POST' -Url '/api/admin/coupons' -Body $coupBody
$newCoup = Get-Json $coupCreate.Content 'data'
if ($newCoup -and $newCoup.id) {
  Invoke-AdminApi -Group 'Coupons' -Method 'GET'  -Url "/api/admin/coupons/$($newCoup.id)" | Out-Null
  Invoke-AdminApi -Group 'Coupons' -Method 'PUT'  -Url "/api/admin/coupons/$($newCoup.id)" -Body '{"name":"auto test v2","value":12}' | Out-Null
  Invoke-AdminApi -Group 'Coupons' -Method 'POST' -Url "/api/admin/coupons/$($newCoup.id)/toggle" | Out-Null
}

# -------------------- 8. 促销 --------------------
Invoke-AdminApi -Group 'Promotions' -Method 'GET' -Url '/api/admin/promotions' | Out-Null
Invoke-AdminApi -Group 'Promotions' -Method 'GET' -Url '/api/admin/promotions?enabled=true' | Out-Null
# seed: 多个促销
$promos = @(
  @{ name="Spring Sale 10% Off"; type="PERCENTAGE"; discount_type="PERCENTAGE"; discount_value=10; min_order_amount=50; usage_limit=1000; starts_at="2026-06-01T00:00:00Z"; ends_at="2026-12-31T23:59:59Z"; enabled=$true },
  @{ name="Summer Flash 20% Off"; type="PERCENTAGE"; discount_type="PERCENTAGE"; discount_value=20; min_order_amount=100; usage_limit=500; starts_at="2026-06-15T00:00:00Z"; ends_at="2026-08-31T23:59:59Z"; enabled=$true },
  @{ name="New Customer $5 Off"; type="FIXED"; discount_type="FIXED"; discount_value=5; min_order_amount=30; usage_limit=0; starts_at="2026-06-01T00:00:00Z"; ends_at="2027-06-01T00:00:00Z"; enabled=$true },
  @{ name="VIP 15% Off"; type="PERCENTAGE"; discount_type="PERCENTAGE"; discount_value=15; min_order_amount=200; usage_limit=200; starts_at="2026-06-01T00:00:00Z"; ends_at="2026-12-31T23:59:59Z"; enabled=$true },
  @{ name="Holiday $20 Off"; type="FIXED"; discount_type="FIXED"; discount_value=20; min_order_amount=150; usage_limit=300; starts_at="2026-12-01T00:00:00Z"; ends_at="2026-12-31T23:59:59Z"; enabled=$false }
)
foreach ($p in $promos) {
  $pb = (ConvertTo-Json $p -Compress -Depth 5)
  Invoke-AdminApi -Group 'Promotions' -Method 'POST' -Url '/api/admin/promotions' -Body $pb | Out-Null
}

# -------------------- 9. 评价 --------------------
Invoke-AdminApi -Group 'Reviews' -Method 'GET' -Url '/api/admin/reviews/stats' | Out-Null
Invoke-AdminApi -Group 'Reviews' -Method 'GET' -Url '/api/admin/reviews?page=0&size=20' | Out-Null

# -------------------- 10. 订阅者 / 邮件营销 --------------------
Invoke-AdminApi -Group 'Subscribers' -Method 'GET' -Url '/api/admin/subscribers?page=0&size=20' | Out-Null
Invoke-AdminApi -Group 'Subscribers' -Method 'GET' -Url '/api/admin/subscribers/stats' | Out-Null
Invoke-AdminApi -Group 'EmailCampaigns' -Method 'GET' -Url '/api/admin/email/campaigns' | Out-Null
Invoke-AdminApi -Group 'EmailTemplates' -Method 'GET' -Url '/api/admin/email/templates' | Out-Null
# seed: 邮件模板
$templates = @(
  @{ name="Welcome Email"; code="welcome"; subject="Welcome to MyStore!"; body_html="<h1>Hi {{name}}</h1><p>Thanks for joining us.</p>"; variables=@("name") },
  @{ name="Order Confirmation"; code="order_confirm"; subject="Your order #{{order_id}} is confirmed"; body_html="<p>Thanks for your order!</p>"; variables=@("order_id","total") },
  @{ name="Shipping Notification"; code="shipped"; subject="Your order has shipped"; body_html="<p>Track at: {{tracking_url}}</p>"; variables=@("order_id","tracking_url") }
)
foreach ($t in $templates) {
  $tb = (ConvertTo-Json $t -Compress -Depth 5)
  Invoke-AdminApi -Group 'EmailTemplates' -Method 'POST' -Url '/api/admin/email/templates' -Body $tb | Out-Null
}
# seed: 邮件营销活动
$campaigns = @(
  @{ name="July Newsletter"; subject="New arrivals this July"; body_html="<p>Check out our latest products!</p>"; recipient_count=1500 },
  @{ name="Win-back Campaign"; subject="We miss you! 15% off"; body_html="<p>Use code WELCOME15</p>"; recipient_count=300 }
)
foreach ($c in $campaigns) {
  $cb = (ConvertTo-Json $c -Compress -Depth 5)
  Invoke-AdminApi -Group 'EmailCampaigns' -Method 'POST' -Url '/api/admin/email/campaigns' -Body $cb | Out-Null
}

# -------------------- 11. 客户支持 --------------------
Invoke-AdminApi -Group 'Support' -Method 'GET' -Url '/api/admin/support/stats' | Out-Null
Invoke-AdminApi -Group 'Support' -Method 'GET' -Url '/api/admin/support?page=0&size=20' | Out-Null
$supList = Invoke-AdminApi -Group 'Support' -Method 'GET' -Url '/api/admin/support?page=0&size=1'
$sup = Get-Json $supList.Content 'data.content[0]'
if ($sup) {
  Invoke-AdminApi -Group 'Support' -Method 'GET'  -Url "/api/admin/support/$($sup.id)" | Out-Null
  Invoke-AdminApi -Group 'Support' -Method 'PUT'  -Url "/api/admin/support/$($sup.id)/status" -Body '{"status":"IN_PROGRESS"}' | Out-Null
  Invoke-AdminApi -Group 'Support' -Method 'POST' -Url "/api/admin/support/$($sup.id)/reply" -Body '{"message":"auto test reply"}' | Out-Null
}

# -------------------- 12. 通知 --------------------
Invoke-AdminApi -Group 'Notifications' -Method 'GET' -Url '/api/admin/notifications?page=0&size=20' | Out-Null
Invoke-AdminApi -Group 'Notifications' -Method 'GET' -Url '/api/admin/notifications/stats' | Out-Null
Invoke-AdminApi -Group 'Notifications' -Method 'PUT' -Url '/api/admin/notifications/read-all' | Out-Null

# -------------------- 13. 知识库 / FAQ --------------------
Invoke-AdminApi -Group 'KnowledgeBase' -Method 'GET' -Url '/api/admin/kb/documents' | Out-Null
# upload：构造一个真实 multipart/form-data
$tmpFile = New-TemporaryFile
'auto test content' | Out-File -FilePath $tmpFile.FullName -Encoding utf8
$kbForm = @{ file = $tmpFile.FullName }
$kbText = @{ title = 'auto-test'; category = 'FAQ' }
$up = Send-MultipartForm -Url "$BaseUrl/api/admin/kb/documents/upload" -FileFields $kbForm -TextFields $kbText -Headers $script:AuthHeader
Write-TestRow -Group 'KnowledgeBase' 'POST' '/api/admin/kb/documents/upload' $up.Status 'OK' $up.Ms $up.Content
Remove-Item $tmpFile.FullName -Force -ErrorAction SilentlyContinue
# train：先拿一份已有 KB 文档 id，没有就跳过
$kblist = Invoke-AdminApi -Group 'KnowledgeBase' -Method 'GET' -Url '/api/admin/kb/documents'
$kblistJson = $kblist.Content | ConvertFrom-Json
$kb = $kblistJson.data | Select-Object -First 1
if ($kb -and $kb.id) {
  Invoke-AdminApi -Group 'KnowledgeBase' -Method 'POST' -Url "/api/admin/kb/documents/$($kb.id)/train" -Body '{}' | Out-Null
} else {
  Write-TestRow -Group 'KnowledgeBase' 'POST' '/api/admin/kb/documents/--/train' 0 'skipped: no existing document to train' 0 ''
}
Invoke-AdminApi -Group 'Faq' -Method 'GET' -Url '/api/admin/kb/faq' | Out-Null
# seed: FAQ
$faqs = @(
  @{ question="How do I track my order?"; answer="Log in to your account and visit My Orders. Tracking info appears once the order ships."; category="Orders"; locale="en-US"; sortOrder=1; enabled=$true },
  @{ question="What is your return policy?"; answer="We accept returns within 30 days of delivery for unworn items in original packaging."; category="Returns"; locale="en-US"; sortOrder=2; enabled=$true },
  @{ question="Do you ship internationally?"; answer="Yes, we ship to 50+ countries. International shipping rates and delivery times are shown at checkout."; category="Shipping"; locale="en-US"; sortOrder=3; enabled=$true },
  @{ question="How can I contact support?"; answer="Email us at support@mystore.com or use the live chat in the bottom-right corner. We respond within 24 hours."; category="Support"; locale="en-US"; sortOrder=4; enabled=$true },
  @{ question="What payment methods do you accept?"; answer="Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, and Alipay."; category="Payment"; locale="en-US"; sortOrder=5; enabled=$true }
)
foreach ($f in $faqs) {
  $fb = (ConvertTo-Json $f -Compress -Depth 5)
  Invoke-AdminApi -Group 'Faq' -Method 'POST' -Url '/api/admin/kb/faq' -Body $fb | Out-Null
}

# -------------------- 14. 翻译 --------------------
Invoke-AdminApi -Group 'Translations' -Method 'GET' -Url '/api/admin/translations' | Out-Null
Invoke-AdminApi -Group 'Translations' -Method 'GET' -Url '/api/admin/translations/stats' | Out-Null
Invoke-AdminApi -Group 'Translations' -Method 'GET' -Url '/api/admin/translations/export?locale=en-US' | Out-Null
Invoke-AdminApi -Group 'Translations' -Method 'GET' -Url '/api/admin/translations/keys' | Out-Null
$tkBody = "{`"key`":`"auto.test.$ts`",`"description`":`"auto test`"}"
$tkCreate = Invoke-AdminApi -Group 'Translations' -Method 'POST' -Url '/api/admin/translations/keys' -Body $tkBody
$tk = Get-Json $tkCreate.Content 'data'
if ($tk -and $tk.id) {
  Invoke-AdminApi -Group 'Translations' -Method 'PUT'  -Url "/api/admin/translations/keys/$($tk.id)" -Body '{"description":"auto test v2"}' | Out-Null
  Invoke-AdminApi -Group 'Translations' -Method 'GET'  -Url "/api/admin/translations/keys/$($tk.id)/values" | Out-Null
  Invoke-AdminApi -Group 'Translations' -Method 'POST' -Url '/api/admin/translations/values' -Body "{`"key_id`":`"$($tk.id)`",`"locale`":`"en-US`",`"value`":`"auto`"}" | Out-Null
  Invoke-AdminApi -Group 'Translations' -Method 'PUT'  -Url "/api/admin/translations/keys/$($tk.id)/values/en-US" -Body '{"value":"auto 2"}' | Out-Null
}

# -------------------- 15. 货币 / 税率 / 物流 / 支付 --------------------
Invoke-AdminApi -Group 'Currencies' -Method 'GET' -Url '/api/admin/currencies' | Out-Null
# seed: 多个货币
$curs = @(
  @{ code="USD"; name="US Dollar"; symbol="USD"; exchange_rate=1.0; decimals=2; enabled=$true },
  @{ code="EUR"; name="Euro"; symbol="EUR"; exchange_rate=0.92; decimals=2; enabled=$true },
  @{ code="GBP"; name="British Pound"; symbol="GBP"; exchange_rate=0.79; decimals=2; enabled=$true },
  @{ code="JPY"; name="Japanese Yen"; symbol="JPY"; exchange_rate=156.0; decimals=0; enabled=$true },
  @{ code="CNY"; name="Chinese Yuan"; symbol="CNY"; exchange_rate=7.25; decimals=2; enabled=$true }
)
foreach ($cur in $curs) {
  $curb = (ConvertTo-Json $cur -Compress -Depth 5)
  Invoke-AdminApi -Group 'Currencies' -Method 'POST' -Url '/api/admin/currencies' -Body $curb | Out-Null
}
Invoke-AdminApi -Group 'TaxRules' -Method 'GET' -Url '/api/admin/tax/rules' | Out-Null
# seed: 税率
$taxes = @(
  @{ name="US Sales Tax"; country_code="US"; region_code="CA"; tax_rate=0.0875; tax_type="SALES"; is_shipping_taxable=$false; enabled=$true; priority=10 },
  @{ name="EU VAT 20%"; country_code="GB"; region_code=""; tax_rate=0.20; tax_type="VAT"; is_shipping_taxable=$true; enabled=$true; priority=20 },
  @{ name="Japan Consumption Tax"; country_code="JP"; region_code=""; tax_rate=0.10; tax_type="VAT"; is_shipping_taxable=$false; enabled=$true; priority=30 },
  @{ name="Germany VAT 19%"; country_code="DE"; region_code=""; tax_rate=0.19; tax_type="VAT"; is_shipping_taxable=$true; enabled=$true; priority=25 }
)
foreach ($tx in $taxes) {
  $txb = (ConvertTo-Json $tx -Compress -Depth 5)
  Invoke-AdminApi -Group 'TaxRules' -Method 'POST' -Url '/api/admin/tax/rules' -Body $txb | Out-Null
}
Invoke-AdminApi -Group 'TaxRules' -Method 'GET' -Url '/api/admin/tax/rules/calculate?country_code=US&subtotal=100' | Out-Null
Invoke-AdminApi -Group 'ShippingCarriers' -Method 'GET' -Url '/api/admin/shipping/carriers' | Out-Null
# seed: 物流承运商
$carriers = @(
  @{ name="UPS"; code="ups"; logo_url="https://logo.clearbit.com/ups.com"; contact_phone="1-800-742-5877"; website="https://www.ups.com"; tracking_url_template="https://www.ups.com/track?tracknum={tracking_number}"; api_type="REST"; enabled=$true; sort_order=1 },
  @{ name="FedEx"; code="fedex"; logo_url="https://logo.clearbit.com/fedex.com"; contact_phone="1-800-463-3339"; website="https://www.fedex.com"; tracking_url_template="https://www.fedex.com/fedextrack/?trknbr={tracking_number}"; api_type="REST"; enabled=$true; sort_order=2 },
  @{ name="DHL"; code="dhl"; logo_url="https://logo.clearbit.com/dhl.com"; contact_phone="1-800-225-5345"; website="https://www.dhl.com"; tracking_url_template="https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}"; api_type="REST"; enabled=$true; sort_order=3 },
  @{ name="USPS"; code="usps"; logo_url="https://logo.clearbit.com/usps.com"; contact_phone="1-800-275-8777"; website="https://www.usps.com"; tracking_url_template="https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}"; api_type="REST"; enabled=$true; sort_order=4 }
)
foreach ($ca in $carriers) {
  $cab = (ConvertTo-Json $ca -Compress -Depth 5)
  Invoke-AdminApi -Group 'ShippingCarriers' -Method 'POST' -Url '/api/admin/shipping/carriers' -Body $cab | Out-Null
}
Invoke-AdminApi -Group 'ShippingTemplates' -Method 'GET' -Url '/api/admin/shipping/templates' | Out-Null
Invoke-AdminApi -Group 'PaymentGateways' -Method 'GET' -Url '/api/admin/payment/gateways' | Out-Null
# seed: 支付网关
$gateways = @(
  @{ name="stripe"; display_name="Stripe"; enabled=$true; connected=$true; last_four_digits="4242" },
  @{ name="paypal"; display_name="PayPal"; enabled=$true; connected=$true },
  @{ name="alipay"; display_name="Alipay"; enabled=$true; connected=$false },
  @{ name="wechat_pay"; display_name="WeChat Pay"; enabled=$false; connected=$false }
)
foreach ($gw in $gateways) {
  $gwb = (ConvertTo-Json $gw -Compress -Depth 5)
  Invoke-AdminApi -Group 'PaymentGateways' -Method 'POST' -Url '/api/admin/payment/gateways' -Body $gwb | Out-Null
}
Invoke-AdminApi -Group 'PaymentTransactions' -Method 'GET' -Url '/api/admin/payment/transactions' | Out-Null
Invoke-AdminApi -Group 'PaymentTransactions' -Method 'GET' -Url '/api/admin/payment/transactions/reconcile' | Out-Null

# -------------------- 16. RBAC / 审计 --------------------
Invoke-AdminApi -Group 'RBAC' -Method 'GET' -Url '/api/admin/rbac/users' | Out-Null
Invoke-AdminApi -Group 'RBAC' -Method 'GET' -Url '/api/admin/rbac/roles' | Out-Null
# seed: 角色
$roles = @(
  @{ name="admin"; display_name="Administrator"; description="Full access to all resources"; is_system=$true; permissions=@("*") },
  @{ name="manager"; display_name="Store Manager"; description="Manage products, orders, customers"; is_system=$false; permissions=@("products:*","orders:*","customers:read","dashboard:read") },
  @{ name="support"; display_name="Support Agent"; description="Handle customer support tickets"; is_system=$false; permissions=@("support:*","customers:read","orders:read") },
  @{ name="analyst"; display_name="Data Analyst"; description="Read-only access to analytics"; is_system=$false; permissions=@("dashboard:read","analytics:read","export:read") }
)
foreach ($rl in $roles) {
  $rlb = (ConvertTo-Json $rl -Compress -Depth 5)
  Invoke-AdminApi -Group 'RBAC' -Method 'POST' -Url '/api/admin/rbac/roles' -Body $rlb | Out-Null
}
Invoke-AdminApi -Group 'Audit' -Method 'GET' -Url '/api/admin/audit/logs?page=0&size=20' | Out-Null

# -------------------- 17. 数据导出 --------------------
Invoke-AdminApi -Group 'Export' -Method 'GET' -Url '/api/admin/export/products'   | Out-Null
Invoke-AdminApi -Group 'Export' -Method 'GET' -Url '/api/admin/export/orders'     | Out-Null
Invoke-AdminApi -Group 'Export' -Method 'GET' -Url '/api/admin/export/users'      | Out-Null
Invoke-AdminApi -Group 'Export' -Method 'GET' -Url '/api/admin/export/reviews'    | Out-Null
Invoke-AdminApi -Group 'Export' -Method 'GET' -Url '/api/admin/export/transactions' | Out-Null

# -------------------- 18. 站点配置 --------------------
Invoke-AdminApi -Group 'SiteConfig' -Method 'GET' -Url '/api/admin/site-config' | Out-Null
Invoke-AdminApi -Group 'StorefrontSiteConfig' -Method 'GET' -Url '/api/storefront/site-config' | Out-Null

# -------------------- 19. AI Service 公共 --------------------
$aiBase = 'http://localhost:8000'
try {
  $h = Invoke-WebRequest -Uri "$aiBase/health" -Method GET -UseBasicParsing -TimeoutSec 5
  Write-TestRow -Group 'AI Service' 'GET' '/health' ([int]$h.StatusCode) 'OK' 0 $h.Content.Substring(0, [Math]::Min(120, $h.Content.Length))
} catch {
  Write-TestRow -Group 'AI Service' 'GET' '/health' 0 $_.Exception.Message 0 ''
}
$aiHeaders = @{ 'Authorization' = "Bearer $script:Token" }
try {
  $r = Invoke-WebRequest -Uri "$aiBase/api/copilot/sessions?limit=5" -Method GET -Headers $aiHeaders -UseBasicParsing -TimeoutSec 5
  Write-TestRow -Group 'AI Service' 'GET' '/api/copilot/sessions' ([int]$r.StatusCode) 'OK' 0 $r.Content.Substring(0, [Math]::Min(120, $r.Content.Length))
} catch { Write-TestRow -Group 'AI Service' 'GET' '/api/copilot/sessions' ([int]$_.Exception.Response.StatusCode) $_.Exception.Message 0 '' }
try {
  $r = Invoke-WebRequest -Uri "$aiBase/api/copilot/operations?limit=5" -Method GET -Headers $aiHeaders -UseBasicParsing -TimeoutSec 5
  Write-TestRow -Group 'AI Service' 'GET' '/api/copilot/operations' ([int]$r.StatusCode) 'OK' 0 $r.Content.Substring(0, [Math]::Min(120, $r.Content.Length))
} catch { Write-TestRow -Group 'AI Service' 'GET' '/api/copilot/operations' ([int]$_.Exception.Response.StatusCode) $_.Exception.Message 0 '' }

# -------------------- 汇总 --------------------
$total = $script:Rows.Count
$ok    = ($script:Rows | Where-Object { $_.Status -ge 200 -and $_.Status -lt 300 }).Count
$warn  = ($script:Rows | Where-Object { $_.Status -ge 400 -and $_.Status -lt 500 }).Count
$err   = ($script:Rows | Where-Object { $_.Status -ge 500 -or $_.Status -eq 0 }).Count
$others= $total - $ok - $warn - $err

Write-Host ""
Write-Host "=== 测试汇总 ===" -ForegroundColor Cyan
Write-Host "Total: $total, OK: $ok, 4xx: $warn, 5xx/网络: $err, 其他: $others"

# 生成 markdown
$md = New-Object System.Text.StringBuilder
[void]$md.AppendLine("# Admin Full API Test Report")
[void]$md.AppendLine("")
[void]$md.AppendLine("- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$md.AppendLine("- Backend base: $BaseUrl")
[void]$md.AppendLine("- AI service:   $aiBase")
[void]$md.AppendLine("- Login user:   $AdminUser (dev fallback)")
[void]$md.AppendLine("")
[void]$md.AppendLine("## 1. Summary")
[void]$md.AppendLine("")
[void]$md.AppendLine("| Metric | Count |")
[void]$md.AppendLine("|--------|-------|")
[void]$md.AppendLine("| Total requests | $total |")
[void]$md.AppendLine("| 2xx success    | $ok |")
[void]$md.AppendLine("| 4xx client err | $warn |")
[void]$md.AppendLine("| 5xx / network  | $err |")
[void]$md.AppendLine("| Other (3xx)    | $others |")
[void]$md.AppendLine("")

$failed = $script:Rows | Where-Object { $_.Status -lt 200 -or $_.Status -ge 300 }
[void]$md.AppendLine("## 2. Failures (status < 200 or >= 300)")
[void]$md.AppendLine("")
if ($failed.Count -eq 0) {
  [void]$md.AppendLine("No failures.")
} else {
  [void]$md.AppendLine("| Module | Method | Path | Status | Note | Response snippet |")
  [void]$md.AppendLine("|--------|--------|------|--------|------|------------------|")
  foreach ($r in $failed) {
    [void]$md.AppendLine(("| {0} | {1} | {2} | {3} | {4} | `{5}` |" -f $r.Group, $r.Method, $r.Url, $r.Status, $r.Note, $r.Sample))
  }
}
[void]$md.AppendLine("")

[void]$md.AppendLine("## 3. Module data snapshot (data retained for admin UI)")
[void]$md.AppendLine("")
[void]$md.AppendLine("> 全部数据已保留，无任何 DELETE。运行后 admin 各页面可见的记录数：")
[void]$md.AppendLine("")
[void]$md.AppendLine("| Module | Endpoint | Records |")
[void]$md.AppendLine("|--------|----------|---------|")

$snapAuth = $script:AuthHeader
function Add-SnapRow {
  param([string]$Module, [string]$Url)
  try {
    $r = Invoke-RestMethod -Uri "$BaseUrl$Url" -Headers $snapAuth -UseBasicParsing -TimeoutSec 10
    $count = 'n/a'
    if ($r.data -is [array]) {
      $count = $r.data.Count
    } elseif ($r.data.totalElements -ne $null) {
      $count = $r.data.totalElements
    } elseif ($r.data.content) {
      $count = $r.data.totalElements
    }
    [void]$md.AppendLine(("| {0} | `{1}` | {2} |" -f $Module, $Url, $count))
  } catch {
    [void]$md.AppendLine(("| {0} | `{1}` | ERROR: {2} |" -f $Module, $Url, $_.Exception.Message))
  }
}

Add-SnapRow 'Products'           '/api/admin/products?page=0&size=1'
Add-SnapRow 'Categories'         '/api/admin/categories?page=0&size=1'
Add-SnapRow 'Brands'             '/api/admin/brands?page=0&size=1'
Add-SnapRow 'Orders'             '/api/admin/orders?page=0&size=1'
Add-SnapRow 'Coupons'            '/api/admin/coupons?page=0&size=1'
Add-SnapRow 'Promotions'         '/api/admin/promotions'
Add-SnapRow 'Reviews'            '/api/admin/reviews?page=0&size=1'
Add-SnapRow 'Subscribers'        '/api/admin/subscribers?page=0&size=1'
Add-SnapRow 'Support'            '/api/admin/support?page=0&size=1'
Add-SnapRow 'Notifications'      '/api/admin/notifications?page=0&size=1'
Add-SnapRow 'EmailTemplates'     '/api/admin/email/templates'
Add-SnapRow 'EmailCampaigns'     '/api/admin/email/campaigns'
Add-SnapRow 'KBDocuments'        '/api/admin/kb/documents'
Add-SnapRow 'Faq'                '/api/admin/kb/faq'
Add-SnapRow 'Translations'       '/api/admin/translations/keys'
Add-SnapRow 'Currencies'         '/api/admin/currencies'
Add-SnapRow 'TaxRules'           '/api/admin/tax/rules'
Add-SnapRow 'ShippingCarriers'   '/api/admin/shipping/carriers'
Add-SnapRow 'ShippingTemplates'  '/api/admin/shipping/templates'
Add-SnapRow 'PaymentGateways'    '/api/admin/payment/gateways'
Add-SnapRow 'PaymentTransactions' '/api/admin/payment/transactions?page=0&size=1'
Add-SnapRow 'RBAC Users'         '/api/admin/rbac/users'
Add-SnapRow 'RBAC Roles'         '/api/admin/rbac/roles'
[void]$md.AppendLine("")
[void]$md.AppendLine("## 4. Full request log")
[void]$md.AppendLine("")
[void]$md.AppendLine("| Module | Method | Path | Status | Latency(ms) | Note | Response snippet |")
[void]$md.AppendLine("|--------|--------|------|--------|-------------|------|------------------|")
foreach ($r in $script:Rows) {
  [void]$md.AppendLine(("| {0} | {1} | {2} | {3} | {4} | {5} | `{6}` |" -f $r.Group, $r.Method, $r.Url, $r.Status, $r.Ms, $r.Note, $r.Sample))
}

$reportDir = Split-Path $OutputMd -Parent
if (-not (Test-Path $reportDir)) { New-Item -ItemType Directory -Path $reportDir -Force | Out-Null }
$utf8Bom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($OutputMd, $md.ToString(), $utf8Bom)
Write-Host "Report saved to: $OutputMd" -ForegroundColor Green
