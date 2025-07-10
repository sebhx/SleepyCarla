#!/usr/bin/env node

// Railway startup script for SleepyCarla
// This ensures Railway properly detects and runs the Node.js server

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting SleepyCarla server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || '3000');
console.log('Working directory:', process.cwd());

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
console.log('Checking dist path:', distPath);

if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory not found. Build may have failed.');
  console.log('Contents of current directory:');
  fs.readdirSync(__dirname).forEach(file => {
    console.log('  ', file);
  });
  process.exit(1);
} else {
  console.log('✅ dist directory found');
}

// Use the simple JavaScript server
const command = 'node';
const args = ['server.cjs'];

console.log(`Running: ${command} ${args.join(' ')}`);

// Start the server
const server = spawn(command, args, {
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
