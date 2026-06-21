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
`;
