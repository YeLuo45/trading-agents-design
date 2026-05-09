# TradingAgents Design — Project Specification

> 本项目为 TradingAgents-CN 提供完整的设计规范文档，涵盖多智能体架构、数据源、交易策略等核心模块。

---

## 1. Project Overview

- **Project Name**: trading-agents-design
- **Project Type**: Design documentation (AI multi-agent trading system)
- **Core Functionality**: 为 TradingAgents-CN 建立统一的设计规范体系
- **Reference Project**: TradingAgents-CN (https://github.com/YeLuo45/TradingAgents-CN)
- **Based on**: TauricResearch/TradingAgents
- **Version**: cn-0.1.15 → cn-0.1.16

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      TradingAgents-CN                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Analysts   │  │ Researchers │  │   Trader    │         │
│  │  (4 agents) │  │ (2 agents)  │  │ (1 agent)   │         │
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
├─────────────────────────────────────────────────────────────┤
│                    Configuration Layer                       │
│         Unified Config + Config Service + .env              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Agent System (13 Agents)

### 3.1 Analysts (4)

| Agent | Role | Core Function |
|-------|------|---------------|
| Fundamental Analyst | 基本面分析 | 财报、估值、盈利能力 |
| Technical Analyst | 技术分析 | K线、均线、成交量 |
| Market Analyst | 市场分析 | 板块轮动、资金流向 |
| Sentiment Analyst | 情绪分析 | 新闻舆情、社交媒体 |

### 3.2 Researchers (2)

| Agent | Role | Core Function |
|-------|------|---------------|
| Data Researcher | 数据研究 | 数据源获取、验证 |
| News Researcher | 新闻研究 | 实时新闻抓取、摘要 |

### 3.3 Debaters (3)

| Agent | Role | Core Function |
|-------|------|---------------|
| Bull Debater | 多方辩手 | 正面论点、买入理由 |
| Bear Debater | 空方辩手 | 负面论点、卖出理由 |
| Judge | 裁判 | 权衡利弊、输出决策建议 |

### 3.4 Managers (2)

| Agent | Role | Core Function |
|-------|------|---------------|
| Strategy Manager | 策略管理 | 策略调度、执行协调 |
| Portfolio Manager | 组合管理 | 仓位管理、风险分配 |

### 3.5 Trader (1)

| Agent | Role | Core Function |
|-------|------|---------------|
| Trader | 交易员 | 执行交易、风控下单 |

---

## 4. Core Modules

| Module | Description | Status |
|--------|-------------|--------|
| `multi-agent-architecture.md` | Agent 类型定义、通信机制、协作流程 | ✅ |
| `stock-analysis-system.md` | 股票分析流程、数据处理管线 | ✅ |
| `prompt-template-system.md` | 提示词模板规范、版本管理 | ✅ |
| `data-source-architecture.md` | 数据源优先级、缓存策略 | ✅ |
| `trading-strategy.md` | 交易决策流程、风控机制 | ✅ |
| `configuration-management.md` | 配置管理、API Key 管理 | ✅ |

---

## 5. Data Flow

```
User Request
    ↓
Strategy Manager (调度)
    ↓
┌─────────────────────────────────────────┐
│  Parallel Execution                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │Analysts │ │Researcher│ │Debaters │ │
│  └────┬────┘ └────┬────┘ └────┬────┘ │
│       └───────────┼───────────┘       │
│               ↓                        │
│         Judge (裁判)                    │
│               ↓                        │
│         Portfolio Manager               │
│               ↓                        │
│         Trader (执行)                   │
└─────────────────────────────────────────┘
    ↓
Trade Execution + Risk Check
    ↓
Report Generation
```

---

## 6. Acceptance Criteria

- [x] SPEC.md — 项目设计规范主文档 ✅
- [x] README.md — 文档导航索引 ✅
- [x] multi-agent-architecture.md — 多智能体架构设计 ✅
- [x] stock-analysis-system.md — 股票分析系统设计 ✅
- [x] prompt-template-system.md — 提示词模板系统设计 ✅
- [x] data-source-architecture.md — 数据源架构设计 ✅
- [x] trading-strategy.md — 交易策略设计 ✅
- [x] configuration-management.md — 配置管理设计 ✅
- [x] 每个模块包含完整接口规范 ✅
- [x] 多智能体协作流程图（Mermaid）✅
