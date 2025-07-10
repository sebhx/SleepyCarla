#!/usr/bin/env node

// Railway startup script for SleepyCarla
// This ensures Railway properly builds the frontend and runs the server

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting SleepyCarla deployment...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || '3000');
console.log('Working directory:', process.cwd());

// Function to run build
function runBuild() {
  return new Promise((resolve, reject) => {
    console.log('📦 Building frontend...');
    const buildProcess = spawn('npm', ['run', 'build'], { 
      stdio: 'inherit',
      shell: true 
    });

    buildProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Frontend build failed with code:', code);
        reject(new Error(`Build failed with code ${code}`));
      } else {
        console.log('✅ Frontend build completed');
        resolve();
      }
    });

    buildProcess.on('error', (error) => {
      console.error('❌ Build process error:', error);
      reject(error);
    });
  });
}

// Function to verify build artifacts
function verifyBuildArtifacts() {
  const distPath = path.join(__dirname, 'dist');
  console.log('Verifying build artifacts at:', distPath);
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist directory not found after build');
    return false;
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in dist directory');
    return false;
  }
  
  console.log('✅ Build artifacts verified');
  return true;
}

// Function to start server
function startServer() {
  console.log('🚀 Starting server...');
  
  const server = spawn('node', ['server.cjs'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  server.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
  });

  server.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    server.kill('SIGINT');
  });
}

// Main execution
async function main() {
  try {
    // Check if dist already exists (pre-built)
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      console.log('✅ dist directory already exists, skipping build');
    } else {
      // Run build
      await runBuild();
    }
    
    // Verify build artifacts
    if (!verifyBuildArtifacts()) {
      process.exit(1);
    }
    
    // Start server
    startServer();
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

main();