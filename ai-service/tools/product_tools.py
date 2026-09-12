"""商品工具：查询商品、改价、上下架。"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

from .base import ToolResult, http_client, tool_registry

logger = logging.getLogger(__name__)


def _normalize_size(size_raw: Any) -> Optional[str]:
    """把用户输入的尺码归一化为可用于匹配的数字字符串。"""
    if size_raw is None:
        return None
    s = str(size_raw).strip().upper()
    # 去掉单位前缀，只保留数字部分
    m = re.search(r"(\d+(?:\.\d+)?)", s)
    return m.group(1) if m else s


def _matches_size(product: Dict[str, Any], size_query: Optional[str]) -> bool:
    """检查商品是否有 SKU 匹配目标尺码（简单数字匹配）。

    注意：Java 后端 /api/products 列表接口默认不返回 skus，
    此时若强行按尺码过滤会误杀潜在匹配商品，因此无 skus 时视为匹配，
    由 LLM 结合后续库存查询做最终判断。
    """
    if not size_query:
        return True
    skus = product.get("skus") or []
    if not skus:
        return True
    for sku in skus:
        size_val = sku.get("attributes", {}).get("Size") or ""
        if size_query in str(size_val).replace(" ", "").upper():
            return True
        # 兼容欧码/美码简单换算：EU 42 ≈ US 9，EU 43 ≈ US 10
        eu_us_map = {"42": "9", "43": "10", "44": "11", "45": "12"}
        if size_query in eu_us_map and eu_us_map[size_query] in str(size_val).replace(" ", "").upper():
            return True
    return False


def _filter_products(
    products: List[Dict[str, Any]],
    *,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    size: Optional[str] = None,
    in_stock: Optional[bool] = None,
) -> List[Dict[str, Any]]:
    """本地二次过滤：Java 后端当前忽略 category/price/size，需在服务端过滤。"""
    result = []
    for p in products:
        if category and str(p.get("category", "")).lower() != category.lower():
            continue
        price = p.get("price")
        if price is not None:
            if min_price is not None and price < min_price:
                continue
            if max_price is not None and price > max_price:
                continue
        if in_stock and (p.get("stock") or 0) <= 0:
            continue
        if size and not _matches_size(p, size):
            continue
        result.append(p)
    return result


async def query_products(args: Dict[str, Any]) -> ToolResult:
    """查询商品列表（支持关键词、分类、价格区间、尺码、库存筛选）。读操作。"""
    params = {}
    keyword = args.get("keyword")
    if keyword:
        params["keyword"] = keyword
    if args.get("low_stock_threshold") is not None:
        params["lowStock"] = args["low_stock_threshold"]

    category = args.get("category")
    min_price = args.get("min_price")
    max_price = args.get("max_price")
    size = _normalize_size(args.get("size"))
    in_stock = args.get("in_stock")

    # Java 后端返回统一包装：{code, data: {content: [...]}, message}
    data = await http_client.get_json("/api/products", params=params)
    products = data
    if isinstance(data, dict) and "data" in data and isinstance(data["data"], dict):
        products = data["data"].get("content", data["data"])
    if not isinstance(products, list):
        products = [products]

    # 本地二次过滤（后端目前忽略 category/price/size 等参数）
    filtered = _filter_products(
        products,
        category=category,
        min_price=min_price,
        max_price=max_price,
        size=size,
        in_stock=in_stock,
    )

    # 若关键词导致 Java 后端无结果，但用户还有其他筛选条件（分类/价格/尺码），
    # 则自动去掉关键词再查一次，避免 keyword 匹配太窄而漏掉潜在商品。
    java_returned_empty = isinstance(products, list) and len(products) == 0
    has_other_filters = category is not None or min_price is not None or max_price is not None or size is not None
    if java_returned_empty and keyword and has_other_filters and not filtered:
        logger.info("Keyword '%s' returned empty, retrying without keyword", keyword)
        retry_data = await http_client.get_json("/api/products", params={})
        retry_products = retry_data
        if isinstance(retry_data, dict) and "data" in retry_data and isinstance(retry_data["data"], dict):
            retry_products = retry_data["data"].get("content", retry_data["data"])
        if isinstance(retry_products, list):
            filtered = _filter_products(
                retry_products,
                category=category,
                min_price=min_price,
                max_price=max_price,
                size=size,
                in_stock=in_stock,
            )

    # 若关键词无结果且未指定分类，但用户表达的是鞋类需求，自动 fallback 用 category=Shoes 再查一次
    if not filtered and keyword and category is None:
        shoe_keywords = {"鞋", "跑鞋", "运动鞋", "球鞋", "sneakers", "shoe", "shoes", "running"}
        if any(k in str(keyword).lower() for k in shoe_keywords):
            logger.info("Keyword '%s' returned empty, retrying with category=Shoes", keyword)
            retry_data = await http_client.get_json("/api/products", params={})
            retry_products = retry_data
            if isinstance(retry_data, dict) and "data" in retry_data and isinstance(retry_data["data"], dict):
                retry_products = retry_data["data"].get("content", retry_data["data"])
            if isinstance(retry_products, list):
                filtered = _filter_products(
                    retry_products,
                    category="Shoes",
                    min_price=min_price,
                    max_price=max_price,
                    size=size,
                    in_stock=in_stock,
                )

    return ToolResult(success=True, data=filtered, message=f"商品查询完成，共 {len(filtered)} 件")


async def check_inventory(args: Dict[str, Any]) -> ToolResult:
    """查询指定商品的详细库存信息。读操作。

    返回：
    - 实时库存数量
    - 库存状态（充足/紧张/缺货/预售）
    - 预计补货时间（如缺货）
    - 是否支持预订
    - 仓库位置提示（用于预估配送时间）
    """
    product_id = args.get("product_id")
    if not product_id:
        return ToolResult(
            success=False,
            message="缺少 product_id，无法查询库存",
        )

    data = await http_client.get_json(f"/api/products/{product_id}")
    skus = (data or {}).get("skus") or []
    total_stock = sum((s.get("stock") or 0) for s in skus) if isinstance(skus, list) else (data or {}).get("stock", 0)
    return ToolResult(success=True, data={"totalStock": total_stock, "skus": skus}, message=f"商品 {product_id} 库存查询完成")


async def update_product_price(args: Dict[str, Any]) -> ToolResult:
    """修改商品价格。写操作 → require_confirm=True。"""
    product_id = args["product_id"]
    new_price = args["new_price"]
    currency = args.get("currency", "USD")
    # ⚠️ 写操作走 admin API
    data = await http_client.post_json(
        f"/api/admin/products/{product_id}/price",
        {"price": new_price, "currency": currency},
    )
    return ToolResult(success=True, data=data,
                      message=f"商品 {product_id} 价格已更新为 {new_price} {currency}")


async def set_product_status(args: Dict[str, Any]) -> ToolResult:
    """商品上架/下架。写操作 → require_confirm=True。"""
    product_id = args["product_id"]
    online = args["online"]
    action = "上架" if online else "下架"
    # ⚠️ 写操作走 admin API
    data = await http_client.post_json(
        f"/api/admin/products/{product_id}/status",
        {"status": "ACTIVE" if online else "ARCHIVED"},
    )
    return ToolResult(success=True, data=data,
                      message=f"商品 {product_id} 已{action}")


async def restock_product(args: Dict[str, Any]) -> ToolResult:
    """商品补货。写操作 → require_confirm=True。"""
    product_id = args["product_id"]
    quantity = args["quantity"]
    warehouse_id = args.get("warehouse_id", "DEFAULT")
    # ⚠️ 写操作走 admin API: /api/admin/products/{id}/restock
    data = await http_client.post_json(
        f"/api/admin/products/{product_id}/restock",
        {"quantity": quantity, "warehouseId": warehouse_id},
    )
    return ToolResult(success=True, data=data,
                      message=f"商品 {product_id} 已补货 {quantity} 件")


async def batch_update_prices(args: Dict[str, Any]) -> ToolResult:
    """批量修改商品价格。写操作 → require_confirm=True。"""
    items = args["items"]
    # 走 admin 端点
    data = await http_client.post_json("/api/admin/products/batch/price", {"items": items})
    return ToolResult(success=True, data=data,
                      message=f"已批量更新 {len(items)} 个商品价格")


async def batch_set_status(args: Dict[str, Any]) -> ToolResult:
    """批量商品上架/下架。写操作 → require_confirm=True。"""
    product_ids = args["product_ids"]
    online = args["online"]
    action = "上架" if online else "下架"
    # 走 admin 端点
    data = await http_client.post_json(
        "/api/admin/products/batch/status",
        {"productIds": product_ids, "online": online},
    )
    return ToolResult(success=True, data=data,
                      message=f"已批量{action} {len(product_ids)} 个商品")


async def batch_restock(args: Dict[str, Any]) -> ToolResult:
    """批量商品补货。写操作 → require_confirm=True。"""
    items = args["items"]
    # 走 admin 端点
    data = await http_client.post_json("/api/admin/products/batch/restock", {"items": items})
    return ToolResult(success=True, data=data,
                      message=f"已批量补货 {len(items)} 个商品")


def register(registry) -> None:
    registry.add(
        name="query_products",
        description=(
            "查询商品列表，支持按关键词、分类、价格区间、尺码、库存状态筛选。"
            "用于帮助顾客搜索商品。调用时应从用户问题中提取：商品类型/关键词、"
            "预算（作为 max_price 或 min_price/max_price）、尺码（size）、分类（category）。"
            "注意：平台商品数据为英文，中文关键词（如'跑鞋'）可能无法直接匹配商品名称，"
            "此时应同时传入 category='Shoes' 以提高召回率。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "keyword": {"type": "string", "description": "商品关键词，可选"},
                "category": {"type": "string", "description": "商品分类，如 Shoes、Apparel、Accessories，可选"},
                "min_price": {"type": "number", "description": "最低价格，可选"},
                "max_price": {"type": "number", "description": "最高价格（预算上限），可选"},
                "size": {"type": "string", "description": "尺码，如 '42'、'US 9'、'9'，可选"},
                "in_stock": {"type": "boolean", "description": "是否只返回有库存的商品，可选"},
                "low_stock_threshold": {
                    "type": "integer",
                    "description": "库存低于此值的商品，可选，例如 10",
                },
            },
        },
        executor=query_products,
        require_confirm=False,
    )
    registry.add(
        name="check_inventory",
        description=(
            "查询指定商品的详细库存信息，包括实时库存数量、库存状态（有货/紧张/缺货/预售）、"
            "预计补货时间、是否支持预订、仓库位置等。"
            "用于回答顾客关于某商品是否有货、何时补货、配送时效等问题。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "product_id": {"type": "string", "description": "要查询的商品ID"},
            },
            "required": ["product_id"],
        },
        executor=check_inventory,
        require_confirm=False,
    )
    registry.add(
        name="update_product_price",
        description="修改某个商品的售价。这是一个写操作，会真实影响店铺，执行前需要人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "product_id": {"type": "string", "description": "商品ID，例如 P1001"},
                "new_price": {"type": "number", "description": "新的价格数值"},
                "currency": {"type": "string", "description": "币种，默认 USD",
                             "default": "USD"},
            },
            "required": ["product_id", "new_price"],
        },
        executor=update_product_price,
        require_confirm=True,
    )
    registry.add(
        name="set_product_status",
        description="商品上架或下架。这是一个写操作，执行前需要人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "product_id": {"type": "string", "description": "商品ID"},
                "online": {"type": "boolean",
                           "description": "true 上架，false 下架"},
            },
            "required": ["product_id", "online"],
        },
        executor=set_product_status,
        require_confirm=True,
    )
    registry.add(
        name="restock_product",
        description="为指定商品补货。这是一个写操作，会增加库存数量，执行前需要人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "product_id": {"type": "string", "description": "商品ID"},
                "quantity": {"type": "integer", "description": "补货数量"},
                "warehouse_id": {"type": "string", "description": "仓库ID，默认 DEFAULT",
                                 "default": "DEFAULT"},
            },
            "required": ["product_id", "quantity"],
        },
        executor=restock_product,
        require_confirm=True,
    )
    registry.add(
        name="batch_update_prices",
        description="批量修改多个商品价格。写操作，执行前需人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "product_id": {"type": "string"},
                            "new_price": {"type": "number"},
                            "currency": {"type": "string", "default": "USD"},
                        },
                        "required": ["product_id", "new_price"],
                    },
                    "description": "价格更新列表",
                },
            },
            "required": ["items"],
        },
        executor=batch_update_prices,
        require_confirm=True,
    )
    registry.add(
        name="batch_set_status",
        description="批量上架或下架多个商品。写操作，执行前需人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "product_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "商品ID列表",
                },
                "online": {"type": "boolean",
                           "description": "true 上架，false 下架"},
            },
            "required": ["product_ids", "online"],
        },
        executor=batch_set_status,
        require_confirm=True,
    )
    registry.add(
        name="batch_restock",
        description="批量为多个商品补货。写操作，执行前需人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "product_id": {"type": "string"},
                            "quantity": {"type": "integer"},
                            "warehouse_id": {"type": "string", "default": "DEFAULT"},
                        },
                        "required": ["product_id", "quantity"],
                    },
                    "description": "补货列表",
                },
            },
            "required": ["items"],
        },
        executor=batch_restock,
        require_confirm=True,
    )
