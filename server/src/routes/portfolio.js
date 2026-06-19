import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { getState, save, resetState } from '../store.js';

const router = Router();

function findStock(symbol) {
  return getState().stocks.find((s) => s.symbol === symbol);
}

// Build an enriched portfolio view: holdings valued at current prices,
// plus totals and unrealized P/L.
function portfolioView() {
  const state = getState();
  const { cash, holdings } = state.portfolio;

  const positions = Object.entries(holdings).map(([symbol, pos]) => {
    const stock = findStock(symbol);
    const price = stock ? stock.price : pos.avgCost;
    const marketValue = price * pos.shares;
    const costBasis = pos.avgCost * pos.shares;
    const gain = marketValue - costBasis;
    return {
      symbol,
      name: stock ? stock.name : symbol,
      shares: pos.shares,
      avgCost: Math.round(pos.avgCost * 100) / 100,
      price: Math.round(price * 100) / 100,
      marketValue: Math.round(marketValue * 100) / 100,
      gain: Math.round(gain * 100) / 100,
      gainPercent: costBasis ? Math.round((gain / costBasis) * 10000) / 100 : 0
    };
  });

  const holdingsValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalValue = cash + holdingsValue;

  return {
    cash: Math.round(cash * 100) / 100,
    holdingsValue: Math.round(holdingsValue * 100) / 100,
    totalValue: Math.round(totalValue * 100) / 100,
    positions
  };
}

// GET /api/portfolio - current portfolio with live valuation.
router.get('/', (req, res) => {
  res.json(portfolioView());
});

// POST /api/portfolio/buy { symbol, shares }
router.post('/buy', (req, res) => {
  const symbol = String(req.body.symbol || '').toUpperCase();
  const shares = Number(req.body.shares);

  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  if (!Number.isInteger(shares) || shares <= 0) {
    return res.status(400).json({ error: 'shares must be a positive integer' });
  }

  const stock = findStock(symbol);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });

  const state = getState();
  const cost = stock.price * shares;
  if (cost > state.portfolio.cash) {
    return res.status(400).json({
      error: 'Insufficient funds',
      required: Math.round(cost * 100) / 100,
      cash: Math.round(state.portfolio.cash * 100) / 100
    });
  }

  state.portfolio.cash -= cost;
  const existing = state.portfolio.holdings[symbol];
  if (existing) {
    const totalShares = existing.shares + shares;
    existing.avgCost =
      (existing.avgCost * existing.shares + stock.price * shares) / totalShares;
    existing.shares = totalShares;
  } else {
    state.portfolio.holdings[symbol] = { shares, avgCost: stock.price };
  }

  state.transactions.unshift({
    id: randomUUID(),
    type: 'BUY',
    symbol,
    shares,
    price: stock.price,
    total: Math.round(cost * 100) / 100,
    timestamp: Date.now()
  });

  save();
  res.json(portfolioView());
});

// POST /api/portfolio/sell { symbol, shares }
router.post('/sell', (req, res) => {
  const symbol = String(req.body.symbol || '').toUpperCase();
  const shares = Number(req.body.shares);

  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  if (!Number.isInteger(shares) || shares <= 0) {
    return res.status(400).json({ error: 'shares must be a positive integer' });
  }

  const stock = findStock(symbol);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });

  const state = getState();
  const pos = state.portfolio.holdings[symbol];
  if (!pos || pos.shares < shares) {
    return res.status(400).json({
      error: 'Not enough shares to sell',
      held: pos ? pos.shares : 0
    });
  }

  const proceeds = stock.price * shares;
  state.portfolio.cash += proceeds;
  pos.shares -= shares;
  if (pos.shares === 0) delete state.portfolio.holdings[symbol];

  state.transactions.unshift({
    id: randomUUID(),
    type: 'SELL',
    symbol,
    shares,
    price: stock.price,
    total: Math.round(proceeds * 100) / 100,
    timestamp: Date.now()
  });

  save();
  res.json(portfolioView());
});

// GET /api/portfolio/transactions - trade history (most recent first).
router.get('/transactions', (req, res) => {
  res.json(getState().transactions);
});

// POST /api/portfolio/reset - reset cash, holdings and history.
router.post('/reset', (req, res) => {
  resetState();
  res.json(portfolioView());
});

export default router;
