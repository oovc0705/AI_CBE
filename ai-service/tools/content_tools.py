"""内容生成工具：营销文案、多语言翻译、SEO 标题。

这些工具不依赖 Java 后端，直接由本服务的模型生成，是纯 AI 能力。
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from core.model_router import model_router
from .base import ToolResult, tool_registry

logger = logging.getLogger(__name__)


async def generate_marketing_copy(args: Dict[str, Any]) -> ToolResult:
    """为商品生成营销文案，支持多语言。"""
    product = args["product_name"]
    features = args.get("features", "")
    language = args.get("language", "中文")
    style = args.get("style", "专业有吸引力")

    prompt = [
        {
            "role": "system",
            "content": (
                "你是跨境电商资深文案，擅长为不同市场写出有吸引力的商品文案。"
                "输出：1) 标题 2) 卖点 3 段 3) 行动号召。语言遵循用户要求。"
            ),
        },
        {
            "role": "user",
            "content": (
                f"商品：{product}\n卖点/参数：{features}\n"
                f"目标语言：{language}\n风格：{style}\n\n请生成营销文案。"
            ),
        },
    ]
    try:
        resp = await model_router.chat(prompt, temperature=0.8)
        copy = resp.choices[0].message.content
        return ToolResult(success=True, data={"copy": copy},
                          message=f"已为 {product} 生成{language}文案")
    except Exception as e:
        logger.exception("copy generation failed")
        return ToolResult(success=False, message=f"文案生成失败: {e}")


async def translate_text(args: Dict[str, Any]) -> ToolResult:
    """多语言翻译，适配跨境电商场景（保留商品术语）。"""
    text = args["text"]
    target_lang = args["target_language"]

    prompt = [
        {
            "role": "system",
            "content": (
                "你是专业电商翻译。翻译要本地化、自然，"
                "保留品牌名和专业术语，数字与单位按目标市场习惯调整。"
            ),
        },
        {
            "role": "user",
            "content": f"把下面内容翻译成{target_lang}：\n{text}",
        },
    ]
    try:
        resp = await model_router.chat(prompt, temperature=0.3)
        translated = resp.choices[0].message.content
        return ToolResult(success=True, data={"translation": translated},
                          message=f"已翻译为{target_lang}")
    except Exception as e:
        return ToolResult(success=False, message=f"翻译失败: {e}")


def register(registry) -> None:
    registry.add(
        name="generate_marketing_copy",
        description="为商品生成多语言营销文案（标题、卖点、行动号召）。纯AI能力，不改动业务数据。",
        parameters={
            "type": "object",
            "properties": {
                "product_name": {"type": "string", "description": "商品名称"},
                "features": {"type": "string", "description": "商品卖点/参数，可选"},
                "language": {"type": "string", "description": "目标语言，如 中文/English/日本語"},
                "style": {"type": "string", "description": "文案风格，默认专业有吸引力"},
            },
            "required": ["product_name"],
        },
        executor=generate_marketing_copy,
        require_confirm=False,
    )
    registry.add(
        name="translate_text",
        description="把文本翻译成指定语言，电商本地化风格。",
        parameters={
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "待翻译文本"},
                "target_language": {"type": "string", "description": "目标语言"},
            },
            "required": ["text", "target_language"],
        },
        executor=translate_text,
        require_confirm=False,
    )
