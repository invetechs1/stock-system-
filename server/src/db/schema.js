// Schema definition, shared by the connection bootstrap and the CLI migrator.
// Every statement is idempotent so applying it repeatedly is safe.
export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    cash          REAL NOT NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stocks (
    symbol      TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    price       REAL NOT NULL,
    prev_close  REAL NOT NULL,
    volatility  REAL NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS holdings (
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol    TEXT NOT NULL REFERENCES stocks(symbol),
    shares    INTEGER NOT NULL,
    avg_cost  REAL NOT NULL,
    PRIMARY KEY (user_id, symbol)
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol   TEXT NOT NULL REFERENCES stocks(symbol),
    PRIMARY KEY (user_id, symbol)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id         TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
    symbol     TEXT NOT NULL,
    shares     INTEGER NOT NULL,
    price      REAL NOT NULL,
    total      REAL NOT NULL,
    timestamp  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tx_user_time
    ON transactions(user_id, timestamp DESC);

  CREATE TABLE IF NOT EXISTS orders (
    id           TEXT PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    side         TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    symbol       TEXT NOT NULL REFERENCES stocks(symbol),
    shares       INTEGER NOT NULL,
    limit_price  REAL NOT NULL,
    status       TEXT NOT NULL CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED'))
                 DEFAULT 'PENDING',
    fill_price   REAL,
    created_at   INTEGER NOT NULL,
    filled_at    INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_orders_user_time
    ON orders(user_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders(status);

  CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value      REAL NOT NULL,
    timestamp  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_user_time
    ON portfolio_snapshots(user_id, timestamp);
`;
