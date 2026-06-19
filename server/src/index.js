import express from 'express';
import cors from 'cors';
import { load, saveNow } from './store.js';
import { startSimulator, stopSimulator } from './services/priceSimulator.js';
import stocksRouter from './routes/stocks.js';
import portfolioRouter from './routes/portfolio.js';
import watchlistRouter from './routes/watchlist.js';

const PORT = process.env.PORT || 4000;

load();
startSimulator(Number(process.env.TICK_MS) || 3000);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.use('/api/stocks', stocksRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/watchlist', watchlistRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const server = app.listen(PORT, () => {
  console.log(`Stock system API listening on http://localhost:${PORT}`);
});

function shutdown() {
  stopSimulator();
  saveNow();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
