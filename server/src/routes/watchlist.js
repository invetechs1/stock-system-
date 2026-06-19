import { Router } from 'express';
import { getState, save } from '../store.js';

const router = Router();

// GET /api/watchlist - watched symbols with their current quotes.
router.get('/', (req, res) => {
  const state = getState();
  const items = state.watchlist
    .map((symbol) => {
      const stock = state.stocks.find((s) => s.symbol === symbol);
      if (!stock) return null;
      const change = stock.price - stock.prevClose;
      return {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: Math.round(change * 100) / 100,
        changePercent: stock.prevClose
          ? Math.round((change / stock.prevClose) * 10000) / 100
          : 0
      };
    })
    .filter(Boolean);
  res.json(items);
});

// POST /api/watchlist { symbol }
router.post('/', (req, res) => {
  const symbol = String(req.body.symbol || '').toUpperCase();
  const state = getState();
  if (!state.stocks.some((s) => s.symbol === symbol)) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  if (!state.watchlist.includes(symbol)) {
    state.watchlist.push(symbol);
    save();
  }
  res.status(201).json(state.watchlist);
});

// DELETE /api/watchlist/:symbol
router.delete('/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const state = getState();
  state.watchlist = state.watchlist.filter((s) => s !== symbol);
  save();
  res.json(state.watchlist);
});

export default router;
