import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import './config/db'; // SQLite auto-initializes on import
import wordbookRoutes from './routes/wordbook';
import learnRoutes from './routes/learn';
import testRoutes from './routes/test';
import errorHandler from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '研词 API is running', timestamp: new Date().toISOString() });
});

app.use('/api/wordbooks', wordbookRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/test', testRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`SQLite database initialized`);
});

export default app;
