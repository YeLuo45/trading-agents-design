# Prompt Template System

> TradingAgents-CN 提示词模板系统设计

## 1. Overview

提示词模板系统为 13 个 Agent 提供可配置的提示词模板，支持预设模板、用户自定义、版本控制和热更新。

```
┌─────────────────────────────────────────────────────────────┐
│                  Prompt Template System                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Template Store (持久化存储)                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Preset Templates (31个) × 13 Agents                  │  │
│  │  User Custom Templates                                │  │
│  │  Version History                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Template Engine (模板引擎)                            │  │
│  │  - Variable Interpolation                              │  │
│  │  - Conditional Logic                                   │  │
│  │  - Chain-of-Thought Support                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Layer (REST + WebSocket)                         │  │
│  │  - CRUD Operations                                     │  │
│  │  - Template Preview                                    │  │
│  │  - A/B Testing                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Agent Template Specifications

### 2.1 Template Count by Agent

| Agent | Preset Templates |
|-------|-----------------|
| Fundamental Analyst | 3 |
| Technical Analyst | 3 |
| Market Analyst | 3 |
| Sentiment Analyst | 3 |
| Data Researcher | 2 |
| News Researcher | 2 |
| Bull Debater | 2 |
| Bear Debater | 2 |
| Judge | 2 |
| Strategy Manager | 3 |
| Portfolio Manager | 3 |
| Trader | 3 |
| **Total** | **31** |

---

## 3. Template Schema

### 3.1 Template Structure

```python
@dataclass
class PromptTemplate:
    id: str                           # Unique identifier
    name: str                         # Display name
    description: str                  # Template description
    
    # Agent binding
    agent_type: AgentType
    agent_subtype: Optional[str]     # e.g., "bull_debater"
    
    # Template content
    system_prompt: str                # System prompt template
    user_template: str                # User input template
    
    # Metadata
    version: str                      # Semantic version
    author: str
    tags: List[str]                   # e.g., ["conservative", "aggressive"]
    
    # Configuration
    temperature: float = 0.7
    max_tokens: int = 4096
    
    # Variables
    variables: List[TemplateVariable]
    
    # Status
    is_active: bool = True
    is_preset: bool = False          # True for built-in templates
    created_at: datetime
    updated_at: datetime
```

### 3.2 Variable Definition

```python
@dataclass
class TemplateVariable:
    name: str                         # Variable name
    type: VariableType                # STRING, NUMBER, BOOLEAN, SELECT
    description: str
    
    # For SELECT type
    options: Optional[List[str]] = None
    
    # Validation
    required: bool = True
    default: Optional[Any] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
```

---

## 4. Template Variables Reference

### 4.1 Common Variables (All Agents)

| Variable | Type | Description |
|----------|------|-------------|
| `stock_code` | STRING | 股票代码 |
| `stock_name` | STRING | 股票名称 |
| `market` | SELECT | 市场: CN, HK, US |
| `analysis_horizon` | SELECT | 周期: short, medium, long |
| `language` | SELECT | 语言: zh, en |

### 4.2 Fundamental Analyst Variables

| Variable | Type | Description |
|----------|------|-------------|
| `financial_year` | NUMBER | 财报年度 |
| `compare_peers` | BOOLEAN | 是否同业比较 |
| `focus_areas` | SELECT | 重点: valuation, profitability, growth, all |

### 4.3 Technical Analyst Variables

| Variable | Type | Description |
|----------|------|-------------|
| `chart_type` | SELECT | 图表类型: candle, line |
| `indicators` | SELECT | 指标: MA, RSI, MACD, KDJ, all |
| `timeframe` | SELECT | 时间周期: 1d, 1w, 1m |

### 4.4 Trader Variables

| Variable | Type | Description |
|----------|------|-------------|
| `order_type` | SELECT | 订单类型: market, limit, stop |
| `position_size` | NUMBER | 仓位比例 (0.0-1.0) |
| `stop_loss_pct` | NUMBER | 止损百分比 |
| `take_profit_pct` | NUMBER | 止盈百分比 |

---

## 5. Template Examples

### 5.1 Fundamental Analyst (Default)

```jinja2
# System Prompt
你是一位资深基本面分析师，专注于{{focus_areas}}分析。
股票代码: {{stock_code}}
市场: {{market}}
分析周期: {{analysis_horizon}}

请对{{stock_name}}进行全面分析，重点关注:
{% if focus_areas == 'valuation' %}
- 估值水平 (P/E, P/B, EV/EBITDA)
- 与行业平均比较
- 相对估值吸引力
{% elif focus_areas == 'profitability' %}
- 盈利能力 (ROE, ROA, Gross Margin)
- 盈利质量
- 成本控制
{% elif focus_areas == 'growth' %}
- 营收增长
- 净利润增长
- 成长可持续性
{% else %}
- 完整的基本面评估
{% endif %}

输出格式:
1. 财务评分 (0-100)
2. 关键发现 (3-5点)
3. 投资建议 (强烈买入/买入/持有/卖出/强烈卖出)
4. 风险提示
```

```jinja2
# User Template
请分析 {{stock_name}} ({{stock_code}}) 的基本面情况。
{% if compare_peers %}
请同时与同业公司进行比较。
{% endif %}
```

---

### 5.2 Bull Debater

```jinja2
# System Prompt
你是一位乐观的投资者辩手。你的任务是基于分析师的研究结果，提出看涨论点。

背景信息:
- 股票: {{stock_name}} ({{stock_code}})
- 基本面评分: {{fundamental_score}}/100
- 技术面评分: {{technical_score}}/100
- 市场情绪: {{sentiment_score}}/100

请从以下角度提出看涨论点:
1. 估值吸引力
2. 增长催化剂
3. 竞争优势
4. 市场环境
5. 资金流向

要求:
- 每个论点需有数据支撑
- 承认潜在风险，但强调风险可控
- 给出目标价和潜在涨幅
```

---

### 5.3 Judge

```jinja2
# System Prompt
你是一位客观的裁判，负责权衡多空双方论点，输出最终决策建议。

辩论摘要:
多方论点:
{{bull_arguments}}

空方论点:
{{bear_arguments}}

当前价格: {{current_price}}
市场环境: {{market_condition}}

请进行综合评估:
1. 列出关键决定因素
2. 权衡多空力量对比
3. 给出最终建议和置信度
4. 识别关键风险情景

输出格式:
{
  "key_factors": [...],
  "bull_power": 0-10,
  "bear_power": 0-10,
  "final_verdict": "BUY/SELL/HOLD",
  "confidence": 0.0-1.0,
  "reasoning": "..."
}
```

---

## 6. Version Management

### 6.1 Version Schema

```
{major}.{minor}.{patch}

- major: 重大架构变更
- minor: 新增模板/变量
- patch: 修复/优化
```

### 6.2 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-19 | Initial release, 13 agents |
| 1.0.1 | 2026-05-09 | Extended Agent support, 31 templates |

---

## 7. API Reference

### 7.1 List Templates

```python
# GET /api/v1/templates
# Query params: agent_type, is_active, tags, page, page_size

{
    "total": 31,
    "page": 1,
    "page_size": 10,
    "templates": [
        {
            "id": "tpl_fundamental_default",
            "name": "基本面分析默认模板",
            "agent_type": "FUNDAMENTAL_ANALYST",
            "version": "1.0.1",
            "is_preset": True,
            "tags": ["default", "conservative"]
        }
    ]
}
```

### 7.2 Get Template

```python
# GET /api/v1/templates/{template_id}

{
    "id": "tpl_fundamental_default",
    "name": "基本面分析默认模板",
    "agent_type": "FUNDAMENTAL_ANALYST",
    "version": "1.0.1",
    "system_prompt": "...",
    "user_template": "...",
    "variables": [
        {
            "name": "focus_areas",
            "type": "SELECT",
            "options": ["valuation", "profitability", "growth", "all"],
            "required": True,
            "default": "all"
        }
    ],
    "temperature": 0.7,
    "max_tokens": 4096,
    "is_active": True
}
```

### 7.3 Render Template

```python
# POST /api/v1/templates/{template_id}/render

{
    "variables": {
        "stock_code": "000001.SZ",
        "stock_name": "平安银行",
        "focus_areas": "valuation"
    }
}

# Response
{
    "rendered_system_prompt": "你是一位资深基本面分析师...",
    "rendered_user_template": "请分析 平安银行 (000001.SZ)...",
    "validation": {
        "all_required_filled": True,
        "missing_variables": []
    }
}
```

### 7.4 Create Custom Template

```python
# POST /api/v1/templates

{
    "name": "我的激进模板",
    "description": "适用于高风险偏好",
    "agent_type": "FUNDAMENTAL_ANALYST",
    "based_on": "tpl_fundamental_default",  # Clone from preset
    "system_prompt": "...",
    "user_template": "...",
    "variables": [...],
    "temperature": 0.9,
    "tags": ["aggressive"]
}
```

---

## 8. Web UI

### 8.1 Template Editor

- **位置**: Settings → Prompt Templates
- **功能**: 
  - 可视化模板编辑器
  - 变量插入器
  - 实时预览渲染结果
  - A/B 测试配置

### 8.2 Template Testing

```python
# POST /api/v1/templates/{template_id}/test

{
    "variables": {...},
    "test_stock": "000001.SZ",
    "mock_response": False  # True = don't call LLM, just render
}
```

---

## 9. Implementation Notes

### 9.1 Key Files

| File | Purpose |
|------|---------|
| `tradingagents/core/template_store.py` | Template storage |
| `tradingagents/core/template_engine.py` | Template rendering |
| `tradingagents/api/template_api.py` | REST API |
| `app/pages/template_editor.py` | Web UI |

### 9.2 Storage

- **Default**: JSON file (`config/templates.json`)
- **Production**: Database (MongoDB/PostgreSQL)
- **Sync**: 支持导入导出 JSON

### 9.3 Performance

- Template rendering: < 10ms
- Template list query: < 50ms
- Cache: LRU cache for frequently used templates
