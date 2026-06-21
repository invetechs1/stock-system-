# 📈 Stock Trading System

A production-grade, full-stack paper-trading platform. Create an account, watch
live (simulated) prices, build a portfolio with virtual cash, track
gains/losses, and keep a watchlist — backed by an authenticated REST API and a
real database.

> **Note:** Prices come from a built-in random-walk simulator, so the system is
> fully self-contained and needs no external market-data provider or API key.

## Stack

- **Backend** — Node.js + Express, **SQLite** (better-sqlite3) with migrations,
  **JWT auth** (bcrypt-hashed passwords), per-user portfolios, **zod** request
  validation, **helmet** + **rate limiting**, structured JSON logging, and a
  background price simulator.
- **Frontend** — React (Vite) SPA with an auth flow (register/login), token
  session handling, and a live trading dashboard.
- **Ops** — Dockerfiles for both tiers, **docker-compose** (nginx-served client
  + API + persistent volume), and a **GitHub Actions** CI pipeline (tests, build,
  image builds).

## Project layout

```
server/                       Express API
  src/
    config.js                 env validation (zod)
    logger.js                 structured JSON logger
    app.js                    express app factory (security, routes)
    index.js                  entry point (seed, simulator, listen)
    db/                       connection, schema, migrate, seed
    middleware/               auth, validation, error handling
    services/                 auth, portfolio, orders, watchlist, stocks, simulator, events
    routes/                   auth, stocks, stream, portfolio, orders, watchlist
  test/                       vitest + supertest suite
  Dockerfile
client/                       React + Vite frontend
  src/
    auth/AuthContext.jsx      session state + token handling
    api/client.js             fetch wrapper with JWT
    components/               AuthScreen, Dashboard, Market, Holdings, …
  Dockerfile, nginx.conf
docker-compose.yml
.github/workflows/ci.yml
```

## Quick start — Docker (recommended)

```bash
cp .env.example .env
# set JWT_SECRET in .env (e.g. openssl rand -hex 32)
docker compose up --build
```

Open **http://localhost:8080**. The nginx-served client proxies `/api` to the
backend; the SQLite database persists in a named volume.

## Quick start — local dev

Requires **Node.js 18+**. Two terminals:

```bash
# 1) Backend
cd server
npm install
npm start            # http://localhost:4000

# 2) Frontend
cd client
npm install
npm run dev          # http://localhost:5173 (proxies /api to :4000)
```

Open **http://localhost:5173**, create an account, and start trading.

## Testing

```bash
cd server
npm test             # vitest + supertest (in-memory SQLite)
```

The suite covers auth (register/login/validation/protected routes), trading
(buy/sell, funds & share validation, transaction logging, per-user isolation),
the limit-order engine (placement, triggered fills, insufficient-balance
deferral, cancellation), and the watchlist.

## Features

- **Accounts** — register/login with JWT auth; bcrypt-hashed passwords.
- **Per-user portfolios** — each account gets its own cash, holdings, watchlist
  and trade history, fully isolated.
- **Live market** — 10 seeded stocks with prices that drift every few seconds,
  pushed to the browser in real time over **Server-Sent Events** (no polling).
- **Market trading** — buy/sell against virtual cash with server-side validation
  (funds, share counts, known symbols), executed in DB transactions.
- **Limit orders** — place resting BUY/SELL orders that the engine auto-fills on
  the next tick once the price crosses your limit (and the account can support
  the fill); cancel any pending order.
- **Portfolio** — holdings valued at live prices with average cost and
  unrealized gain/loss per position, plus totals.
- **Watchlist & history** — star stocks to track; every trade is recorded.

## API reference

Authenticated routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint                      | Auth | Description                      |
| ------ | ----------------------------- | :--: | -------------------------------- |
| GET    | `/api/health`                 |  –   | Health check                     |
| POST   | `/api/auth/register`          |  –   | Create account `{ email, password }` |
| POST   | `/api/auth/login`             |  –   | Log in `{ email, password }`     |
| GET    | `/api/auth/me`                |  ✓   | Current user                     |
| GET    | `/api/stocks`                 |  –   | All stocks with live quotes      |
| GET    | `/api/stocks/:symbol`         |  –   | Single stock quote               |
| GET    | `/api/stream`                 |  –   | SSE stream of live quotes (`tick` events) |
| GET    | `/api/portfolio`              |  ✓   | Portfolio with live valuation    |
| POST   | `/api/portfolio/buy`          |  ✓   | Market buy `{ symbol, shares }`  |
| POST   | `/api/portfolio/sell`         |  ✓   | Market sell `{ symbol, shares }` |
| GET    | `/api/portfolio/transactions` |  ✓   | Trade history                    |
| GET    | `/api/orders`                 |  ✓   | List limit orders                |
| POST   | `/api/orders`                 |  ✓   | Place `{ side, symbol, shares, limitPrice }` |
| DELETE | `/api/orders/:id`             |  ✓   | Cancel a pending order           |
| GET    | `/api/watchlist`              |  ✓   | Watched stocks with quotes       |
| POST   | `/api/watchlist`              |  ✓   | Add `{ symbol }`                 |
| DELETE | `/api/watchlist/:symbol`      |  ✓   | Remove a symbol                  |

## Configuration

All variables are validated at startup (see `server/src/config.js`).

| Env var          | Default                       | Description                          |
| ---------------- | ----------------------------- | ------------------------------------ |
| `NODE_ENV`       | `development`                 | `development` \| `test` \| `production` |
| `PORT`           | `4000`                        | Backend HTTP port                    |
| `DATABASE_PATH`  | `./data/stock-system.db`      | SQLite file path (`:memory:` in tests) |
| `JWT_SECRET`     | dev fallback                  | **Required in production** (min 16 chars) |
| `JWT_EXPIRES_IN` | `7d`                          | Token lifetime                       |
| `TICK_MS`        | `3000`                        | Price simulator tick interval (ms)   |
| `STARTING_CASH`  | `100000`                      | Virtual cash per new account         |
| `CORS_ORIGIN`    | `*`                           | Allowed origins (`*` or CSV)         |
| `BCRYPT_ROUNDS`  | `10`                          | Password hash cost factor            |
