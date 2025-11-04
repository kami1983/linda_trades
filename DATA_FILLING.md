## DATA FILLING

本文件说明如何以“可持续、可恢复”的方式填充与维护如下两张数据表：

- `market_symbol_meta`：市场品种元数据
- `market_daily_ohlcv`：日线级别 OHLCV（Open/High/Low/Close/Volume）

不依赖 cron，提供内置 asyncio 调度器进行每日增量更新。

---

### 1) 数据表说明

- `market_symbol_meta`
  - 用途：记录各交易所品种的元数据（`exchange`, `symbol`, `base`, `quote`, `market_type` 等）。
  - 唯一键：(`exchange`, `symbol`)，避免重复。
  - 用于：数据抓取前的品种发现或白名单维护。

- `market_daily_ohlcv`
  - 用途：存储日线 K 线（默认 `timeframe='1d'`）。
  - 唯一键：(`exchange`, `symbol`, `timeframe`, `timestamp`)。
  - 断点续跑：按该唯一键自然去重，通过查询最大 `timestamp` 增量补写。

这两张表的 DDL 已追加在 `dbdata/struct/mysql.init.sql` 末尾，如需初始化数据库，请确保执行该 SQL。

---

### 2) 相关代码位置

- 仓储（DB 写入/查询）：
  - `libs/database/ohlcv_repo.py`
    - `upsert_market_symbol_meta(items: List[dict])`
    - `upsert_market_daily_ohlcv(rows: List[dict])`
    - `get_last_daily_ts(exchange: str, symbol: str, timeframe: str='1d') -> Optional[int]`

- 日线抓取器（基于 CCXT，支持发现品种与断点续跑）：
  - `apps/data_ingest/ohlcv_daily_ingestor.py`
    - 自动品种发现：`exchange.load_markets()`，可按 `market_type` 和 `base` 白名单过滤
    - 断点续跑：查询 DB 中最后一条日线 `timestamp`，仅补增量
    - 限速与稳定性：启用 CCXT `enableRateLimit`；分批 upsert 降低内存与压力

- 异步日调度器（不依赖 cron）：
  - `apps/schedulers/daily_ohlcv_scheduler.py`
    - 每日 UTC 指定时间运行，带随机抖动；可配置启动即跑一次

---

### 3) 环境变量

抓取器通用（被调度器复用）：

```bash
# 交易所与市场类型
export DAILY_OHLCV_EXCHANGE=okx              # okx | binance
export DAILY_OHLCV_MARKET_TYPE=spot          # spot | swap
export DAILY_OHLCV_LOOKBACK_DAYS=365         # 初次回补天数

# 手动符号列表（可与自动发现并存；手动优先生效）
export DAILY_OHLCV_SYMBOLS="BTC/USDT,ETH/USDT"

# 自动发现（load_markets）
export DAILY_OHLCV_DISCOVER=1                # 1 开启自动发现，0 关闭
export DAILY_OHLCV_BASES="BTC,ETH"           # 自动发现时按 base 白名单过滤，可留空
export DAILY_OHLCV_MAX_SYMBOLS=50            # 限制自动发现的最大品种数，0 不限
```

调度器专用：

```bash
export SCHED_OHLCV_RUN_AT_UTC="00:10"        # 每日 UTC 执行时刻（HH:MM）
export SCHED_OHLCV_JITTER_SEC=120            # 启动前随机抖动秒数，避免集中打点
export SCHED_OHLCV_RUN_ON_START=1            # 1=启动即执行一次，0=否
```

数据库连接（必需）：

```bash
export MYSQL_HOST=127.0.0.1
export MYSQL_PORT=3306
export MYSQL_USER=your_user
export MYSQL_PASSWORD=your_password
export MYSQL_DBNAME=linda_trades
```

交易所凭据（可选）：

- 说明：公开日线行情抓取（load_markets/fetch_ohlcv）不需要 API Key。
- 仅在需要私有接口（账户、下单、订单历史、私有 WS）时才需要：

```bash
export OKEX_API_KEY=...
export OKEX_API_SECRET=...
export OKEX_API_PASSWORD=...
export OKEX_IS_SANDBOX=0   # 1=使用沙箱
```

通知/邮件（可选）：

```bash
export MAIL_AUTH_PASS=...  # 邮件认证密码
```

示例 .env 片段：

```bash
# DB
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=linda
MYSQL_PASSWORD=secret
MYSQL_DBNAME=linda_trades

# Ingest
DAILY_OHLCV_EXCHANGE=okx
DAILY_OHLCV_MARKET_TYPE=spot
DAILY_OHLCV_SYMBOLS=BTC/USDT,ETH/USDT
DAILY_OHLCV_DISCOVER=1
DAILY_OHLCV_BASES=BTC,ETH
DAILY_OHLCV_MAX_SYMBOLS=50
DAILY_OHLCV_LOOKBACK_DAYS=365

# Scheduler
SCHED_OHLCV_RUN_AT_UTC=00:10
SCHED_OHLCV_JITTER_SEC=120
SCHED_OHLCV_RUN_ON_START=1
```

---

### 4) 一次性回补（手动执行）

适用于初始化或单次回补（推荐模块运行方式 -m；也可直接脚本运行）：

```bash
# 推荐（在项目根目录执行）
python -m apps.data_ingest.ohlcv_daily_ingestor

# 备选（直接运行脚本）
python apps/data_ingest/ohlcv_daily_ingestor.py
```

行为：
- 若配置了 `DAILY_OHLCV_DISCOVER=1`，会通过 `load_markets()` 自动发现品种（受 `MARKET_TYPE/BASES/MAX_SYMBOLS` 限制）。
- 对每个品种，先查询 DB 的最后一根 `1d` K 线时间戳，仅补增量；首次回补按 `DAILY_OHLCV_LOOKBACK_DAYS` 回溯。
- 分批写入 `market_daily_ohlcv` 与同步更新 `market_symbol_meta`。

---

### 5) 长期运行（异步调度器）

无需系统 cron，直接运行内置调度服务（推荐模块运行方式 -m；也可直接脚本运行）：

```bash
# 推荐（在项目根目录执行）
python -m apps.schedulers.daily_ohlcv_scheduler

# 备选（直接运行脚本）
python apps/schedulers/daily_ohlcv_scheduler.py
```

行为：
- 每日 `SCHED_OHLCV_RUN_AT_UTC` 指定的 UTC 时刻启动一次抓取，带 `SCHED_OHLCV_JITTER_SEC` 抖动；
- 失败不中断循环；
- 如 `SCHED_OHLCV_RUN_ON_START=1`，进程启动即跑一次。

可用系统服务（如 systemd/Supervisor）托管该进程为守护服务，保证持久运行（不依赖 cron）。

---

### 6) 验证与自检 SQL

统计品种：

```sql
SELECT exchange, market_type, COUNT(*) AS cnt
FROM market_symbol_meta
GROUP BY exchange, market_type;
```

查看最近 10 天 K 线（OKX / BTC/USDT）：

```sql
SELECT exchange, symbol, datetime, open, high, low, close, volume
FROM market_daily_ohlcv
WHERE exchange='okx' AND symbol='BTC/USDT'
ORDER BY timestamp DESC
LIMIT 10;
```

检查覆盖区间：

```sql
SELECT exchange, symbol, MIN(datetime) AS first_day, MAX(datetime) AS last_day, COUNT(*) AS days
FROM market_daily_ohlcv
GROUP BY exchange, symbol
ORDER BY symbol;
```

---

### 7) 设计选择与最佳实践

- 可持续性：
  - 唯一键防重；`get_last_daily_ts()` 决定增量边界；分批 upsert 降低内存与数据库压力。
  - CCXT 启用 `enableRateLimit`，避免触发交易所风控；失败时下一轮继续。

- 统一时区：
  - `timestamp` 使用毫秒；`datetime` 采用 UTC 日期字符串（`YYYY-MM-DD`）。

- 市场类型：
  - `market_type` 用于区分 `spot`/`swap`；建议同一运行实例保持一致，防止符号含义混淆。

- 品种发现：
  - 建议用 `DAILY_OHLCV_BASES` 白名单限制主要标的（如 `BTC,ETH`）。

- 可扩展性：
  - 需要更多时间粒度时，可沿用 `market_daily_ohlcv` 的 `timeframe` 列（当前默认 `1d`）。

---

### 8) 故障排查

- 数据库连接失败：
  - 确认 `.env` 与 MySQL 权限；`libs/database/db_operation.py` 的连接参数正确。

- 交易所限速/网络错误：
  - 默认已启用限速；必要时缩小 `DAILY_OHLCV_MAX_SYMBOLS` 或降低首次 `LOOKBACK_DAYS`。

- 符号不一致：
  - 以交易所原生 `symbol` 存储（如 `BTC/USDT`、部分交易所会带 `:USDT` 后缀），建议上层展示时做映射。

---

### 9) 相关文件一览

- `dbdata/struct/mysql.init.sql`：表结构
- `libs/database/ohlcv_repo.py`：DB 仓储（upsert/last-ts）
- `apps/data_ingest/ohlcv_daily_ingestor.py`：日线抓取器（发现+续跑）
- `apps/schedulers/daily_ohlcv_scheduler.py`：异步调度器（无 cron）


