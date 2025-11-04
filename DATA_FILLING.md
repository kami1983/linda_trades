## DATA FILLING

本文件说明如何以“可持续、可恢复”的方式填充与维护如下两张数据表：

- `market_symbol_meta`：市场品种元数据
- `market_daily_ohlcv`：日线级别 OHLCV（Open/High/Low/Close/Volume）

此外，还包含“期权合约与报价/Greeks”的采集与存储：

- `market_option_contract_meta`：期权合约元数据
- `market_option_quote_ts`：期权报价与 Greeks 时间序列（含标的价格与 moneyness）

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

——

期权相关：

- `market_option_contract_meta`
  - 用途：记录期权合约维度的元数据（`exchange`, `symbol`, `base`, `quote`, `expiration_date`, `strike`, `option_type` 等）。
  - 唯一键：(`exchange`, `symbol`)。
  - 备注：`first_seen_ts/last_seen_ts` 记录发现时间与最近活跃时间。

- `market_option_quote_ts`
  - 用途：存储期权合约的报价快照与 Greeks，形成时间序列。
  - 唯一键：(`exchange`, `symbol`, `timestamp`)（幂等、去重）。
  - 字段概览：
    - 报价：`bid_price/bid_size/ask_price/ask_size/last_price/last_size`
    - 标的：`underlying_price`
    - moneyness：`moneyness_pct` = (underlying − strike) / strike；`moneyness_type` = ITM/OTM/ATM（ATM 判定阈值默认 1%）
    - Greeks/IV：`s_iv/b_iv/delta/gamma/theta/vega`

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

- 期权合约与报价/Greeks：
  - 仓储：`libs/database/options_repo.py`
    - `upsert_option_contract_meta(items)`
    - `upsert_option_quotes(rows)`（含 NaN/Inf 清洗）
  - 单次抓取器：`apps/data_ingest/options_chain_ingestor.py`
    - 对所选 base（默认 BTC、ETH）抓取整条期权链，计算 IV/Greeks，写入 `market_option_quote_ts`
    - 使用 SWAP 价格近似标的 `underlying_price`；同时计算 moneyness_pct 与 ITM/OTM/ATM
  - 定时调度器：`apps/schedulers/options_chain_scheduler.py`
    - 默认每 5 分钟（可配）抓取一次，带抖动；启动即跑一次

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

# Options ingest
OPTIONS_EXCHANGE=okx
OPTIONS_BASES=BTC,ETH

# Options scheduler (no cron)
# 默认 1 小时（3600s），可在 .env 中修改
SCHED_OPTIONS_INTERVAL_SEC=3600
SCHED_OPTIONS_JITTER_SEC=30
SCHED_OPTIONS_RUN_ON_START=1
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

期权合约与报价/Greeks 一次性抓取：

```bash
# 推荐（在项目根目录执行）
python -m apps.data_ingest.options_chain_ingestor

# 备选（直接运行脚本）
python apps/data_ingest/options_chain_ingestor.py
```

行为：
- 遍历 `OPTIONS_BASES`（默认 BTC, ETH），抓取整条链，计算 IV/Greeks；
- 写入/更新 `market_option_contract_meta`；
- 按 (`exchange`,`symbol`,`timestamp`) 幂等写入 `market_option_quote_ts`；
- 每条记录含 `underlying_price/moneyness_pct/moneyness_type`，便于筛选 ATM/ITM/OTM。

---

### 5) 长期运行（异步调度器）

无需系统 cron，直接运行内置调度服务（推荐模块运行方式 -m；也可直接脚本运行）：

```bash
# 推荐（在项目根目录执行）
python -m apps.schedulers.daily_ohlcv_scheduler

# 备选（直接运行脚本）
python apps/schedulers/daily_ohlcv_scheduler.py
```

期权调度（不依赖 cron）：

```bash
# 推荐（在项目根目录执行）
python -m apps.schedulers.options_chain_scheduler

# 备选（直接运行脚本）
python apps/schedulers/options_chain_scheduler.py
```

默认每 1 小时抓取一次（`SCHED_OPTIONS_INTERVAL_SEC` 可配置）。

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

期权数据规模与最近时间：

```sql
SELECT exchange, COUNT(DISTINCT symbol) AS contracts, COUNT(*) AS rows,
       FROM_UNIXTIME(MAX(timestamp)/1000) AS last_ts
FROM market_option_quote_ts
GROUP BY exchange;
```

按 moneyness 统计：

```sql
SELECT exchange, moneyness_type, COUNT(*) AS cnt
FROM market_option_quote_ts
GROUP BY exchange, moneyness_type
ORDER BY exchange, moneyness_type;
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

- 期权抓取频率与范围建议：
  - 频率：研究/日级回测 5m 足够；日内策略/风控 30–60s；更高频建议 WebSocket。
  - 范围：常态仅抓近端到期（2–3 个）+ ATM 附近若干档（±10% 或各侧 5–7 档）；每日一次全链补档。
  - 过滤：仅保留买卖价均非 0 的合约以减少噪声；翼部可以低频补齐。

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


