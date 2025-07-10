#!/usr/bin/env node

// Railway startup script for SleepyCarla
// This ensures Railway properly detects and runs the Node.js server

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting SleepyCarla server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || '3000');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory not found. Build may have failed.');
  process.exit(1);
}

// Try tsx first, fall back to node if tsx is not available
let command, args;

if (fs.existsSync(path.join(__dirname, 'node_modules', '.bin', 'tsx'))) {
  command = 'npx';
  args = ['tsx', 'server/server-simple.ts'];
} else {
  console.log('tsx not available, trying to run with node...');
  command = 'node';
  args = ['server/server-simple.js'];
}

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
