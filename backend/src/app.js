require('dotenv').config(); // Loaded env v2
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('./config/database'); // just require, no connectDB call
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, message: 'Too many requests.' } }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/api/v1/health', (_, res) => res.json({ success: true, message: 'BFHE API v2 running', version: '2.0.0' }));

// Core routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/financial-profile', require('./routes/financialProfile'));
app.use('/api/v1/loans', require('./routes/loans'));
app.use('/api/v1/scores', require('./routes/scores'));
app.use('/api/v1/recommendations', require('./routes/recommendations'));

// New feature routes
app.use('/api/v1/goals', require('./routes/goals'));
app.use('/api/v1/net-worth', require('./routes/netWorth'));
app.use('/api/v1/budget', require('./routes/budget'));
app.use('/api/v1/simulation', require('./routes/simulation'));
// Fix: import alertsRouter directly (was using destructuring from a named export)
app.use('/api/v1/alerts', require('./routes/alerts'));
app.use('/api/v1/inflation', require('./routes/inflation'));
app.use('/api/v1/ai', require('./routes/ai'));
app.use('/api/v1/tax', require('./routes/tax'));

app.use('*', (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

// Only start local server if run directly (Vercel imports it instead)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => console.log(`🚀 BFHE v2 Server running on port ${PORT}`));
  process.on('unhandledRejection', (err) => { console.error(err); server.close(() => process.exit(1)); });
}

module.exports = app;
