# Data Source Architecture

> TradingAgents-CN 数据源架构设计

## 1. Overview

TradingAgents-CN 支持 A股、港股、美股等多市场数据，底层对接多个数据源。

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Source Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Data Source Manager (统一入口)               │ │
│  │  - Source Selection (按市场/数据类型选择)                  │ │
│  │  - Fallback Strategy (备用数据源)                        │ │
│  │  - Rate Limiting (限流控制)                              │ │
│  └─────────────────────────┬──────────────────────────────┘ │
│                            ↓                                  │
│  ┌─────────────────────────┴──────────────────────────────┐ │
│  │                   Market Router                         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │  A股/港股  │  │   美股    │  │   宏观    │           │ │
│  │  │ Router    │  │  Router   │  │  Router   │           │ │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘           │ │
│  └────────┼──────────────┼──────────────┼─────────────────┘ │
│           ↓              ↓              ↓                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Data Sources                          │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │ │
│  │  │ Tushare  │  │ AKShare │  │ Alpha   │  │ Finnhub │ │ │
│  │  │          │  │         │  │ Vantage │  │         │ │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Supported Data Sources

### 2.1 A股/港股

| Source | Type | API Key Source | Priority |
|--------|------|----------------|----------|
| Tushare | 股票数据 | 环境变量 / 数据库 | P0 |
| AKShare | 股票/宏观 | 免费 API | P1 |
| 东方财富 | 新闻/数据 | 免费 API | P2 |

### 2.2 美股

| Source | Type | API Key Source | Priority |
|--------|------|----------------|----------|
| Alpha Vantage | 股票数据 | 环境变量 / 数据库 | P0 |
| Finnhub | 实时报价 | 环境变量 / 数据库 | P1 |
| Yahoo Finance | 历史数据 | 免费 API | P2 |

### 2.3 宏观数据

| Source | Type | API Key Source | Priority |
|--------|------|----------------|----------|
| AKShare | 宏观统计 | 免费 API | P0 |
| 东方财富 | 宏观数据 | 免费 API | P1 |

---

## 3. Data Source Manager

### 3.1 Architecture

```python
class DataSourceManager:
    """统一数据源管理器"""
    
    def __init__(self, config_provider: DataSourceConfigProvider):
        self.config_provider = config_provider
        self.source_cache = {}  # (source_name, market) -> DataSource
        self.fallback_map = {
            "Tushare": ["AKShare"],
            "AlphaVantage": ["Finnhub", "YahooFinance"],
            "Finnhub": ["AlphaVantage", "YahooFinance"],
        }
    
    async def get_stock_data(
        self,
        stock_code: str,
        data_type: DataType,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> StockData:
        market = self._detect_market(stock_code)
        sources = self._get_priority_sources(market, data_type)
        
        for source in sources:
            try:
                # 获取配置 (数据库 > 环境变量)
                config = await self.config_provider.get_source_config(source)
                
                # 执行请求
                data = await self._fetch(source, stock_code, data_type, config)
                
                # 验证数据
                if self._validate(data):
                    return data
                    
            except RateLimitError:
                continue
            except Exception as e:
                logger.warning(f"Source {source} failed: {e}")
                continue
        
        raise AllSourcesFailedError(f"All sources failed for {stock_code}")
```

### 3.2 API Key 获取优先级

```
1. 数据库配置 (Web 界面设置)
2. 环境变量 (.env 文件)
3. 默认/空 (部分 API 支持免费调用)
```

```python
class DataSourceConfigProvider:
    """配置提供器 - 统一配置管理"""
    
    async def get_source_config(self, source_name: str) -> Optional[Dict]:
        # Step 1: 从数据库读取
        db_config = await self._get_from_database(source_name)
        if db_config and db_config.get('api_key'):
            return db_config
        
        # Step 2: 从环境变量读取
        env_key = self._source_env_map.get(source_name)
        if env_key and os.getenv(env_key):
            return {'api_key': os.getenv(env_key)}
        
        return None
    
    # 环境变量映射
    _source_env_map = {
        'Tushare': 'TUSHARE_TOKEN',
        'AlphaVantage': 'ALPHA_VANTAGE_KEY',
        'Finnhub': 'FINNHUB_API_KEY',
    }
```

---

## 4. Market Router

### 4.1 市场检测

```python
def detect_market(stock_code: str) -> Market:
    """根据股票代码检测市场"""
    if re.match(r'^\d{6}\.(SH|SZ)$', stock_code):
        return Market.CN_A   # A股
    elif re.match(r'^\d{5}\.HK$', stock_code):
        return Market.HK     # 港股
    elif re.match(r'^[A-Z]{1,5}$', stock_code):
        return Market.US     # 美股
    elif re.match(r'^\d{6}$', stock_code):
        return Market.CN_A   # 简化 A股
    else:
        raise UnknownMarketError(stock_code)
```

### 4.2 数据类型路由

```python
DATA_TYPE_SOURCE_MAP = {
    # A股/港股
    Market.CN_A: {
        DataType.PRICE_DAILY: ["Tushare", "AKShare"],
        DataType.PRICE_MINUTE: ["Tushare"],
        DataType.FINANCIAL: ["Tushare"],
        DataType.NEWS: ["东方财富", "同花顺"],
        DataType.MARKET_INDEX: ["AKShare"],
    },
    Market.HK: {
        DataType.PRICE_DAILY: ["Tushare", "AKShare"],
        DataType.PRICE_MINUTE: ["Tushare"],
        DataType.NEWS: ["东方财富"],
    },
    # 美股
    Market.US: {
        DataType.PRICE_DAILY: ["AlphaVantage", "Finnhub", "YahooFinance"],
        DataType.REAL_TIME_QUOTE: ["Finnhub", "AlphaVantage"],
        DataType.NEWS: ["Finnhub"],
    },
}
```

---

## 5. Caching Strategy

### 5.1 Cache Configuration

| Data Type | TTL | Max Age |
|-----------|-----|---------|
| 日线数据 (Daily) | 60 min | 90 days |
| 分钟数据 (Minute) | 5 min | 1 day |
| 财务数据 | 24 hours | 1 year |
| 实时报价 | 15 sec | - |
| 新闻数据 | 15 min | 7 days |
| 指数数据 | 60 min | 90 days |

### 5.2 Cache Implementation

```python
class DataCache:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.default_ttl = {
            DataType.PRICE_DAILY: 3600,      # 60 min
            DataType.PRICE_MINUTE: 300,       # 5 min
            DataType.FINANCIAL: 86400,        # 24 hours
            DataType.REAL_TIME_QUOTE: 15,     # 15 sec
            DataType.NEWS: 900,              # 15 min
        }
    
    def _make_key(self, source: str, stock_code: str, 
                  data_type: DataType, **kwargs) -> str:
        return f"ds:{source}:{stock_code}:{data_type.value}:{kwargs}"
    
    async def get_or_fetch(
        self,
        source: str,
        stock_code: str,
        data_type: DataType,
        fetch_fn: Callable,
        **fetch_kwargs
    ) -> Any:
        key = self._make_key(source, stock_code, data_type, **fetch_kwargs)
        
        # Try cache first
        cached = await self.redis.get(key)
        if cached:
            return json.loads(cached)
        
        # Fetch fresh data
        data = await fetch_fn(**fetch_kwargs)
        
        # Store in cache
        ttl = self.default_ttl.get(data_type, 3600)
        await self.redis.setex(key, ttl, json.dumps(data))
        
        return data
```

---

## 6. Rate Limiting

### 6.1 Rate Limits by Source

| Source | Free Tier | Rate Limit |
|--------|-----------|------------|
| Tushare | 2000 points/day | 1 req/sec |
| Alpha Vantage | 25 req/day (free) | 5 req/min |
| Finnhub | 60 req/min | 1 req/sec |
| AKShare | Unlimited | 10 req/sec |
| Yahoo Finance | Unlimited | 2 req/sec |

### 6.2 Rate Limit Handler

```python
class RateLimitHandler:
    def __init__(self):
        self.limits = {
            'Tushare': TokenBucket(200, 1),      # 200 tokens, 1/sec refill
            'AlphaVantage': TokenBucket(25, 5),   # 25 tokens, 5/min refill
            'Finnhub': TokenBucket(60, 1),       # 60 tokens, 1/sec refill
        }
    
    async def acquire(self, source: str, tokens: int = 1) -> bool:
        bucket = self.limits.get(source)
        if not bucket:
            return True  # No limit for free APIs
        
        return bucket.try_consume(tokens)
    
    async def wait_and_acquire(self, source: str, tokens: int = 1):
        while not await self.acquire(source, tokens):
            await asyncio.sleep(0.1)
```

---

## 7. Error Handling

### 7.1 Error Types

| Error | Cause | Handling |
|-------|-------|----------|
| `NetworkError` | 网络问题 | Retry 3x with exponential backoff |
| `RateLimitError` | 触发限流 | Switch to fallback source |
| `AuthError` | API Key 无效 | Log + alert + skip source |
| `DataNotFoundError` | 数据不存在 | Return empty + warning |
| `AllSourcesFailedError` | 所有源失败 | Raise to caller |

### 7.2 Fallback Flow

```
Request for STOCK_DATA
    ↓
Try Tushare (P0)
    ↓ (fail)
Catch RateLimitError → Switch to AKShare
Catch AuthError → Log alert + skip
    ↓ (fail)
Try AKShare (P1)
    ↓ (fail)
Return error / cached data / raise
```

---

## 8. Data Validation

### 8.1 Validation Rules

```python
class StockDataValidator:
    def validate(self, data: StockData) -> bool:
        # Check required fields
        assert data.stock_code, "Missing stock_code"
        assert data.timestamp, "Missing timestamp"
        assert data.price > 0, "Invalid price"
        
        # Check data integrity
        assert data.high >= data.low, "high < low"
        assert data.high >= data.close, "high < close"
        assert data.low <= data.close, "low > close"
        
        # Check date range
        assert data.timestamp <= datetime.now(), "Future date"
        
        return True
```

---

## 9. API Reference

### 9.1 Get Price Data

```python
# GET /api/v1/data/price

{
    "stock_code": "000001.SZ",
    "market": "CN",
    "data_type": "daily",      # daily, minute, realtime
    "start_date": "2026-01-01",
    "end_date": "2026-05-09",
    "adjust": "qfq"            # qfq, hfq, none
}

# Response
{
    "success": True,
    "source_used": "Tushare",
    "data": [
        {
            "date": "2026-05-09",
            "open": 12.50,
            "high": 12.80,
            "low": 12.45,
            "close": 12.75,
            "volume": 1500000,
            "amount": 19000000
        }
    ],
    "cache_hit": False
}
```

---

## 10. Known Issues

### 10.1 TODO

- [ ] A股/港股数据源支持数据库配置读取（目前仅支持环境变量）
- [ ] 美股数据源已支持数据库配置
- [ ] 研究员 Agent 流式输出支持

### 10.2 Configuration Files

| File | Purpose |
|------|---------|
| `app/core/unified_config.py` | 统一配置管理 |
| `app/services/config_service.py` | 配置服务 |
| `tradingagents/dataflows/data_source_manager.py` | 数据源管理器 |
