import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DB_FILE = join(DATA_DIR, 'db.json');

// Seed universe of tradable stocks with starting prices.
const SEED_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 195.32 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 421.18 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.45 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 186.9 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 124.72 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.5 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 504.3 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 678.11 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 162.04 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 198.77 }
];

const STARTING_CASH = 100000;

function defaultState() {
  const now = Date.now();
  return {
    stocks: SEED_STOCKS.map((s) => ({
      ...s,
      prevClose: s.price,
      updatedAt: now,
      // Per-stock volatility so movement feels varied.
      volatility: 0.004 + Math.random() * 0.008
    })),
    portfolio: {
      cash: STARTING_CASH,
      // symbol -> { shares, avgCost }
      holdings: {}
    },
    watchlist: [],
    transactions: []
  };
}

let state;

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function load() {
  ensureDir();
  if (existsSync(DB_FILE)) {
    try {
      state = JSON.parse(readFileSync(DB_FILE, 'utf8'));
      return state;
    } catch {
      // Corrupt file — fall through to a fresh state.
    }
  }
  state = defaultState();
  save();
  return state;
}

export function getState() {
  if (!state) load();
  return state;
}

let saveTimer = null;
export function save() {
  ensureDir();
  // Debounce writes; the simulator mutates state frequently.
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
  }, 500);
}

export function saveNow() {
  ensureDir();
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

export function resetState() {
  state = defaultState();
  saveNow();
  return state;
}
