import { useState } from 'react';
import { formatMoney } from '../api/client.js';

export default function TradeModal({ trade, cash, onClose, onSubmit }) {
  const { stock, mode, maxShares } = trade;
  const [shares, setShares] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const qty = Number(shares) || 0;
  const estimate = qty * stock.price;
  const affordable = mode === 'BUY' ? estimate <= cash : true;
  const enoughShares = mode === 'SELL' ? qty <= (maxShares ?? Infinity) : true;
  const valid = qty > 0 && Number.isInteger(qty) && affordable && enoughShares;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(mode, stock.symbol, qty);
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

        <form onSubmit={submit}>
          <label>
            Shares
            <input
              type="number"
              min="1"
              step="1"
              max={mode === 'SELL' ? maxShares : undefined}
              value={shares}
              autoFocus
              onChange={(e) => setShares(e.target.value)}
            />
          </label>
          {mode === 'SELL' && (
            <p className="muted small">You hold {maxShares} shares</p>
          )}

          <div className="estimate">
            <span>Estimated {mode === 'BUY' ? 'cost' : 'proceeds'}</span>
            <strong>{formatMoney(estimate)}</strong>
          </div>

          {mode === 'BUY' && !affordable && (
            <p className="neg small">Not enough cash ({formatMoney(cash)} available)</p>
          )}
          {error && <p className="neg small">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={!valid || submitting}>
              {submitting ? '…' : `Confirm ${mode}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
