"""多语言检测器：识别用户输入语言，用于客服同语言回复。

策略：
1. 启发式规则：基于 Unicode 字符范围快速判定中/日/韩/西里尔/阿拉伯等。
2. 规则无法判定（如纯拉丁字符的多语言歧义）时，回退到模型判定。

跨境场景下常见语言：中文、英语、日语、韩语、法语、德语、西班牙语、
俄语、阿拉伯语、葡萄牙语、意大利语、泰语、越南语。
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Optional

from core.model_router import model_router

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class LanguageInfo:
    """检测结果。code 用 ISO 639-1，name 是中文名便于日志/展示。"""
    code: str          # zh / en / ja / ko / fr / de / es / ru / ar / pt / it / th / vi
    name: str          # 中文 / 英语 / ...
    confidence: float  # 0~1

    def __str__(self) -> str:
        return f"{self.code}({self.name})"


# Unicode 范围 → 语言。顺序重要：日语含汉字，要先判假名再退回中文。
_RANGES = [
    # (起, 止, code, name)
    (0x3040, 0x30FF, "ja", "日本語"),   # 平假名 + 片假名
    (0xAC00, 0xD7AF, "ko", "한국어"),   # 韩文音节
    (0x4E00, 0x9FFF, "zh", "中文"),     # CJK 统一表意
    (0x0400, 0x04FF, "ru", "Русский"),  # 西里尔
    (0x0600, 0x06FF, "ar", "العربية"),  # 阿拉伯
    (0x0E00, 0x0E7F, "th", "ไทย"),      # 泰文
]

# 西欧语言都用拉丁字母，需结合特征词判定。下面是常见停用词/特征。
_LATIN_HINTS = [
    # (code, name, 关键词集合)
    ("de", "Deutsch", {"der", "die", "das", "und", "nicht", "mit", "ist", "ich",
                        "schön", "möchte", "bestellen", "lieferung", "rückerstattung"}),
    ("fr", "Français", {"le", "la", "les", "et", "avec", "bonjour", "merci",
                         "commande", "livraison", "remboursement", "je", "vous",
                         "pas", "une"}),
    ("es", "Español", {"el", "la", "los", "las", "y", "no", "con", "hola",
                        "gracias", "pedido", "envío", "reembolso", "por", "una",
                        "mi"}),
    ("pt", "Português", {"o", "a", "os", "as", "e", "não", "com", "olá",
                          "obrigado", "pedido", "envio", "reembolso", "você",
                          "pra"}),
    ("it", "Italiano", {"il", "la", "le", "e", "non", "con", "ciao", "grazie",
                         "ordine", "spedizione", "rimborso", "per", "una"}),
    ("vi", "Tiếng Việt", {"và", "của", "là", "không", "được", "xin", "cảm ơn",
                           "đơn", "hàng", "vận", "chuyển", "hoàn", "tiền"}),
]


def _detect_by_unicode(text: str) -> Optional[LanguageInfo]:
    """按 Unicode 字符范围判定（CJK / 韩文 / 西里尔 / 阿拉伯 / 泰文）。"""
    counts: dict[str, int] = {}
    for ch in text:
        cp = ord(ch)
        for lo, hi, code, name in _RANGES:
            if lo <= cp <= hi:
                counts[code] = counts.get(code, 0) + 1
                break
    if not counts:
        return None
    # 日语优先级高于中文（含汉字也要看是否有假名）
    code = max(counts, key=lambda c: counts[c] + (5 if c == "ja" else 0))
    name = next(n for _, _, c, n in _RANGES if c == code)
    total = sum(counts.values())
    conf = min(counts[code] / max(total, 1), 0.99)
    return LanguageInfo(code=code, name=name, confidence=conf)


def _detect_by_latin_hints(text: str) -> Optional[LanguageInfo]:
    """拉丁字母语言用特征词判定。"""
    tokens = set(re.findall(r"[a-zA-Zà-ÿÀ-Ÿ]+", text.lower()))
    if not tokens:
        return None
    best: Optional[tuple[str, str, int]] = None
    for code, name, kw in _LATIN_HINTS:
        hits = len(tokens & kw)
        if hits > 0 and (best is None or hits > best[2]):
            best = (code, name, hits)
    if best is None:
        # 纯英文兜底：英语是跨境电商默认 lingua franca
        return LanguageInfo(code="en", name="English", confidence=0.5)
    code, name, hits = best
    conf = min(hits / max(len(tokens), 1) + 0.3, 0.95)
    return LanguageInfo(code=code, name=name, confidence=conf)


async def _detect_by_model(text: str) -> Optional[LanguageInfo]:
    """回退：让 LLM 判定语言。仅在前面规则都失败或可疑时用。"""
    prompt = [
        {
            "role": "system",
            "content": (
                "识别用户输入的语言，只输出 ISO 639-1 语言代码，"
                "例如 zh/en/ja/ko/fr/de/es/ru/ar/pt/it/th/vi。不要输出其它内容。"
            ),
        },
        {"role": "user", "content": text[:200]},
    ]
    try:
        resp = await model_router.chat(prompt, temperature=0.0, max_tokens=8)
        raw = (resp.choices[0].message.content or "").strip().lower()
        # 容错：只取前几个字母
        code = re.match(r"[a-z]{2}", raw)
        if not code:
            return None
        return LanguageInfo(code=code.group(0), name=raw, confidence=0.6)
    except Exception:
        logger.exception("model language detection failed")
        return None


class LanguageDetector:
    """组合策略：Unicode → 拉丁特征词 → 模型兜底。"""

    async def detect(self, text: str) -> LanguageInfo:
        if not text or not text.strip():
            return LanguageInfo(code="en", name="English", confidence=0.3)

        # 1. Unicode 范围（CJK/韩/俄/阿/泰）
        info = _detect_by_unicode(text)
        if info and info.confidence > 0.5:
            return info

        # 2. 拉丁字母特征词（含英文兜底）
        info = _detect_by_latin_hints(text)
        if info and info.confidence > 0.6:
            return info

        # 3. 模型兜底
        model_info = await _detect_by_model(text)
        if model_info:
            return model_info

        # 4. 最终兜底英语
        return info or LanguageInfo(code="en", name="English", confidence=0.3)


# 模块级单例
language_detector = LanguageDetector()
