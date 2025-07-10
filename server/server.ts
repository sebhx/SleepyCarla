import express from 'express';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import userSettingsRoutes from './routes/user-settings.js';
import sleepSessionsRoutes from './routes/sleep-sessions.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Production-ready CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN?.split(',') || true
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}

// Routes
// Removed legacy /api/sleep route - now using /api/sleep-sessions
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/sleep-sessions', sleepSessionsRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SleepyCarla is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SleepyCarla API is running' });
});

// Serve static files from the Vue app build
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌙 SleepyCarla API server running on port ${PORT}`);
});

export default app;
