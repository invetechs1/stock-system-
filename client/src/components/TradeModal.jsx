import { useState } from 'react';
import { formatMoney } from '../api/client.js';

// Handles both immediate market trades and resting limit orders.
export default function TradeModal({ trade, cash, onClose, onMarket, onLimit }) {
  const { stock, mode, maxShares } = trade;
  const [orderType, setOrderType] = useState('MARKET'); // 'MARKET' | 'LIMIT'
  const [shares, setShares] = useState(1);
  const [limitPrice, setLimitPrice] = useState(stock.price);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const qty = Number(shares) || 0;
  const limit = Number(limitPrice) || 0;
  const unitPrice = orderType === 'LIMIT' ? limit : stock.price;
  const estimate = qty * unitPrice;

  const affordable = mode === 'BUY' ? estimate <= cash : true;
  const enoughShares = mode === 'SELL' ? qty <= (maxShares ?? Infinity) : true;
  const validQty = qty > 0 && Number.isInteger(qty);
  const validLimit = orderType === 'MARKET' || limit > 0;
  // Market trades are checked against funds/shares now; limit orders are
  // validated by the engine at fill time, so we only sanity-check inputs.
  const valid =
    validQty &&
    validLimit &&
    (orderType === 'LIMIT' || (affordable && enoughShares));

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      if (orderType === 'MARKET') {
        await onMarket(mode, stock.symbol, qty);
      } else {
        await onLimit({ side: mode, symbol: stock.symbol, shares: qty, limitPrice: limit });
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          {mode === 'BUY' ? 'Buy' : 'Sell'} {stock.symbol}
        </h3>
        <p className="muted">
          {stock.name} · {formatMoney(stock.price)} / share
        </p>

        <div className="segmented">
          <button
            type="button"
            className={orderType === 'MARKET' ? 'active' : ''}
            onClick={() => setOrderType('MARKET')}
          >
            Market
          </button>
          <button
            type="button"
            className={orderType === 'LIMIT' ? 'active' : ''}
            onClick={() => setOrderType('LIMIT')}
          >
            Limit
          </button>
        </div>

        <form onSubmit={submit}>
          <label>
            Shares
            <input
              type="number"
              min="1"
              step="1"
              max={mode === 'SELL' && orderType === 'MARKET' ? maxShares : undefined}
              value={shares}
              autoFocus
              onChange={(e) => setShares(e.target.value)}
            />
          </label>

          {orderType === 'LIMIT' && (
            <label>
              Limit price
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
              />
            </label>
          )}

          {mode === 'SELL' && (
            <p className="muted small">You hold {maxShares} shares</p>
          )}

          <div className="estimate">
            <span>
              {orderType === 'LIMIT' ? 'Order' : 'Estimated'}{' '}
              {mode === 'BUY' ? 'cost' : 'proceeds'}
            </span>
            <strong>{formatMoney(estimate)}</strong>
          </div>

          {orderType === 'LIMIT' && (
            <p className="muted small">
              Fills automatically when {stock.symbol}{' '}
              {mode === 'BUY' ? 'drops to' : 'reaches'} {formatMoney(limit)}.
            </p>
          )}
          {orderType === 'MARKET' && mode === 'BUY' && !affordable && (
            <p className="neg small">
              Not enough cash ({formatMoney(cash)} available)
            </p>
          )}
          {error && <p className="neg small">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={!valid || submitting}>
              {submitting
                ? '…'
                : orderType === 'LIMIT'
                  ? `Place ${mode} order`
                  : `Confirm ${mode}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
