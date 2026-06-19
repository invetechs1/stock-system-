import { formatMoney } from '../api/client.js';

export default function PortfolioSummary({ portfolio }) {
  if (!portfolio) return null;
  return (
    <div className="summary">
      <div className="stat">
        <span className="label">Total Value</span>
        <span className="value">{formatMoney(portfolio.totalValue)}</span>
      </div>
      <div className="stat">
        <span className="label">Cash</span>
        <span className="value">{formatMoney(portfolio.cash)}</span>
      </div>
      <div className="stat">
        <span className="label">Holdings Value</span>
        <span className="value">{formatMoney(portfolio.holdingsValue)}</span>
      </div>
    </div>
  );
}
