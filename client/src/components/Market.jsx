import { formatMoney } from '../api/client.js';

export default function Market({ stocks, watchedSymbols, onTrade, onToggleWatch }) {
  if (!stocks.length) return <p className="muted">Loading market…</p>;
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
        {stocks.map((s) => {
          const up = s.change >= 0;
          const watched = watchedSymbols.has(s.symbol);
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
                <button className="btn small" onClick={() => onTrade(s)}>
                  Buy
                </button>
                <button
                  className={`btn small ghost ${watched ? 'active' : ''}`}
                  title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                  onClick={() => onToggleWatch(s.symbol, watched)}
                >
                  {watched ? '★' : '☆'}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
