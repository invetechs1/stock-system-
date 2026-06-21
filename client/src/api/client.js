// Thin wrapper around fetch for the stock-system API, with JWT auth support.
const BASE = '/api';
const TOKEN_KEY = 'stocksys.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

// Invoked when a request comes back 401 so the app can drop to the login screen.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, options = {}) {
  const token = tokenStore.get();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });

  if (res.status === 401) {
    tokenStore.clear();
    onUnauthorized();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.details?.[0]?.message;
    throw new Error(detail || data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Auth
  register: (email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  me: () => request('/auth/me'),

  // Market & trading
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
  getWatchlist: () => request('/watchlist'),
  addWatch: (symbol) =>
    request('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol })
    }),
  removeWatch: (symbol) => request(`/watchlist/${symbol}`, { method: 'DELETE' }),

  // Limit orders
  getOrders: () => request('/orders'),
  placeOrder: (order) =>
    request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  cancelOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' })
};

// Subscribe to the live quote stream (Server-Sent Events). Returns an
// unsubscribe function. Falls back silently if the connection drops; the
// browser EventSource reconnects automatically.
export function subscribeQuotes(onQuotes) {
  const source = new EventSource(`${BASE}/stream`);
  source.addEventListener('tick', (e) => {
    try {
      onQuotes(JSON.parse(e.data));
    } catch {
      /* ignore malformed frames */
    }
  });
  return () => source.close();
}

export function formatMoney(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(n ?? 0);
}
