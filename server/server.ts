import express from 'express';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Add error handling for startup
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('🚀 Starting SleepyCarla server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);

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

// Health check endpoints (no database dependency)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SleepyCarla is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SleepyCarla API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// Basic info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'SleepyCarla API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Try to import routes, but don't fail if they have issues
try {
  const userSettingsRoutes = await import('./routes/user-settings.js');
  const sleepSessionsRoutes = await import('./routes/sleep-sessions.js');
  
  app.use('/api/user-settings', userSettingsRoutes.default);
  app.use('/api/sleep-sessions', sleepSessionsRoutes.default);
  console.log('✅ API routes loaded successfully');
} catch (error) {
  console.warn('⚠️  API routes failed to load:', error.message);
  console.warn('Server will continue without API routes');
}

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
