import { formatMoney } from '../api/client.js';

export default function Transactions({ transactions }) {
  if (!transactions.length)
    return <p className="muted">No trades yet.</p>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Symbol</th>
          <th className="num">Shares</th>
          <th className="num">Price</th>
          <th className="num">Total</th>
          <th>When</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t.id}>
            <td>
              <span className={`tag ${t.type === 'BUY' ? 'buy' : 'sell'}`}>
                {t.type}
              </span>
            </td>
            <td>
              <strong>{t.symbol}</strong>
            </td>
            <td className="num">{t.shares}</td>
            <td className="num">{formatMoney(t.price)}</td>
            <td className="num">{formatMoney(t.total)}</td>
            <td className="muted small">
              {new Date(t.timestamp).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
