const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

console.log('🚀 Starting SleepyCarla server (JavaScript)...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);
console.log('__dirname:', __dirname);

// Check if dist folder exists
const distPath = path.join(__dirname, '..', 'dist');
console.log('Checking dist path:', distPath);

try {
  const fs = require('fs');
  const distExists = fs.existsSync(distPath);
  console.log('Dist directory exists:', distExists);
  
  if (distExists) {
    const files = fs.readdirSync(distPath);
    console.log('Files in dist:', files.slice(0, 10)); // Show first 10 files
  }
} catch (error) {
  console.error('Error checking dist directory:', error);
}

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    message: 'SleepyCarla is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    port: PORT
  });
});

app.get('/api/health', (req, res) => {
  console.log('API health check requested');
  res.json({ 
    status: 'ok', 
    message: 'SleepyCarla API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    port: PORT
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Debug endpoint to check what files exist
app.get('/debug', (req, res) => {
  const fs = require('fs');
  try {
    const files = fs.existsSync(distPath) ? fs.readdirSync(distPath) : [];
    res.json({
      distPath,
      distExists: fs.existsSync(distPath),
      files: files.slice(0, 20), // Show first 20 files
      indexExists: fs.existsSync(path.join(distPath, 'index.html')),
      workingDir: process.cwd()
    });
  } catch (error) {
    res.json({
      error: error.message,
      distPath,
      workingDir: process.cwd()
    });
  }
});

// Serve static files from the Vue app build
console.log('Setting up static file serving for:', distPath);
app.use(express.static(distPath));

// Handle all other routes - return index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  
  // Check if index.html exists
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('index.html not found at:', indexPath);
    res.status(404).send(`
      <html>
        <head><title>SleepyCarla - Setup Required</title></head>
        <body>
          <h1>🌙 SleepyCarla</h1>
          <p>The app is running, but the frontend build files are missing.</p>
          <p>This usually means the build process didn't complete properly.</p>
          <p><a href="/health">Check Health Status</a></p>
          <p><a href="/test">Test API</a></p>
        </body>
      </html>
    `);
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌙 SleepyCarla server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
