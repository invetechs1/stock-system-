import { formatMoney } from '../api/client.js';

export default function Holdings({ positions, onSell }) {
  if (!positions.length)
    return <p className="muted">No positions yet. Buy a stock to get started.</p>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th className="num">Shares</th>
          <th className="num">Avg Cost</th>
          <th className="num">Value</th>
          <th className="num">Gain/Loss</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p) => {
          const up = p.gain >= 0;
          return (
            <tr key={p.symbol}>
              <td>
                <strong>{p.symbol}</strong>
              </td>
              <td className="num">{p.shares}</td>
              <td className="num">{formatMoney(p.avgCost)}</td>
              <td className="num">{formatMoney(p.marketValue)}</td>
              <td className={`num ${up ? 'pos' : 'neg'}`}>
                {formatMoney(p.gain)} ({p.gainPercent.toFixed(2)}%)
              </td>
              <td className="actions">
                <button className="btn small ghost" onClick={() => onSell(p)}>
                  Sell
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
