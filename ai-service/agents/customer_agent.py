"""Storefront 智能客服 Agent：面向 C 端用户。

能力（阶段二）：
- 多语言咨询：自动识别顾客语言并用同语言回复（中/英/日/韩/法/德/西/俄/阿/葡/意/泰/越）。
- 订单状态查询：只读，且强制按 caller_user_id 过滤（顾客只能查自己的订单）。
- 售后/物流/政策答疑：通过 search_faq 检索 customer_kb 知识库（RAG）。
- 复杂问题升级人工客服。

安全：
- 客服 Agent 不持有任何写操作权限。
- 退款/改价等敏感诉求引导顾客走人工客服或自助售后流程。
"""
from __future__ import annotations

from typing import Any, Awaitable, Callable, Dict, Optional

from config import settings
from core.language_detector import LanguageInfo, language_detector
from tools import tool_registry
from .agent_orchestrator import AgentOrchestrator

SYSTEM_PROMPT_TEMPLATE = """你是跨境电商平台的智能客服助手。

【服务对象】全球购物的消费者。
【语言规则】必须用与顾客相同的语言回复。当前检测到的语言：{lang_code} ({lang_name})。
  若检测置信度低，优先用顾客最近一条消息的语言。

【可用工具与使用场景】
- query_orders：查询订单列表（支持按状态、时间筛选）
- query_order_shipping：查询订单的详细物流跟踪（运单号、轨迹、预计送达）
- search_faq：检索官方知识库（退货/退款/物流/关税/支付/保修/尺码等政策）
- query_cart：查询当前购物车内容（商品、价格、数量）
- query_promotions：查询当前平台促销活动（满减、折扣、免运费等）
- query_coupon_status：查询用户个人优惠券（可用券、即将过期提醒）
- query_products：搜索商品（关键词搜索、查看商品信息）
- check_inventory：查询单个商品的详细库存（实时数量、库存状态、补货时间、是否可预订）
- query_user_profile：查询用户账户信息（收货地址、会员等级、积分余额）
- query_shipping_options：查询配送选项（不同方式的费用、时效、承运商）

【回答原则】
- 友好、专业、耐心，回复简洁。
- 政策类问题（退货/退款/物流/关税/支付/保修/尺码）必须先调用 search_faq 检索官方条款，
  严格依据检索结果回答；检索不到就明确告知并建议联系人工客服，绝不编造政策。
- 订单状态问题：
  * 列表概览 → 调用 query_orders
  * 物流详情（包裹在哪、何时到）→ 调用 query_order_shipping
- 商品相关问题：
  * 搜索商品 → 调用 query_products。必须从用户问题中提取并传入：
    - 商品关键词（keyword）
    - 预算上限（max_price）/ 预算区间（min_price/max_price）
    - 鞋码、衣服尺码等（size）
    - 商品分类（category）：若用户明确说鞋/跑鞋/运动鞋，同时传入 category='Shoes'
  * 注意：平台商品数据为英文，中文关键词（如'跑鞋'）常无法直接匹配英文商品名，
    因此务必同时传入 category='Shoes' 以提高召回率。
  * 查某商品是否有货/何时补货 → 调用 check_inventory
  * 库存紧张时主动推荐替代品或建议关注补货通知
- 购物车问题（凑单、折扣适用）→ 调用 query_cart + query_promotions
- 优惠券问题（我有券吗/怎么用/快过期了吗）→ 调用 query_coupon_status
  * 如有即将过期（≤7天）的券，主动提醒用户尽快使用
- 配送问题（怎么寄/多少钱/几天到）→ 调用 query_shipping_options
  * 结合用户地址信息（query_user_profile）给出精准预估
- 用户账户问题（地址、积分）→ 调用 query_user_profile
- 退款、改价、取消订单等敏感操作：你不直接处理，引导顾客在订单页发起售后申请或转人工客服。
- 涉及具体金额/时效/折扣，原样引用检索到的数字，不要四舍五入或编造。
- 如果按用户预算/尺码/条件筛选后没有匹配商品，必须明确告知原因（如"预算内暂无"、"该尺码暂无库存"），
  并主动给出可行建议：提高预算、查看促销活动、关注补货、或转人工客服。
- 跨境场景常见问题（清关、关税、地址格式、配送时长）要主动提醒。
- 利用用户的浏览历史和购物车信息提供个性化建议。

【升级条件】出现以下任一情况，建议顾客联系人工客服：
  顾客明确要求人工、订单超过你的查询范围、纠纷金额较大、情绪激烈。
"""

# 客服 Agent 可用工具：全部只读，订单查询会自动按 user_id 过滤
ALLOWED_TOOLS = [
    "query_orders",
    "query_order_shipping",  # 物流详情查询
    "search_faq",
    "query_cart",
    "query_promotions",
    "query_coupon_status",  # 用户优惠券状态
    "query_products",  # 商品查询（含库存信息）
    "check_inventory",  # 细粒度库存查询
    "query_user_profile",  # 用户画像（地址、账户信息）
    "query_shipping_options",  # 配送选项查询
]


class CustomerAgent(AgentOrchestrator):
    """智能客服。"""

    def __init__(self) -> None:
        super().__init__(
            system_prompt=SYSTEM_PROMPT_TEMPLATE.format(lang_code="auto", lang_name="自动"),
            tools=tool_registry,
            allowed_tool_names=ALLOWED_TOOLS,
            model=settings.models.chat,
        )
        # session_id -> 已检测语言，避免每轮重复检测（同一会话默认同语言）
        self._session_lang: Dict[str, LanguageInfo] = {}

    # ------------------------------------------------------------------
    def _make_pre_hook(self, session_id: str) -> Callable[[Dict[str, Any]], Awaitable[None]]:
        """构造每轮模型调用前的钩子：做语言检测，把结果注入 system prompt。"""

        async def _hook(_ctx: Dict[str, Any]) -> None:
            user_input = _ctx.get("user_input", "")
            # 已检测过且置信度高的会话，沿用；否则重新检测
            cached = self._session_lang.get(session_id)
            lang: Optional[LanguageInfo] = None
            if cached and cached.confidence >= 0.75:
                lang = cached
            if lang is None and user_input.strip():
                lang = await language_detector.detect(user_input)
                if lang:
                    self._session_lang[session_id] = lang
            if lang is None:
                lang = LanguageInfo(code="en", name="English", confidence=0.3)

            # 用模板重新渲染 system_prompt（编排器会在 hook 后同步到 messages 首条）
            self.system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
                lang_code=lang.code, lang_name=lang.name
            )

        return _hook

    # ------------------------------------------------------------------
    async def run(
        self,
        session_id: str,
        user_input: str,
        *,
        enable_tools: bool = True,
        caller_user_id: Optional[str] = None,
    ):
        """客服对话主入口。强制做语言检测，并按 user_id 隔离订单。"""
        hook = self._make_pre_hook(session_id)
        async for event in super().run(
            session_id,
            user_input,
            enable_tools=enable_tools,
            caller_user_id=caller_user_id,
            pre_hook=hook,
        ):
            # 把检测到的语言附在 session 事件里，前端可据此切换 UI 语言
            if event.get("type") == "final":
                lang = self._session_lang.get(session_id)
                if lang:
                    event["language"] = {"code": lang.code, "name": lang.name,
                                         "confidence": round(lang.confidence, 3)}
            yield event


# 模块级单例
customer_agent = CustomerAgent()
