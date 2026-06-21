import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import PortfolioSummary from './PortfolioSummary.jsx';
import Market from './Market.jsx';
import Holdings from './Holdings.jsx';
import Watchlist from './Watchlist.jsx';
import Transactions from './Transactions.jsx';
import TradeModal from './TradeModal.jsx';

const REFRESH_MS = 3000;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [trade, setTrade] = useState(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [s, p, w, t] = await Promise.all([
        api.getStocks(),
        api.getPortfolio(),
        api.getWatchlist(),
        api.getTransactions()
      ]);
      setStocks(s);
      setPortfolio(p);
      setWatchlist(w);
      setTransactions(t);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const handleTrade = async (mode, symbol, shares) => {
    if (mode === 'BUY') await api.buy(symbol, shares);
    else await api.sell(symbol, shares);
    setTrade(null);
    await refresh();
  };

  const toggleWatch = async (symbol, watched) => {
    if (watched) await api.removeWatch(symbol);
    else await api.addWatch(symbol);
    await refresh();
  };

  const watchedSymbols = new Set(watchlist.map((w) => w.symbol));

  return (
    <div className="app">
      <header className="topbar">
        <h1>📈 Stock Trading System</h1>
        <div className="topbar-right">
          <span className="muted small">{user?.email}</span>
          <button className="btn ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}

      <PortfolioSummary portfolio={portfolio} />

      <div className="grid">
        <section className="panel">
          <h2>Market</h2>
          <Market
            stocks={stocks}
            watchedSymbols={watchedSymbols}
            onTrade={(stock) => setTrade({ stock, mode: 'BUY' })}
            onToggleWatch={toggleWatch}
          />
        </section>

        <section className="panel">
          <h2>Holdings</h2>
          <Holdings
            positions={portfolio?.positions || []}
            onSell={(pos) =>
              setTrade({
                stock: { symbol: pos.symbol, name: pos.name, price: pos.price },
                mode: 'SELL',
                maxShares: pos.shares
              })
            }
          />
        </section>

        <section className="panel">
          <h2>Watchlist</h2>
          <Watchlist items={watchlist} onRemove={(symbol) => toggleWatch(symbol, true)} />
        </section>

        <section className="panel">
          <h2>Trade History</h2>
          <Transactions transactions={transactions} />
        </section>
      </div>

      {trade && (
        <TradeModal
          trade={trade}
          cash={portfolio?.cash || 0}
          onClose={() => setTrade(null)}
          onSubmit={handleTrade}
        />
      )}
    </div>
  );
}
