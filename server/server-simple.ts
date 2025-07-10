import express from 'express';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

console.log('🚀 Starting SleepyCarla server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);

// Basic CORS
app.use(cors());
app.use(express.json());

// Health check endpoints
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

// Serve static files from the Vue app build
app.use(express.static(path.join(__dirname, '../dist')));

// Handle all other routes - return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌙 SleepyCarla server running on port ${PORT}`);
});

export default app;
