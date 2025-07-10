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
const distPath = path.join(__dirname, 'dist');
console.log('Checking dist path:', distPath);

let distExists = false;
try {
  const fs = require('fs');
  distExists = fs.existsSync(distPath);
  console.log('Dist directory exists:', distExists);
  
  if (distExists) {
    const files = fs.readdirSync(distPath);
    console.log('Files in dist:', files.slice(0, 10)); // Show first 10 files
  } else {
    console.log('⚠️  Dist directory not found - will serve fallback content');
  }
} catch (error) {
  console.error('Error checking dist directory:', error);
}

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoints - always respond OK for Railway deployment
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    message: 'SleepyCarla server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    port: PORT,
    distExists: distExists
  });
});

app.get('/api/health', (req, res) => {
  console.log('API health check requested');
  res.json({ 
    status: 'ok', 
    message: 'SleepyCarla API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    port: PORT,
    distExists: distExists
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
    const currentDirFiles = fs.readdirSync(__dirname);
    const distPath1 = path.join(__dirname, 'dist');
    const distPath2 = path.join(process.cwd(), 'dist');
    
    res.json({
      __dirname,
      workingDir: process.cwd(),
      currentDirFiles: currentDirFiles.slice(0, 20),
      distPath: distPath,
      distPath1,
      distPath2,
      distExists: fs.existsSync(distPath),
      distExists1: fs.existsSync(distPath1),
      distExists2: fs.existsSync(distPath2),
      files: fs.existsSync(distPath) ? fs.readdirSync(distPath).slice(0, 20) : [],
      indexExists: fs.existsSync(path.join(distPath, 'index.html'))
    });
  } catch (error) {
    res.json({
      error: error.message,
      __dirname,
      workingDir: process.cwd()
    });
  }
});

// Serve static files from the Vue app build (if it exists)
console.log('Setting up static file serving for:', distPath);
if (distExists) {
  app.use(express.static(distPath));
} else {
  console.log('⚠️  Skipping static file serving - dist directory not found');
}

// Handle all other routes - return index.html or fallback
app.get('*', (req, res) => {
  // Re-check dist existence in case it was created after server start
  const fs = require('fs');
  const currentDistExists = fs.existsSync(distPath);
  const indexPath = path.join(distPath, 'index.html');
  
  console.log('Serving request for:', req.path);
  console.log('Current dist exists:', currentDistExists);
  
  if (currentDistExists && fs.existsSync(indexPath)) {
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath);
  } else {
    console.log('Serving fallback HTML - dist or index.html not found');
    res.status(200).send(`
      <html>
        <head>
          <title>🌙 SleepyCarla - Building...</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                   text-align: center; padding: 2rem; background: #f0f8ff; }
            .container { max-width: 600px; margin: 0 auto; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; 
                      border-radius: 50%; width: 40px; height: 40px; 
                      animation: spin 2s linear infinite; margin: 20px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .links { margin: 2rem 0; }
            .links a { margin: 0 1rem; padding: 0.5rem 1rem; background: #3498db; 
                      color: white; text-decoration: none; border-radius: 4px; }
          </style>
          <script>
            setTimeout(() => { window.location.reload(); }, 10000);
          </script>
        </head>
        <body>
          <div class="container">
            <h1>🌙 SleepyCarla</h1>
            <div class="spinner"></div>
            <p>Application is starting up...</p>
            <p>The frontend is being built and will be available shortly.</p>
            <p><small>This page will refresh automatically in 10 seconds.</small></p>
            <div class="links">
              <a href="/health">Health Check</a>
              <a href="/debug">Debug Info</a>
              <a href="/test">Test API</a>
            </div>
          </div>
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
