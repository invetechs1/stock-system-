import { formatMoney } from '../api/client.js';

export default function Orders({ orders, onCancel }) {
  if (!orders.length)
    return <p className="muted">No limit orders. Place one from the Buy/Sell dialog.</p>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Side</th>
          <th>Symbol</th>
          <th className="num">Shares</th>
          <th className="num">Limit</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>
              <span className={`tag ${o.side === 'BUY' ? 'buy' : 'sell'}`}>
                {o.side}
              </span>
            </td>
            <td>
              <strong>{o.symbol}</strong>
            </td>
            <td className="num">{o.shares}</td>
            <td className="num">{formatMoney(o.limitPrice)}</td>
            <td>
              <span className={`status ${o.status.toLowerCase()}`}>
                {o.status}
                {o.status === 'FILLED' && o.fillPrice
                  ? ` @ ${formatMoney(o.fillPrice)}`
                  : ''}
              </span>
            </td>
            <td className="actions">
              {o.status === 'PENDING' ? (
                <button className="btn small ghost" onClick={() => onCancel(o.id)}>
                  Cancel
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
