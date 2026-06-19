import { formatMoney } from '../api/client.js';

export default function Watchlist({ items, onRemove }) {
  if (!items.length)
    return <p className="muted">Star stocks in the market to watch them here.</p>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th className="num">Price</th>
          <th className="num">Change</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => {
          const up = s.change >= 0;
          return (
            <tr key={s.symbol}>
              <td>
                <strong>{s.symbol}</strong>
                <div className="muted small">{s.name}</div>
              </td>
              <td className="num">{formatMoney(s.price)}</td>
              <td className={`num ${up ? 'pos' : 'neg'}`}>
                {up ? '▲' : '▼'} {Math.abs(s.changePercent).toFixed(2)}%
              </td>
              <td className="actions">
                <button
                  className="btn small ghost"
                  onClick={() => onRemove(s.symbol)}
                >
                  ✕
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
