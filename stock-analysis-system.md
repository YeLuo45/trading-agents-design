# Stock Analysis System

> TradingAgents-CN 股票分析系统设计

## 1. Overview

股票分析系统是 TradingAgents-CN 的核心模块，负责对股票进行多维度分析，为交易决策提供依据。

```
┌─────────────────────────────────────────────────────────────┐
│                   Stock Analysis System                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │Fundamental  │    │ Technical   │    │  Market    │      │
│  │  Analysis   │    │  Analysis   │    │  Analysis  │      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            ↓                                 │
│                   ┌─────────────────┐                       │
│                   │ Analysis Fusion │                       │
│                   └────────┬────────┘                       │
│                            ↓                                 │
│                   ┌─────────────────┐                       │
│                   │ Sentiment Check │                       │
│                   └────────┬────────┘                       │
│                            ↓                                 │
│                   ┌─────────────────┐                       │
│                   │  Final Report   │                       │
│                   └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Analysis Pipeline

### 2.1 Pipeline Stages

```python
class AnalysisPipeline:
    STAGES = [
        "DATA_COLLECTION",      # 数据收集
        "FUNDAMENTAL_ANALYSIS", # 基本面分析
        "TECHNICAL_ANALYSIS",   # 技术分析
        "MARKET_ANALYSIS",      # 市场分析
        "SENTIMENT_ANALYSIS",   # 情绪分析
        "FUSION",              # 分析融合
        "REPORT_GENERATION",    # 报告生成
    ]
```

### 2.2 Data Collection

| Data Type | Sources | Priority |
|-----------|---------|----------|
| Price History | Tushare, AKShare | P0 |
| Financial Statements | Tushare | P0 |
| Volume Data | Tushare, AKShare | P1 |
| News & Events | News API | P1 |
| Social Media | Web Scraping | P2 |
| Market Indicators | AKShare | P1 |

---

## 3. Fundamental Analysis

### 3.1 Metrics

| Category | Metrics |
|----------|---------|
| Valuation | P/E, P/B, P/S, EV/EBITDA |
| Profitability | ROE, ROA, Gross Margin, Net Margin |
| Growth | Revenue Growth, EPS Growth, PEG |
| Financial Health | Debt/Equity, Current Ratio, Quick Ratio |
| Cash Flow | FCF, Operating Cash Flow |

### 3.2 Scoring Model

```python
class FundamentalScore:
    def calculate(self, financial_data: Dict) -> float:
        valuation_score = self._score_valuation(financial_data)
        profitability_score = self._score_profitability(financial_data)
        growth_score = self._score_growth(financial_data)
        health_score = self._score_financial_health(financial_data)
        
        # Weighted average
        total = (
            valuation_score * 0.25 +
            profitability_score * 0.30 +
            growth_score * 0.25 +
            health_score * 0.20
        )
        return total
    
    # Score range: 0.0 - 1.0
    # 0.7+ = Strong Buy
    # 0.5-0.7 = Buy
    # 0.3-0.5 = Hold
    # < 0.3 = Sell
```

---

## 4. Technical Analysis

### 4.1 Indicators

| Category | Indicators |
|----------|------------|
| Trend | MA5, MA10, MA20, MA60, EMA |
| Momentum | RSI(14), MACD, KDJ |
| Volatility | Bollinger Bands, ATR |
| Volume | OBV, Volume MA, Volume Ratio |
| Support/Resistance | Pivot Points, Fibonacci |

### 4.2 Pattern Recognition

```python
class PatternRecognizer:
    PATTERNS = [
        "DOJI",           # 十字星
        "HAMMER",         # 锤头
        "ENGULFING",      # 吞没形态
        "HEAD_SHOULDERS", # 头肩顶/底
        "DOUBLE_TOP",     # 双顶
        "DOUBLE_BOTTOM",  # 双底
        "TRIPLE_TOP",     # 三顶
        "TRIPLE_BOTTOM",  # 三底
    ]
    
    def detect(self, price_data: pd.DataFrame) -> List[PatternSignal]:
        signals = []
        for pattern in self.PATTERNS:
            result = self._check_pattern(pattern, price_data)
            if result.confidence > 0.7:
                signals.append(result)
        return signals
```

---

## 5. Market Analysis

### 5.1 Dimensions

| Dimension | Metrics |
|-----------|---------|
| Sector Performance | Sector ETF returns, relative strength |
| Market Breadth | Advancing/Declining, New Highs/Lows |
| Capital Flow | Sector rotation, money flow indicators |
| Global Markets | S&P 500, NASDAQ, HSI, Nikkei correlations |

### 5.2 Sector Rotation Model

```python
class SectorRotationModel:
    def analyze(self, date: datetime) -> Dict[str, float]:
        sectors = ["科技", "消费", "医药", "金融", "能源", "地产"]
        scores = {}
        
        for sector in sectors:
            # Calculate relative strength vs market
            rs = self._relative_strength(sector, date)
            # Calculate momentum
            momentum = self._momentum(sector, date)
            # Calculate flow direction
            flow = self._money_flow(sector, date)
            
            scores[sector] = (rs * 0.4 + momentum * 0.3 + flow * 0.3)
        
        return scores
```

---

## 6. Sentiment Analysis

### 6.1 Data Sources

| Source | Type | Update Frequency |
|--------|------|----------------|
| 东方财富 | News | Real-time |
| 同花顺 | News | Real-time |
| 新浪财经 | Social | Real-time |
| 雪球 | Community | Daily |

### 6.2 Sentiment Score

```python
class SentimentAnalyzer:
    def analyze(self, stock_code: str, news_list: List[News]) -> SentimentResult:
        scores = []
        
        for news in news_list:
            # Text classification
            sentiment = self._classify(news.content)
            # Relevance weighting
            relevance = self._relevance(news, stock_code)
            # Recency decay
            decay = self._recency_decay(news.publish_time)
            
            scores.append(sentiment * relevance * decay)
        
        # Aggregate
        final_score = sum(scores) / len(scores) if scores else 0.5
        
        return SentimentResult(
            score=final_score,        # 0.0-1.0
            confidence=len(news_list), # Higher = more confident
            key_events=self._extract_key_events(news_list)
        )
```

---

## 7. Analysis Fusion

### 7.1 Multi-Signal Integration

```python
class AnalysisFusion:
    def fuse(
        self,
        fundamental: FundamentalResult,
        technical: TechnicalResult,
        market: MarketResult,
        sentiment: SentimentResult
    ) -> FusedResult:
        
        # Weighted combination
        scores = {
            "fundamental": fundamental.score * 0.35,
            "technical": technical.score * 0.25,
            "market": market.score * 0.20,
            "sentiment": sentiment.score * 0.20,
        }
        
        final_score = sum(scores.values())
        
        # Generate trading signal
        signal = self._generate_signal(final_score, technical.patterns)
        
        return FusedResult(
            score=final_score,
            signal=signal,
            confidence=self._calculate_confidence(
                fundamental, technical, market, sentiment
            ),
            key_factors=self._extract_key_factors(
                fundamental, technical, market, sentiment
            )
        )
```

### 7.2 Signal Generation

| Score Range | Signal | Action |
|-------------|--------|--------|
| 0.75 - 1.0 | STRONG_BUY | 强烈买入 |
| 0.60 - 0.75 | BUY | 买入 |
| 0.45 - 0.60 | HOLD | 持有 |
| 0.30 - 0.45 | SELL | 卖出 |
| 0.0 - 0.30 | STRONG_SELL | 强烈卖出 |

---

## 8. Report Generation

### 8.1 Report Structure

```python
class AnalysisReport:
    sections = [
        "executive_summary",     # 执行摘要
        "fundamental_analysis",  # 基本面分析
        "technical_analysis",    # 技术分析
        "market_analysis",      # 市场分析
        "sentiment_analysis",    # 情绪分析
        "risk_factors",         # 风险因素
        "trading_recommendation", # 交易建议
        "appendix"             # 附录
    ]
```

### 8.2 Report Template

```markdown
# {StockName} ({StockCode}) 分析报告

**生成时间**: {timestamp}
**分析师**: TradingAgents-CN

## 执行摘要
{final_score}/100 | {signal} | 置信度: {confidence}%

## 1. 基本面分析
- 估值: {valuation_score}/100
- 盈利: {profitability_score}/100
- 成长: {growth_score}/100
- 财务健康: {health_score}/100

## 2. 技术分析
- 趋势: {trend}
- 支撑位: {support_levels}
- 阻力位: {resistance_levels}
- 形态: {patterns}

## 3. 市场分析
- 板块: {sector}
- 相对强弱: {relative_strength}

## 4. 情绪分析
- 新闻数量: {news_count}
- 平均情绪: {avg_sentiment}
- 关键事件: {key_events}

## 5. 交易建议
- 入场价格: {entry_price}
- 止损价格: {stop_loss}
- 目标价格: {target_price}
- 仓位建议: {position_size}
```

---

## 9. API Interface

### 9.1 Analysis Request

```python
# POST /api/v1/analysis/stock

{
    "stock_code": "000001.SZ",
    "market": "CN",  # CN, HK, US
    "analysis_type": "full",  # full, quick, technical, fundamental
    "time_horizon": "medium",  # short, medium, long
    "options": {
        "include_news": True,
        "include_technical": True,
        "include_market": True
    }
}
```

### 9.2 Analysis Response

```python
{
    "success": True,
    "report_id": "rpt_xxx",
    "stock_code": "000001.SZ",
    "timestamp": "2026-05-09T12:00:00",
    "results": {
        "fundamental": {
            "score": 0.72,
            "valuation": {...},
            "profitability": {...}
        },
        "technical": {
            "score": 0.65,
            "trend": "uptrend",
            "signals": [...]
        },
        "market": {
            "score": 0.58,
            "sector": "金融"
        },
        "sentiment": {
            "score": 0.61,
            "news_count": 15
        },
        "fusion": {
            "final_score": 0.67,
            "signal": "BUY",
            "confidence": 0.78
        }
    },
    "report": "..."  # Full report text
}
```

---

## 10. Caching Strategy

| Data Type | Cache TTL | Max Age |
|-----------|-----------|---------|
| Price Data (Intraday) | 5 min | 1 day |
| Price Data (Daily) | 60 min | 90 days |
| Financial Data | 24 hours | 1 year |
| News Data | 15 min | 7 days |
| Analysis Results | 60 min | 30 days |
