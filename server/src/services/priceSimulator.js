import { db } from '../db/index.js';
import { round2 } from '../utils/money.js';

const allStocks = db.prepare('SELECT symbol, price, volatility FROM stocks');
const updatePrice = db.prepare(
  'UPDATE stocks SET price = ?, updated_at = ? WHERE symbol = ?'
);

// Random-walk every stock by a small percentage drawn from its volatility.
const tickOnce = db.transaction(() => {
  const now = Date.now();
  for (const s of allStocks.all()) {
    const drift = (Math.random() - 0.5) * 2 * s.volatility;
    const next = Math.max(0.5, round2(s.price * (1 + drift)));
    updatePrice.run(next, now, s.symbol);
  }
});

let intervalId = null;

export function startSimulator(intervalMs = 3000) {
  if (intervalId) return;
  intervalId = setInterval(tickOnce, intervalMs);
  if (intervalId.unref) intervalId.unref(); // don't keep the process alive
}

export function stopSimulator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// Exposed for tests that need a deterministic single tick.
export { tickOnce };
