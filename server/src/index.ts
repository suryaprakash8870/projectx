import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import networkRouter from './routes/network';
import joiningRouter from './routes/joining';
import walletRouter from './routes/wallet';
import { productsRouter, ordersRouter } from './routes/productsOrders';
import adminRouter from './routes/admin';
import vendorRouter from './routes/vendor';
import { errorHandler } from './middleware/errorHandler';
import { antiFraud } from './middleware/rateLimiter';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(antiFraud);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRouter);
app.use('/api/users',    usersRouter);
app.use('/api/network',  networkRouter);
app.use('/api/joining',  joiningRouter);
app.use('/api/wallet',   walletRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders',   ordersRouter);
app.use('/api/admin',    adminRouter);
app.use('/api/vendor',   vendorRouter);

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Plan-I Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
