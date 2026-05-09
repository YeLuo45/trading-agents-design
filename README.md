# TradingAgents Design

> TradingAgents-CN 完整设计规范文档

## 📋 文档索引

### 🏗️ 系统架构

| 文档 | 描述 | 状态 |
|------|------|------|
| [SPEC.md](SPEC.md) | 项目设计规范主文档 | ✅ |
| [multi-agent-architecture.md](multi-agent-architecture.md) | 多智能体架构设计 | ✅ |
| [stock-analysis-system.md](stock-analysis-system.md) | 股票分析系统设计 | ✅ |

### 🎤 提示词系统

| 文档 | 描述 | 状态 |
|------|------|------|
| [prompt-template-system.md](prompt-template-system.md) | 提示词模板系统设计 | ✅ |

### 📊 数据源与配置

| 文档 | 描述 | 状态 |
|------|------|------|
| [data-source-architecture.md](data-source-architecture.md) | 数据源架构设计 | ✅ |
| [configuration-management.md](configuration-management.md) | 配置管理设计 | ✅ |

### 💹 交易策略

| 文档 | 描述 | 状态 |
|------|------|------|
| [trading-strategy.md](trading-strategy.md) | 交易策略设计 | ✅ |

---

## 🤖 Agent 系统概览

```
┌─────────────────────────────────────────────────────────────┐
│                    TradingAgents-CN                          │
├─────────────────────────────────────────────────────────────┤
│  Analysts (4)   │  Researchers (2)  │  Trader (1)          │
│  ─────────────  │  ──────────────  │  ──────────         │
│  Fundamental    │  Data Research   │  Trade Exec         │
│  Technical      │  News Research    │                     │
│  Market         │                   │                     │
│  Sentiment      │                   │                     │
├─────────────────────────────────────────────────────────────┤
│  Debaters (3)   │  Managers (2)    │  Risk Mgmt           │
│  ─────────────  │  ──────────────  │  ──────────         │
│  Bull Debater   │  Strategy Manager│  Risk Check         │
│  Bear Debater   │  Portfolio Manager│                    │
│  Judge          │                   │                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
trading-agents-design/
├── SPEC.md                              # 主规范文档
├── README.md                            # 本文档
├── multi-agent-architecture.md          # 多智能体架构
├── stock-analysis-system.md             # 股票分析系统
├── prompt-template-system.md            # 提示词模板系统
├── data-source-architecture.md         # 数据源架构
├── trading-strategy.md                  # 交易策略
└── configuration-management.md          # 配置管理
```

---

## 🔗 相关链接

- **TradingAgents-CN**: https://github.com/YeLuo45/TradingAgents-CN
- **原始项目**: https://github.com/TauricResearch/TradingAgents
- **版本**: cn-0.1.15 → cn-0.1.16
