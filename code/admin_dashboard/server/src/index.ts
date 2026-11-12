import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV, getConnectionSummary } from './config/env';
import authRoutes from './routes/auth.routes';
import modulesRoutes from './routes/modules.routes';
import { DbService } from './services/db.service';

const app = express();

// 1. Enterprise HTTP Security Headers
app.use(helmet());

// 2. Strict CORS Policy
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// 3. Body Parser with payload size limit to prevent DoS
app.use(express.json({ limit: '50kb' }));

// 4. Rate Limiting on Authentication Endpoint (Brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMITED',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'RideTrace Enterprise Provisioning API',
    security: getConnectionSummary(),
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/modules', modulesRoutes);

app.listen(ENV.PORT, () => {
  console.log('==============================================================');
  console.log(`🛡️  RideTrace Enterprise Security API running on Port ${ENV.PORT}`);
  console.log(`🔒 Zero-Leak Mode: Database credentials isolated in server/.env`);
  console.log(`👤 Default Admin:  ${ENV.ADMIN_EMAIL}`);
  console.log('==============================================================');
  DbService.syncAllToCloud().catch((err) => console.warn('[Initial Cloud Sync Warning]', err));
});
