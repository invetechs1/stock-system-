// Thin wrapper around fetch for the stock-system API.
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getStocks: () => request('/stocks'),
  getPortfolio: () => request('/portfolio'),
  getTransactions: () => request('/portfolio/transactions'),
  buy: (symbol, shares) =>
    request('/portfolio/buy', {
      method: 'POST',
      body: JSON.stringify({ symbol, shares })
    }),
  sell: (symbol, shares) =>
    request('/portfolio/sell', {
      method: 'POST',
      body: JSON.stringify({ symbol, shares })
    }),
  resetPortfolio: () => request('/portfolio/reset', { method: 'POST' }),
  getWatchlist: () => request('/watchlist'),
  addWatch: (symbol) =>
    request('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol })
    }),
  removeWatch: (symbol) =>
    request(`/watchlist/${symbol}`, { method: 'DELETE' })
};

export function formatMoney(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(n ?? 0);
}
