import { Router } from 'express';
import { getState } from '../store.js';

const router = Router();

function withChange(stock) {
  const change = stock.price - stock.prevClose;
  const changePercent = stock.prevClose ? (change / stock.prevClose) * 100 : 0;
  return {
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    prevClose: stock.prevClose,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    updatedAt: stock.updatedAt
  };
}

// GET /api/stocks - list all tradable stocks with live prices.
router.get('/', (req, res) => {
  const { stocks } = getState();
  res.json(stocks.map(withChange));
});

// GET /api/stocks/:symbol - single stock quote.
router.get('/:symbol', (req, res) => {
  const { stocks } = getState();
  const stock = stocks.find(
    (s) => s.symbol === req.params.symbol.toUpperCase()
  );
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  res.json(withChange(stock));
});

export default router;
