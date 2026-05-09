# Configuration Management

> TradingAgents-CN 配置管理设计

## 1. Overview

配置管理系统负责管理所有配置，包括 API Key、数据源、Agent 参数等。

```
┌─────────────────────────────────────────────────────────────┐
│                  Configuration Management                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Unified Config (统一配置入口)                │  │
│  │  - Schema Validation                                   │  │
│  │  - Environment Override                                 │  │
│  │  - Type Safety                                         │  │
│  └─────────────────────────┬────────────────────────────┘  │
│                            ↓                                 │
│  ┌─────────────────────────┴────────────────────────────┐  │
│  │              Config Service (配置服务)                   │  │
│  │  - CRUD Operations                                     │  │
│  │  - Database Storage                                    │  │
│  │  - Cache Layer                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Config Storage                            │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │  │
│  │  │ .env    │  │ Database │  │  YAML   │           │  │
│  │  │(本地开发)│  │(生产环境)│  │(配置模板)│           │  │
│  │  └─────────┘  └─────────┘  └─────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Configuration Layers

### 2.1 Layer Priority

```
优先级 (高 → 低):
1. 环境变量 (.env)
2. 数据库配置 (Web 界面)
3. 默认值 (代码中的 DEFAULT_*)
```

### 2.2 Environment Variables

```bash
# .env.example

# ===========================================
# LLM Configuration
# ===========================================
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
DEEPSEEK_API_KEY=xxx

# ===========================================
# Data Source API Keys
# ===========================================
TUSHARE_TOKEN=xxx
ALPHA_VANTAGE_KEY=xxx
FINNHUB_API_KEY=xxx

# ===========================================
# Database
# ===========================================
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=tradingagents

# ===========================================
# App Configuration
# ===========================================
APP_ENV=development
LOG_LEVEL=INFO
API_PORT=8000
```

---

## 3. Configuration Schema

### 3.1 Config Structure

```python
@dataclass
class AppConfig:
    """应用配置"""
    
    # App Settings
    app_env: AppEnv                    # development, staging, production
    log_level: LogLevel
    api_port: int = 8000
    
    # LLM Settings
    llm_provider: LLMProvider          # openai, anthropic, deepseek
    llm_model: str
    llm_temperature: float = 0.7
    llm_max_tokens: int = 4096
    
    # Data Source Settings
    data_source_config: DataSourceConfig
    
    # Agent Settings
    agent_config: AgentConfig
    
    # Trading Settings
    trading_config: TradingConfig
    
    # Database
    database: DatabaseConfig


@dataclass
class DataSourceConfig:
    """数据源配置"""
    
    # 优先级: database > env > default
    tushare_token: Optional[str]
    alpha_vantage_key: Optional[str]
    finnhub_api_key: Optional[str]
    
    # Source Priority (per market)
    cn_source_priority: List[str] = field(
        default_factory=lambda: ["Tushare", "AKShare"]
    )
    us_source_priority: List[str] = field(
        default_factory=lambda: ["AlphaVantage", "Finnhub", "YahooFinance"]
    )
    
    # Cache Settings
    cache_enabled: bool = True
    cache_ttl_seconds: int = 3600


@dataclass
class AgentConfig:
    """Agent 配置"""
    
    default_model: str = "gpt-4o"
    default_temperature: float = 0.7
    default_max_tokens: int = 4096
    timeout_seconds: int = 60
    
    # Per-Agent Override
    agent_overrides: Dict[str, AgentOverride] = field(default_factory=dict)
    
    # Prompt Template
    template_version: str = "1.0.1"
    template_store_path: str = "config/templates.json"


@dataclass
class TradingConfig:
    """交易配置"""
    
    # Position Limits
    max_single_position: float = 0.20      # 20%
    min_single_position: float = 0.01      # 1%
    max_sector_concentration: float = 0.40  # 40%
    
    # Risk Controls
    max_portfolio_var: float = 0.05         # 5%
    max_daily_loss: float = 0.03            # 3%
    max_drawdown: float = 0.15              # 15%
    
    # Cash Management
    min_cash_ratio: float = 0.05           # 5%
    enable_cash_reserve: bool = True
    
    # Execution
    default_order_type: OrderType = OrderType.LIMIT
    enable_twap: bool = False
    enable_vwap: bool = False
```

---

## 4. Unified Config System

### 4.1 Config Provider

```python
class UnifiedConfigProvider:
    """
    统一配置提供者
    实现配置优先级的统一管理
    """
    
    def __init__(
        self,
        env_loader: EnvLoader,
        db_loader: DatabaseConfigLoader,
        defaults: Dict[str, Any]
    ):
        self.env_loader = env_loader
        self.db_loader = db_loader
        self.defaults = defaults
        self._cache = {}
    
    async def get_config(self, config_path: str) -> Any:
        """
        获取配置，遵循优先级:
        1. 环境变量
        2. 数据库
        3. 默认值
        """
        # Try cache first
        if config_path in self._cache:
            return self._cache[config_path]
        
        # 1. Environment
        env_val = self.env_loader.get(config_path)
        if env_val is not None:
            return self._parse_and_cache(config_path, env_val)
        
        # 2. Database
        db_val = await self.db_loader.get(config_path)
        if db_val is not None:
            return self._parse_and_cache(config_path, db_val)
        
        # 3. Default
        return self._parse_and_cache(config_path, self.defaults.get(config_path))
```

### 4.2 Config Service (Web API)

```python
class ConfigService:
    """配置服务 - 提供 Web 界面配置能力"""
    
    def __init__(self, db: Database, cache: Redis):
        self.db = db
        self.cache = cache
    
    # ===========================================
    # Data Source Config
    # ===========================================
    
    async def get_datasource_config(
        self, source_name: str
    ) -> Optional[DataSourceConfig]:
        """
        获取数据源配置
        优先返回数据库配置，否则返回环境变量值
        """
        # Check database
        db_config = await self.db.data_source_configs.find_one({
            "source_name": source_name,
            "enabled": True
        })
        
        if db_config and db_config.get("api_key"):
            return DataSourceConfig(
                source_name=source_name,
                api_key=db_config["api_key"],
                source="database"
            )
        
        # Fallback to environment variable
        env_key = SOURCE_ENV_MAP.get(source_name)
        if env_key:
            env_val = os.getenv(env_key)
            if env_val:
                return DataSourceConfig(
                    source_name=source_name,
                    api_key=env_val,
                    source="environment"
                )
        
        return None
    
    async def save_datasource_config(
        self, source_name: str, api_key: str, enabled: bool = True
    ) -> bool:
        """保存数据源配置到数据库"""
        result = await self.db.data_source_configs.update_one(
            {"source_name": source_name},
            {
                "$set": {
                    "api_key": api_key,
                    "enabled": enabled,
                    "updated_at": datetime.now()
                },
                "$setOnInsert": {
                    "created_at": datetime.now()
                }
            },
            upsert=True
        )
        
        # Invalidate cache
        await self.cache.delete(f"ds_config:{source_name}")
        
        return result.modified_count > 0 or result.upserted_id is not None
```

---

## 5. API Key Management

### 5.1 Key Storage

```python
# 数据库 Schema
{
    "_id": ObjectId,
    "source_name": "Tushare",
    "api_key": "encrypted_key_here",
    "enabled": True,
    "created_at": datetime,
    "updated_at": datetime,
    "created_by": "admin",
    "last_used": datetime,
    "usage_count": 1500
}

# 加密存储
class APIKeyEncryptor:
    def encrypt(self, key: str) -> str:
        # 使用 Fernet 对称加密
        return fernet.encrypt(key.encode()).decode()
    
    def decrypt(self, encrypted: str) -> str:
        return fernet.decrypt(encrypted.encode()).decode()
```

### 5.2 Key Validation

```python
class APIKeyValidator:
    async def validate(self, source_name: str, api_key: str) -> bool:
        """验证 API Key 是否有效"""
        validators = {
            "Tushare": self._validate_tushare,
            "AlphaVantage": self._validate_alpha_vantage,
            "Finnhub": self._validate_finnhub,
        }
        
        validator = validators.get(source_name)
        if not validator:
            return True  # No validation for unknown sources
        
        return await validator(api_key)
    
    async def _validate_tushare(self, token: str) -> bool:
        """验证 Tushare Token"""
        try:
            import tushare as ts
            pro = ts.pro_api(token)
            pro.trade_cal(start_date="20260501", end_date="20260501")
            return True
        except Exception:
            return False
```

---

## 6. Configuration Validation

### 6.1 Schema Validation

```python
class ConfigValidator:
    def validate(self, config: AppConfig) -> List[ValidationError]:
        errors = []
        
        # App Config
        if config.api_port < 1024 or config.api_port > 65535:
            errors.append(ValidationError(
                field="api_port",
                message="Port must be between 1024 and 65535"
            ))
        
        # LLM Config
        if config.llm_temperature < 0 or config.llm_temperature > 2:
            errors.append(ValidationError(
                field="llm_temperature",
                message="Temperature must be between 0 and 2"
            ))
        
        # Trading Config
        if config.trading_config.max_single_position > 1.0:
            errors.append(ValidationError(
                field="max_single_position",
                message="Max position cannot exceed 100%"
            ))
        
        if config.trading_config.min_cash_ratio < 0:
            errors.append(ValidationError(
                field="min_cash_ratio",
                message="Cash ratio cannot be negative"
            ))
        
        # Agent Config
        if config.agent_config.timeout_seconds < 10:
            errors.append(ValidationError(
                field="timeout_seconds",
                message="Timeout must be at least 10 seconds"
            ))
        
        return errors
```

---

## 7. Web UI Settings

### 7.1 Settings Pages

| Page | Description |
|------|-------------|
| `/settings/general` | 通用设置 (App Env, Log Level) |
| `/settings/llm` | LLM 配置 (Provider, Model, API Keys) |
| `/settings/datasources` | 数据源配置 (API Keys, Priority) |
| `/settings/agents` | Agent 配置 (Temperature, Templates) |
| `/settings/trading` | 交易配置 (风控参数) |
| `/settings/api-keys` | API Key 管理 (增删改查) |

### 7.2 Settings Merge

```python
class SettingsMerger:
    """
    多源配置合并
    用于在代码中合并环境变量、数据库和默认配置
    """
    
    def merge(
        self,
        defaults: Dict,
        database: Dict,
        environment: Dict
    ) -> Dict:
        result = defaults.copy()
        
        # Database overrides defaults
        result = self._deep_merge(result, database)
        
        # Environment overrides database
        result = self._deep_merge(result, environment)
        
        return result
    
    def _deep_merge(self, base: Dict, override: Dict) -> Dict:
        for key, value in override.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                base[key] = self._deep_merge(base[key], value)
            elif value is not None:
                base[key] = value
        return base
```

---

## 8. Configuration Migration

### 8.1 Migration System

```python
# 配置文件版本管理
class ConfigMigrator:
    def __init__(self, config_dir: Path):
        self.config_dir = config_dir
        self.current_version = "1.0"
        self.migrations = {
            "0.9->1.0": self.migrate_090_to_100,
        }
    
    def migrate_if_needed(self):
        current = self._read_version()
        if current < self.current_version:
            for version, migration_fn in self.migrations.items():
                if self._needs_migration(current, version):
                    migration_fn()
                    current = self._parse_version(version.split("->")[1])
    
    def migrate_090_to_100(self):
        # Rename old keys
        old_config = self._read_config("config.yaml")
        new_config = {
            "llm": old_config.get("model", {}),
            "datasources": old_config.get("apis", {}),
            "agents": old_config.get("agent_settings", {}),
        }
        self._write_config("config.yaml", new_config)
```

---

## 9. Key Files

| File | Purpose |
|------|---------|
| `app/core/unified_config.py` | 统一配置管理 |
| `app/services/config_service.py` | 配置服务 (CRUD) |
| `config/templates.json` | Prompt 模板存储 |
| `.env.example` | 环境变量示例 |
| `tradingagents/dataflows/data_source_manager.py` | 数据源配置读取 |

---

## 10. Known Issues

### 10.1 Configuration Gaps

| Issue | Status | Description |
|-------|--------|-------------|
| A股/港股数据源不支持数据库配置 | TODO | 目前仅支持环境变量 |
| 美股数据源已支持数据库配置 | DONE | - |
| 配置变更热更新 | TODO | 目前需要重启 |
| 配置变更审计日志 | TODO | 记录谁改了配置 |
