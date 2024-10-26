CREATE TABLE swap_price (
    id BIGINT AUTO_INCREMENT COMMENT '唯一标识ID',
    symbol VARCHAR(255) NOT NULL COMMENT '交易对符号，例如 BTC/USD',
    last FLOAT NOT NULL COMMENT '最新成交价格',
    bid FLOAT DEFAULT NULL COMMENT '买价',
    ask FLOAT DEFAULT NULL COMMENT '卖价',
    high FLOAT DEFAULT NULL COMMENT '24小时最高价',
    low FLOAT DEFAULT NULL COMMENT '24小时最低价',
    timestamp BIGINT DEFAULT NULL COMMENT 'Unix时间戳，记录价格时间',
    datetime VARCHAR(255) DEFAULT NULL COMMENT '日期时间的字符串表示',
    type INT DEFAULT NULL COMMENT '数据类型标识，1 表示有效数据',
    status INT DEFAULT NULL COMMENT '状态标识，1 表示有效状态',
    PRIMARY KEY (id),
    UNIQUE KEY unique_symbol (symbol)
);

-- 为 timestamp 字段添加索引
CREATE INDEX idx_timestamp ON swap_price (timestamp);

-- 为 datetime 字段添加索引
CREATE INDEX idx_datetime ON swap_price (datetime);

-- 为 type 字段添加索引
CREATE INDEX idx_type ON swap_price (type);

-- 为 status 字段添加索引
CREATE INDEX idx_status ON swap_price (status);