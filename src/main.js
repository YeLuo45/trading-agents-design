// TradingAgents-CN Design Docs Site

const SPEC_MD = `# TradingAgents-CN 设计规范

> 本项目为 TradingAgents-CN 提供完整的设计规范文档，涵盖多智能体架构、数据源、交易策略等核心模块。

## 1. 项目概述

- **项目名称**: trading-agents-design
- **项目类型**: 设计文档（AI 多智能体交易系统）
- **核心功能**: 为 TradingAgents-CN 建立统一的设计规范体系
- **参考项目**: [TradingAgents-CN](https://github.com/YeLuo45/TradingAgents-CN)
- **基于**: TauricResearch/TradingAgents
- **版本**: cn-0.1.15 → cn-0.1.16

## 2. 架构图

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      TradingAgents-CN                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Analysts   │  │ Researchers │  │   Trader    │         │
│  │  (4 agents) │  │ (2 agents) │  │ (1 agent)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Debaters   │  │  Managers   │  │ Risk Mgmt   │         │
│  │  (3 agents) │  │ (2 agents)  │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    Data Source Layer                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Tushare  │ │ AKShare  │ │ Alpha    │ │ Finnhub  │       │
│  │ (A股/港股)│ │ (A股/宏观)│ │ Vantage  │ │ (美股)   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## 3. Agent 系统（13个智能体）

| Agent | 角色 | 核心功能 |
|-------|------|----------|
| Fundamental Analyst | 基本面分析 | 财报、估值、盈利能力 |
| Technical Analyst | 技术分析 | K线、均线、成交量 |
| Market Analyst | 市场分析 | 板块轮动、资金流向 |
| Sentiment Analyst | 情绪分析 | 新闻舆情、社交媒体 |
| Data Researcher | 数据研究 | 数据源获取、验证 |
| News Researcher | 新闻研究 | 实时新闻抓取、摘要 |
| Bull Debater | 多方辩手 | 正面论点、买入理由 |
| Bear Debater | 空方辩手 | 负面论点、卖出理由 |
| Judge | 裁判 | 权衡利弊、输出决策建议 |
| Strategy Manager | 策略管理 | 策略调度、执行协调 |
| Portfolio Manager | 组合管理 | 仓位管理、风险分配 |
| Trader | 交易员 | 执行交易、风控下单 |

## 4. 核心模块

| 模块 | 描述 | 状态 |
|------|------|------|
| multi-agent-architecture.md | Agent 类型定义、通信机制、协作流程 | ✅ |
| stock-analysis-system.md | 股票分析流程、数据处理管线 | ✅ |
| prompt-template-system.md | 提示词模板规范、版本管理 | ✅ |
| data-source-architecture.md | 数据源优先级、缓存策略 | ✅ |
| trading-strategy.md | 交易决策流程、风控机制 | ✅ |
| configuration-management.md | 配置管理、API Key 管理 | ✅ |

## 5. 数据流

\`\`\`
User Request
    ↓
Strategy Manager (调度)
    ↓
┌─────────────────────────────────────────┐
│  Parallel Execution                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │Analysts │ │Researcher│ │Debaters │   │
│  └────┬────┘ └────┬────┘ └────┬────┘   │
│       └───────────┼───────────┘         │
│               ↓                        │
│         Judge (裁判)                    │
│               ↓                        │
│         Portfolio Manager              │
│               ↓                        │
│         Trader (执行)                  │
└─────────────────────────────────────────┘
    ↓
Trade Execution + Risk Check
    ↓
Report Generation
\`\`\``;

const MULTI_AGENT_MD = `# 多智能体架构

## 1. Agent 类型定义

TradingAgents-CN 系统包含 13 个专业 Agent，分为 6 大类型：

### 1.1 Analysts（分析师群 - 4个）

| Agent | 角色 | 核心功能 |
|-------|------|----------|
| Fundamental Analyst | 基本面分析 | 财报、估值、盈利能力分析 |
| Technical Analyst | 技术分析 | K线、均线、成交量形态分析 |
| Market Analyst | 市场分析 | 板块轮动、资金流向追踪 |
| Sentiment Analyst | 情绪分析 | 新闻舆情、社交媒体情绪量化 |

**并行机制**: 4位分析师同时工作，独立输出分析报告

### 1.2 Researchers（研究员群 - 2个）

| Agent | 角色 | 核心功能 |
|-------|------|----------|
| Data Researcher | 数据研究 | 数据源获取、验证、清洗 |
| News Researcher | 新闻研究 | 实时新闻抓取、摘要、情感判定 |

### 1.3 Debaters（辩手群 - 3个）

| Agent | 角色 | 核心功能 |
|-------|------|----------|
| Bull Debater | 多方辩手 | 正面论点构建、买入理由论证 |
| Bear Debater | 空方辩手 | 负面论点构建、卖出理由论证 |
| Judge | 裁判 | 权衡多方/空方论点，输出决策建议 |

**辩论机制**: 多空双方轮流陈述，裁判最终裁决

### 1.4 Managers（管理群 - 2个）

| Agent | 角色 | 核心功能 |
|-------|------|----------|
| Strategy Manager | 策略管理 | 策略调度、任务分配、执行协调 |
| Portfolio Manager | 组合管理 | 仓位分配、风险预算、盈亏追踪 |

### 1.5 Trader（交易员 - 1个）

负责根据决策执行交易指令，包括：
- 下单执行（市价/限价）
- 仓位管理
- 交易记录

### 1.6 Risk Manager（风险管理）

负责风控检查：
- 单一标的头寸限制
- 总仓位限制
- 止损规则

## 2. 通信机制

### 2.1 Agent 间通信

\`\`\`
Strategy Manager
    ↓ (dispatch)
Analysts ←→ Researchers ←→ Debaters
    ↓ (report)
Judge
    ↓ (decision)
Portfolio Manager → Trader → Risk Check
\`\`\`

### 2.2 信息传递格式

\`\`\`json
{
  "type": "ANALYSIS_REPORT",
  "agent": "Technical Analyst",
  "content": {
    "trend": "bullish",
    "indicators": ["MA5>MA20", "VOL>5日均量"],
    "confidence": 0.78
  }
}
\`\`\``;

const STOCK_ANALYSIS_MD = `# 股票分析系统

## 1. 系统概述

股票分析系统负责对标的进行全面分析，输出结构化分析报告供决策使用。

## 2. 分析流程

\`\`\`
输入: 股票代码 + 分析类型
    ↓
Data Researcher → 获取基本面/技术面数据
    ↓
News Researcher → 获取新闻舆情
    ↓
┌────────────────────────────────────┐
│  Parallel Analysis (4 Agents)       │
│  ├─ Fundamental Analyst            │
│  ├─ Technical Analyst              │
│  ├─ Market Analyst                 │
│  └─ Sentiment Analyst              │
└────────────────────────────────────┘
    ↓
综合分析报告
\`\`\`

## 3. 各分析师职责

### 3.1 Fundamental Analyst

**输入数据**:
- 财务报表（营收、利润、资产负债表）
- 估值指标（PE、PB、PS）
- 盈利能力（ROE、ROA、毛利率）

**输出**: 基本面评分（0-100）+ 关键风险点

### 3.2 Technical Analyst

**输入数据**:
- K线数据（1D/1W/1M）
- 均线系统（MA5/MA20/MA60）
- 成交量
- MACD/RSI/KD等指标

**输出**: 技术面评分 + 关键价位

### 3.3 Market Analyst

**输入数据**:
- 板块涨跌排名
- 资金流向（大单净流入）
- 指数联动

**输出**: 市场情绪评分 + 板块轮动判断

### 3.4 Sentiment Analyst

**输入数据**:
- 新闻标题与摘要
- 社交媒体讨论热度
- 研报观点

**输出**: 舆情评分 + 情感倾向

## 4. 数据处理管线

\`\`\`
Raw Data → Data Validation → Data Cleaning → Feature Engineering → Analysis
\`\`\``;

const PROMPT_TEMPLATE_MD = `# 提示词模板系统

## 1. 模板分类

| 类型 | 用途 | 示例 |
|------|------|------|
| System Prompt | Agent角色定义 | "你是一位专业的技术分析师..." |
| User Prompt | 任务输入 | "请分析{stock_code}的技术形态" |
| Few-shot | 范例注入 | 提供3个典型分析案例 |

## 2. 版本管理

- 模板版本号: v1.0.0
- 变更记录: CHANGELOG.md
- A/B测试支持: 多版本并行

## 3. 核心模板示例

### 3.1 Technical Analyst System Prompt

\`\`\`
你是一位资深技术分析师，擅长K线形态识别、均线系统和成交量分析。
分析时需考虑：
1. 趋势方向（上升/下降/震荡）
2. 关键支撑阻力位
3. 成交量配合情况
4. 技术指标信号

输出格式:
{
  "trend": "bullish/bearish/neutral",
  "signals": ["信号1", "信号2"],
  "confidence": 0.0-1.0,
  "key_levels": {"support": [], "resistance": []}
}
\`\`\``;

const DATA_SOURCE_MD = `# 数据源架构

## 1. 数据源列表

| 数据源 | 市场 | 数据类型 | 优先级 |
|--------|------|----------|--------|
| Tushare | A股/港股 | 财务、K线、公告 | P0 |
| AKShare | A股/宏观 | 行情、指数、基金 | P0 |
| Alpha Vantage | 美股 | 实时行情、财务 | P1 |
| Finnhub | 美股 | 新闻、舆情 | P1 |

## 2. 缓存策略

\`\`\`
请求 → Cache Check → Cache Hit? → 直接返回
              ↓ No
         Data Source → 更新Cache → 返回
\`\`\`

**缓存规则**:
- K线数据: 5分钟过期
- 财务数据: 24小时过期
- 新闻数据: 15分钟过期`;

const TRADING_STRATEGY_MD = `# 交易策略

## 1. 策略流程

\`\`\`
市场分析 → 机会识别 → 信号生成 → 风控检查 → 下单执行
\`\`\`

## 2. 决策机制

### 2.1 多空辩论

\`\`\`
Bull Debater → 提出买入理由 (+N分)
Bear Debater → 提出卖出理由 (-N分)
Judge → 综合评估 → 最终决策
\`\`\`

### 2.2 仓位管理

| 信心等级 | 仓位比例 |
|----------|----------|
| 高 (>0.8) | 20-30% |
| 中 (0.5-0.8) | 10-20% |
| 低 (<0.5) | 0-10% |

## 3. 风控规则

- 单标的头寸 ≤ 30%
- 总仓位 ≤ 80%
- 日内止损: -5%
- 单日最大亏损: -10%`;

const CONFIG_MD = `# 配置管理

## 1. 配置层级

\`\`\`
.env (API Keys)
    ↓
config.yaml (业务配置)
    ↓
unified_config.json (统一配置)
\`\`\`

## 2. 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| TUSHARE_TOKEN | Tushare API Token | 是 |
| AKSHARE_KEY | AKShare 密钥 | 是 |
| ALPHA_VANTAGE_KEY | Alpha Vantage API Key | 否 |
| FINNHUB_KEY | Finnhub API Key | 否 |

## 3. 配置服务

\`\`\`python
class ConfigService:
    def get_data_source(self, market: str) -> DataSource:
        # 根据市场返回最优数据源
\`\`\``;

const docs = {
  'SPEC.md': { name: '架构总览', icon: '🏗️', content: SPEC_MD },
  'multi-agent-architecture.md': { name: '多智能体架构', icon: '🤖', content: MULTI_AGENT_MD },
  'stock-analysis-system.md': { name: '股票分析系统', icon: '📊', content: STOCK_ANALYSIS_MD },
  'prompt-template-system.md': { name: '提示词模板系统', icon: '📝', content: PROMPT_TEMPLATE_MD },
  'data-source-architecture.md': { name: '数据源架构', icon: '🗄️', content: DATA_SOURCE_MD },
  'trading-strategy.md': { name: '交易策略', icon: '📈', content: TRADING_STRATEGY_MD },
  'configuration-management.md': { name: '配置管理', icon: '⚙️', content: CONFIG_MD },
};

const agents = [
  { name: 'Fundamental Analyst', role: '基本面分析', group: 'Analysts', icon: '📋' },
  { name: 'Technical Analyst', role: '技术分析', group: 'Analysts', icon: '📈' },
  { name: 'Market Analyst', role: '市场分析', group: 'Analysts', icon: '🌐' },
  { name: 'Sentiment Analyst', role: '情绪分析', group: 'Analysts', icon: '💬' },
  { name: 'Data Researcher', role: '数据研究', group: 'Researchers', icon: '🔍' },
  { name: 'News Researcher', role: '新闻研究', group: 'Researchers', icon: '📰' },
  { name: 'Bull Debater', role: '多方辩手', group: 'Debaters', icon: '🐂' },
  { name: 'Bear Debater', role: '空方辩手', group: 'Debaters', icon: '🐻' },
  { name: 'Judge', role: '裁判', group: 'Debaters', icon: '⚖️' },
  { name: 'Strategy Manager', role: '策略管理', group: 'Managers', icon: '🎯' },
  { name: 'Portfolio Manager', role: '组合管理', group: 'Managers', icon: '💼' },
  { name: 'Trader', role: '交易执行', group: 'Trader', icon: '💹' },
];

const agentGroups = {
  'Analysts': { icon: '👥', desc: '4位分析师并行的海量分析', agents: agents.filter(a => a.group === 'Analysts') },
  'Researchers': { icon: '🔬', desc: '2位研究员提供数据和新闻支撑', agents: agents.filter(a => a.group === 'Researchers') },
  'Debaters': { icon: '⚔️', desc: '3位辩手多方辩论 + 裁判裁决', agents: agents.filter(a => a.group === 'Debaters') },
  'Managers': { icon: '📋', desc: '2位经理协调策略与组合', agents: agents.filter(a => a.group === 'Managers') },
  'Trader': { icon: '💹', desc: '1位交易员执行交易指令', agents: agents.filter(a => a.group === 'Trader') },
};

// Dark mode init
(function initDark() {
  const stored = localStorage.getItem('darkMode');
  if (stored === 'true' || (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
})();

function render() {
  const isDark = document.documentElement.classList.contains('dark');
  const params = new URLSearchParams(window.location.search);
  const docFile = params.get('file');
  const app = document.getElementById('app');

  const navItems = Object.entries(docs).map(([file, d]) =>
    `<a href="?file=${file}" class="nav-link flex items-center gap-2 px-4 py-2 rounded-lg transition ${docFile === file ? 'active' : ''}">${d.icon} ${d.name}</a>`
  ).join('');

  const darkIcon = isDark
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  if (docFile && docs[docFile]) {
    const doc = docs[docFile];
    app.innerHTML = `
      <div class="min-h-screen flex">
        <aside class="aside w-64 border-r flex-shrink-0 overflow-y-auto fixed h-full">
          <div class="p-4 border-b" style="border-color:var(--border-color)">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-lg font-bold">🤖 TradingAgents</h1>
                <p class="text-sm text-muted mt-1">设计规范</p>
              </div>
              <button id="themeToggle" class="p-2 rounded-lg hover:bg-gray-200 transition" style="color:var(--text-secondary)" title="切换暗色模式">
                ${darkIcon}
              </button>
            </div>
          </div>
          <nav class="p-3 space-y-1">
            <a href="?" class="nav-link flex items-center gap-2 px-4 py-2 rounded-lg transition ${!docFile ? 'active' : ''}">🏠 首页</a>
            ${navItems}
          </nav>
        </aside>
        <main class="flex-1 overflow-y-auto ml-64">
          <div class="max-w-4xl mx-auto p-8">
            <button onclick="history.back()" class="mb-4 text-sm" style="color:var(--accent-text)">← 返回</button>
            <article class="prose prose-slate max-w-none" style="color:var(--text-primary)">
              ${marked.parse(doc.content)}
            </article>
          </div>
        </main>
      </div>
    `;
  } else {
    // 首页
    app.innerHTML = `
      <div class="min-h-screen flex">
        <aside class="aside w-64 border-r flex-shrink-0 overflow-y-auto fixed h-full">
          <div class="p-4 border-b" style="border-color:var(--border-color)">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-lg font-bold">🤖 TradingAgents</h1>
                <p class="text-sm text-muted mt-1">设计规范</p>
              </div>
              <button id="themeToggle" class="p-2 rounded-lg hover:bg-gray-200 transition" style="color:var(--text-secondary)" title="切换暗色模式">
                ${darkIcon}
              </button>
            </div>
          </div>
          <nav class="p-3 space-y-1">
            <span class="nav-link flex items-center gap-2 px-4 py-2 rounded-lg active">🏠 首页</span>
            ${navItems}
          </nav>
        </aside>
        <main class="flex-1 overflow-y-auto ml-64">
          <div class="p-8 max-w-5xl mx-auto">
            <h1 class="text-3xl font-bold mb-2 text-primary">🏗️ TradingAgents-CN 设计规范</h1>
            <p class="text-secondary mb-8">多智能体量化交易系统的完整架构设计文档</p>

            <!-- 架构图 -->
            <div class="card rounded-xl p-6 mb-8">
              <h2 class="text-xl font-semibold mb-4 text-primary">⚙️ 系统架构</h2>
              <pre class="arch-pre text-xs p-4 rounded-lg overflow-x-auto">
┌─────────────────────────────────────────────────────────────┐
│                      TradingAgents-CN                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Analysts   │  │ Researchers │  │   Trader    │         │
│  │  (4 agents) │  │ (2 agents) │  │ (1 agent)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Debaters   │  │  Managers   │  │ Risk Mgmt   │         │
│  │  (3 agents) │  │ (2 agents)  │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    Data Source Layer                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Tushare  │ │ AKShare  │ │ Alpha    │ │ Finnhub  │       │
│  │ (A股/港股)│ │ (A股/宏观)│ │ Vantage  │ │ (美股)   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘</pre>
            </div>

            <!-- Agent 列表 -->
            <div class="card rounded-xl p-6 mb-8">
              <h2 class="text-xl font-semibold mb-4 text-primary">🤖 Agent 系统（13个智能体）</h2>
              <div class="space-y-6">
                ${Object.entries(agentGroups).map(([group, info]) => `
                  <div>
                    <h3 class="text-base font-medium mb-2 text-secondary">${info.icon} ${group} — ${info.desc}</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                      ${info.agents.map(a => `
                        <div class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style="background:var(--bg-secondary)">
                          <span>${a.icon}</span>
                          <div>
                            <div class="font-medium text-primary">${a.name}</div>
                            <div class="text-muted text-xs">${a.role}</div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 数据流 -->
            <div class="card rounded-xl p-6 mb-8">
              <h2 class="text-xl font-semibold mb-4 text-primary">📊 数据流</h2>
              <pre class="text-sm p-4 rounded-lg overflow-x-auto" style="background:var(--bg-secondary);color:var(--text-secondary)">
User Request
    ↓
Strategy Manager (调度)
    ↓
┌─────────────────────────────────────────┐
│  Parallel Execution                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │Analysts │ │Researcher│ │Debaters │   │
│  └────┬────┘ └────┬────┘ └────┬────┘   │
│       └───────────┼───────────┘         │
│               ↓                        │
│         Judge (裁判)                    │
│               ↓                        │
│         Portfolio Manager              │
│               ↓                        │
│         Trader (执行)                  │
└─────────────────────────────────────────┘
    ↓
Trade Execution + Risk Check
    ↓
Report Generation</pre>
            </div>

            <!-- 核心模块 -->
            <div class="card rounded-xl p-6">
              <h2 class="text-xl font-semibold mb-4 text-primary">📚 设计文档</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${Object.entries(docs).filter(([f]) => f !== 'SPEC.md').map(([file, d]) => `
                  <a href="?file=${file}" class="flex items-center gap-3 px-4 py-3 rounded-lg transition hover:opacity-80" style="background:var(--bg-secondary)">
                    <span class="text-2xl">${d.icon}</span>
                    <div>
                      <div class="font-medium text-primary">${d.name}</div>
                      <div class="text-muted text-xs">${file}</div>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  // Attach toggle handler
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    render();
  });
}

render();
