import { randomUUID } from 'node:crypto';
import { db } from '../db/index.js';
import { round2 } from '../utils/money.js';
import { badRequest, notFound } from '../utils/errors.js';
import { buy, sell } from './portfolioService.js';
import { logger } from '../logger.js';

const getStock = db.prepare('SELECT * FROM stocks WHERE symbol = ?');
const insertOrder = db.prepare(`
  INSERT INTO orders (id, user_id, side, symbol, shares, limit_price, status, created_at)
  VALUES (@id, @user_id, @side, @symbol, @shares, @limit_price, 'PENDING', @created_at)
`);
const listOrders = db.prepare(
  'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
);
const getOrder = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?');
const cancelStmt = db.prepare(
  "UPDATE orders SET status = 'CANCELLED' WHERE id = ? AND status = 'PENDING'"
);
const allPending = db.prepare("SELECT * FROM orders WHERE status = 'PENDING'");
const markFilled = db.prepare(
  "UPDATE orders SET status = 'FILLED', fill_price = ?, filled_at = ? WHERE id = ?"
);

function view(o) {
  return {
    id: o.id,
    side: o.side,
    symbol: o.symbol,
    shares: o.shares,
    limitPrice: round2(o.limit_price),
    status: o.status,
    fillPrice: o.fill_price != null ? round2(o.fill_price) : null,
    createdAt: o.created_at,
    filledAt: o.filled_at
  };
}

export function placeOrder(userId, { side, symbol, shares, limitPrice }) {
  if (!getStock.get(symbol)) throw notFound('Stock not found');
  // A SELL limit only makes sense if the user could eventually hold the shares;
  // we don't reserve them, but reject obviously invalid prices up front.
  if (limitPrice <= 0) throw badRequest('limitPrice must be positive');

  const order = {
    id: randomUUID(),
    user_id: userId,
    side,
    symbol,
    shares,
    limit_price: limitPrice,
    created_at: Date.now()
  };
  insertOrder.run(order);
  return view({ ...order, status: 'PENDING', fill_price: null, filled_at: null });
}

export function getOrders(userId, limit = 100) {
  return listOrders.all(userId, limit).map(view);
}

export function cancelOrder(userId, id) {
  const existing = getOrder.get(id, userId);
  if (!existing) throw notFound('Order not found');
  if (existing.status !== 'PENDING') {
    throw badRequest(`Cannot cancel a ${existing.status.toLowerCase()} order`);
  }
  cancelStmt.run(id);
  return view(getOrder.get(id, userId));
}

// Whether a pending order's limit condition is satisfied at the given price.
function isTriggered(order, price) {
  return order.side === 'BUY' ? price <= order.limit_price : price >= order.limit_price;
}

// Called by the simulator after each price tick. Fills every pending order
// whose limit has triggered and that the user can afford / has shares for.
// Returns the number of orders filled.
export function processPendingOrders() {
  let filled = 0;
  for (const order of allPending.all()) {
    const stock = getStock.get(order.symbol);
    if (!stock || !isTriggered(order, stock.price)) continue;
    try {
      // Reuse the same transactional execution as market orders; fill price is
      // the current market price (at least as good as the limit).
      if (order.side === 'BUY') buy(order.user_id, order.symbol, order.shares);
      else sell(order.user_id, order.symbol, order.shares);
      markFilled.run(stock.price, Date.now(), order.id);
      filled += 1;
    } catch (err) {
      // Insufficient funds/shares right now — leave the order pending so it can
      // fill on a later tick once the account can support it.
      logger.debug('Order not fillable yet', { id: order.id, reason: err.message });
    }
  }
  return filled;
}
