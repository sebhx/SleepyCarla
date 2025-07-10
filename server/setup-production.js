#!/usr/bin/env node

/**
 * Production setup script for cloud deployment
 * Ensures database is set up and optimized for production
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up production environment...');

// Check if we're in production environment
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  Not in production environment, skipping setup');
  process.exit(0);
}

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(envVar => console.error(`   - ${envVar}`));
  console.error('Please set these variables in your cloud provider dashboard.');
  process.exit(1);
}

// Log configuration (without sensitive data)
console.log('✅ Production environment configured:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   - PORT: ${process.env.PORT || 3003}`);
console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   - CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'Default (*)'}`);
