#!/usr/bin/env node

// Simple Railway startup script
console.log('🚀 Starting SleepyCarla Railway deployment...');

const { spawn } = require('child_process');

// Just start the server directly - let Railway handle the build
const server = spawn('node', ['server.cjs'], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
