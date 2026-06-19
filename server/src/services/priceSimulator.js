import { getState, save } from '../store.js';

// Random-walk price simulator. Each tick nudges every stock by a small
// percentage drawn from its volatility, keeping prices positive and rounded.
function tick() {
  const { stocks } = getState();
  for (const stock of stocks) {
    const drift = (Math.random() - 0.5) * 2 * stock.volatility;
    const next = stock.price * (1 + drift);
    stock.price = Math.max(0.5, Math.round(next * 100) / 100);
    stock.updatedAt = Date.now();
  }
  save();
}

let intervalId = null;

export function startSimulator(intervalMs = 3000) {
  if (intervalId) return;
  // Snapshot the previous close once at startup so daily change is meaningful.
  const { stocks } = getState();
  for (const stock of stocks) {
    if (stock.prevClose == null) stock.prevClose = stock.price;
  }
  intervalId = setInterval(tick, intervalMs);
}

export function stopSimulator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
