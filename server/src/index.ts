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
import plan1SubscriptionRouter from './routes/plan1Subscription';
import plan2AuthRouter from './routes/plan2Auth';
import plan2UserRouter from './routes/plan2User';
import adminPlan2Router from './routes/adminPlan2';
import { errorHandler } from './middleware/errorHandler';
import { antiFraud } from './middleware/rateLimiter';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';
// Origins from env plus the Capacitor/Ionic WebView origins used when the app
// is wrapped as a native Android/iOS build. These are fixed by the framework
// and aren't configurable at deploy time, so they're hard-coded here.
const capacitorOrigins = [
  'https://localhost',    // Capacitor Android default
  'capacitor://localhost', // Capacitor iOS default
  'ionic://localhost',    // legacy Ionic
  'http://localhost',     // dev / live-reload
];
const allowedOrigins = [
  ...(process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim()),
  ...capacitorOrigins,
];
app.use(cors({
  origin: (origin, cb) => {
    if (isDev || !origin || allowedOrigins.some(o => origin.startsWith(o))) {
      cb(null, true);
    } else {
      cb(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(antiFraud);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRouter);
app.use('/api/users',        usersRouter);
app.use('/api/network',      networkRouter);
app.use('/api/joining',      joiningRouter);
app.use('/api/wallet',       walletRouter);
app.use('/api/products',     productsRouter);
app.use('/api/orders',       ordersRouter);
app.use('/api/admin',        adminRouter);
app.use('/api/vendor',       vendorRouter);

// Plan 1 — Monthly Subscription (₹250/month)
app.use('/api/plan1',        plan1SubscriptionRouter);

// Plan 3 — Investment Program (internal routes still use plan2/* prefix for backwards compat)
app.use('/api/plan2/auth',   plan2AuthRouter);
app.use('/api/plan2',        plan2UserRouter);
app.use('/api/admin/plan2',  adminPlan2Router);

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Plan-I Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
