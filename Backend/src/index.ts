import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import chamadoRoutes from './routes/chamado.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const BODY_LIMIT = process.env.BODY_LIMIT || '10mb';

// Security
app.use(helmet());

// CORS — aceita múltiplas origens separadas por vírgula no .env
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (ex: Insomnia, curl) e origens configuradas
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origem não permitida — ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chamados', chamadoRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
