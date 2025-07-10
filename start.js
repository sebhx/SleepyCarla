#!/usr/bin/env node

// Railway startup script for SleepyCarla
// This ensures Railway properly detects and runs the Node.js server

const { spawn } = require('child_process');

console.log('🚀 Starting SleepyCarla server...');

// Start the production server
const server = spawn('npm', ['run', 'server:production'], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
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
