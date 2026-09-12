"""文档入库脚本：把业务知识灌入向量库，供 RAG 检索。

用法：
    python -m rag.ingest --source data/copilot_kb.jsonl

输入文件为 JSONL，每行一个文档：
    {"content": "...", "metadata": {"type": "sop", "category": "运营"}}

也提供命令行直接灌入示例文档（--demo）。
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List

from config import settings
from core.rag_engine import rag_engine

logger = logging.getLogger(__name__)

# 演示用知识片段
DEMO_DOCS: List[Dict[str, Any]] = [
    {
        "content": "大促备货 SOP：活动前 14 天开始备货，热销品按历史销量 1.5 倍准备；"
                    "库存低于安全线（默认 50）需立即补货，否则在大促期间自动下架避免超卖。",
        "metadata": {"type": "sop", "category": "运营", "title": "大促备货SOP"},
    },
    {
        "content": "退款政策：商品质量问题 7 天内全额退款并承担退货运费；"
                    "非质量问题 7 天内可退，运费买家承担；定制类商品不支持无理由退货。",
        "metadata": {"type": "policy", "category": "售后", "title": "退款政策"},
    },
    {
        "content": "多市场定价建议：北美市场可定价高于成本 40%-60%；"
                    "东南亚市场建议 25%-40%；欧洲市场需注意 VAT，定价含税。",
        "metadata": {"type": "sop", "category": "定价", "title": "多市场定价"},
    },
]

# 客服知识库演示 FAQ（多语言，覆盖售后/物流/支付/关税等跨境高频问题）
CUSTOMER_DEMO_DOCS: List[Dict[str, Any]] = [
    {
        "content": (
            "【退货政策 - 中文】\n"
            "自签收之日起 7 天内可申请无理由退货；商品质量问题，"
            "30 天内可退货且由平台承担往返运费。"
            "定制类、内衣、食品类商品不支持无理由退货。"
            "退货流程：我的订单 → 申请退货 → 等待审核 → 邮寄回仓 → 退款到账（3-5 工作日）。"
        ),
        "metadata": {"type": "faq", "category": "售后", "lang": "zh",
                     "title": "退货政策"},
    },
    {
        "content": (
            "【退货政策 - English】\n"
            "You may return most items within 7 days of delivery for a no-reason refund. "
            "For quality issues, returns are accepted within 30 days with prepaid return shipping. "
            "Customized products, underwear, and food items are non-returnable. "
            "Process: My Orders → Request Return → Await Approval → Ship Back → Refund (3-5 business days)."
        ),
        "metadata": {"type": "faq", "category": "售后", "lang": "en",
                     "title": "Return Policy"},
    },
    {
        "content": (
            "【退货政策 - 日本語】\n"
            "商品受取後7日以内、理由なしで返品可能。品質問題の場合は30日以内、"
            "往復送料は当社負担。カスタム商品、下着、食品は返品不可。"
            "フロー：マイ注文 → 返品申請 → 審査待ち → 返送 → 返金（3-5営業日）。"
        ),
        "metadata": {"type": "faq", "category": "售后", "lang": "ja",
                     "title": "返品ポリシー"},
    },
    {
        "content": (
            "【物流时效】\n"
            "标准配送：下单后 1-3 个工作日发货，国际段 7-15 个工作日送达。"
            "加急配送：下单后当天发货，国际段 3-7 个工作日送达，加收 $9.99。"
            "偏远地区（如部分南美/非洲国家）可能延长 5-10 天。"
            "物流追踪：订单详情页可查看实时物流信息，发货后会有邮件通知。"
        ),
        "metadata": {"type": "faq", "category": "物流", "lang": "multi",
                     "title": "物流时效"},
    },
    {
        "content": (
            "【关税说明】\n"
            "商品价格不含目的地关税。大部分国家/地区对小额包裹（如美国 $800 以下、"
            "欧盟 €150 以下）免征关税。如产生关税，由收件人支付。"
            "清关所需材料：收件人需配合提供身份证/护照复印件（部分国家要求）。"
            "清关时效通常 1-3 个工作日。"
        ),
        "metadata": {"type": "faq", "category": "关税", "lang": "multi",
                     "title": "关税说明"},
    },
    {
        "content": (
            "【支付方式】\n"
            "支持信用卡（Visa/Mastercard/American Express）、PayPal、"
            "Apple Pay、Google Pay。部分国家/地区支持本地支付（如巴西 Boleto、"
            "日本便利店支付、韩国 KakaoPay）。"
            "所有支付均通过 SSL 加密，平台不存储您的卡号。"
        ),
        "metadata": {"type": "faq", "category": "支付", "lang": "multi",
                     "title": "支付方式"},
    },
    {
        "content": (
            "【尺码指南】\n"
            "所有服装/鞋类商品详情页均标注尺寸表，基于亚洲尺码。"
            "建议参考「适合身高/体重」列选择。欧美顾客通常需选大一码。"
            "如有尺码疑问可在商品页发起在线咨询，客服会在 2 小时内回复。"
            "因尺码原因的退换货，运费由买家承担。"
        ),
        "metadata": {"type": "faq", "category": "商品", "lang": "multi",
                     "title": "尺码指南"},
    },
    {
        "content": (
            "【退款方式】\n"
            "退款将原路返回到您的支付账户。信用卡退款需 3-5 个工作日到账；"
            "PayPal 退款通常即时到账。如 10 个工作日仍未收到退款，"
            "请联系在线客服提供订单号处理。"
        ),
        "metadata": {"type": "faq", "category": "售后", "lang": "multi",
                     "title": "退款方式"},
    },
    {
        "content": (
            "【保修政策】\n"
            "电子产品（耳机、手表等）自签收之日起 12 个月内享受免费保修，"
            "仅限非人为损坏。保修流程：联系客服 → 提供订单号 + 故障照片/视频 → "
            "审核通过后寄回 → 维修或换新（15 个工作日内完成）。"
        ),
        "metadata": {"type": "faq", "category": "售后", "lang": "multi",
                     "title": "保修政策"},
    },
    {
        "content": (
            "【退货政策 - 한국어】\n"
            "수령 후 7일 이내 무료 반품 가능. 품질 문제 시 30일 이내 반품 가능하며 "
            "왕복 배송비는 당사 부담. 맞춤 제품, 속옷, 식품은 반품 불가. "
            "절차: 내 주문 → 반품 신청 → 승인 대기 → 반송 → 환불 (3-5 영업일)."
        ),
        "metadata": {"type": "faq", "category": "售后", "lang": "ko",
                     "title": "반품 정책"},
    },
]


def _load_jsonl(path: str) -> List[Dict[str, Any]]:
    docs: List[Dict[str, Any]] = []
    p = Path(path)
    if not p.exists():
        logger.error("Source file not found: %s", path)
        return docs
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                docs.append(json.loads(line))
            except json.JSONDecodeError:
                logger.warning("Skip invalid line")
    return docs


async def ingest(docs: List[Dict[str, Any]], collection: str) -> int:
    if not docs:
        logger.warning("No docs to ingest")
        return 0
    contents = [d["content"] for d in docs]
    metadatas = [d.get("metadata", {}) for d in docs]
    ids = [f"{collection}_{i}" for i in range(len(docs))]
    return await rag_engine.add_documents(
        collection, contents, metadatas=metadatas, ids=ids
    )


async def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest documents into Chroma")
    parser.add_argument("--source", help="JSONL 文件路径")
    parser.add_argument("--collection", help="目标 collection（不传则自动按 demo 类型选）")
    parser.add_argument("--demo", action="store_true", help="灌入内置运营演示文档（copilot_kb）")
    parser.add_argument("--customer-demo", action="store_true",
                        help="灌入内置客服 FAQ 演示文档（customer_kb）")
    args = parser.parse_args()

    docs: List[Dict[str, Any]] = []
    collection = args.collection

    if args.customer_demo:
        docs = CUSTOMER_DEMO_DOCS
        collection = collection or settings.chroma_collection_customer
    elif args.demo:
        docs = DEMO_DOCS
        collection = collection or settings.chroma_collection_copilot
    elif args.source:
        docs = _load_jsonl(args.source)
        collection = collection or settings.chroma_collection_copilot

    if not docs:
        parser.print_help()
        return

    count = await ingest(docs, collection)
    print(f"Ingested {count} docs into '{collection}'")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
