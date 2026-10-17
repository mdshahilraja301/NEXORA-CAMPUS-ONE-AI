require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const foodRoutes = require('./routes/food');
const campusRoutes = require('./routes/campus');
const assistantRoutes = require('./routes/assistant');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'NEXØRA Campus One AI API' }));
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/assistant', assistantRoutes);
app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: 'This record already exists.' });
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: 'Please check the submitted data.' });
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const port = Number(process.env.PORT || 5000);
async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) throw new Error('Set MONGODB_URI and JWT_SECRET in backend/.env.');
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, '0.0.0.0', () => console.log(`NEXØRA API running on port ${port}`));
}
start().catch(error => { console.error('Startup failed:', error.message); process.exit(1); });
