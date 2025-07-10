#!/usr/bin/env node

/**
 * Pre-deployment Checklist for Railway
 * Verifies all configurations are ready for cloud deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Running pre-deployment checklist for Railway...\n');

const checks = [];

// Check 1: Package.json scripts
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.scripts['railway:build'] && packageJson.scripts['railway:start']) {
    checks.push({ name: 'Railway Scripts', status: '✅', message: 'railway:build and railway:start configured' });
  } else {
    checks.push({ name: 'Railway Scripts', status: '❌', message: 'Missing railway:build or railway:start scripts' });
  }
  
  if (packageJson.dependencies['cross-env'] || packageJson.devDependencies['cross-env']) {
    checks.push({ name: 'Cross-env', status: '✅', message: 'cross-env dependency installed' });
  } else {
    checks.push({ name: 'Cross-env', status: '❌', message: 'cross-env dependency missing' });
  }
} else {
  checks.push({ name: 'Package.json', status: '❌', message: 'package.json not found' });
}

// Check 2: Railway configuration
const railwayConfigPath = path.join(__dirname, '..', 'railway.json');
if (fs.existsSync(railwayConfigPath)) {
  const railwayConfig = JSON.parse(fs.readFileSync(railwayConfigPath, 'utf8'));
  
  if (railwayConfig.build && railwayConfig.deploy) {
    checks.push({ name: 'Railway Config', status: '✅', message: 'railway.json properly configured' });
  } else {
    checks.push({ name: 'Railway Config', status: '❌', message: 'railway.json missing build or deploy configuration' });
  }
} else {
  checks.push({ name: 'Railway Config', status: '❌', message: 'railway.json not found' });
}

// Check 3: Environment files
const envExamplePath = path.join(__dirname, '..', '.env.example');
const envProductionPath = path.join(__dirname, '..', '.env.production');

if (fs.existsSync(envExamplePath)) {
  checks.push({ name: 'Environment Example', status: '✅', message: '.env.example exists' });
} else {
  checks.push({ name: 'Environment Example', status: '❌', message: '.env.example missing' });
}

if (fs.existsSync(envProductionPath)) {
  checks.push({ name: 'Environment Production', status: '✅', message: '.env.production template exists' });
} else {
  checks.push({ name: 'Environment Production', status: '❌', message: '.env.production template missing' });
}

// Check 4: PWA assets
const publicDir = path.join(__dirname, '..', 'public');
const requiredPWAAssets = ['pwa-64x64.svg', 'pwa-192x192.svg', 'pwa-512x512.svg', 'apple-touch-icon.svg'];
const missingAssets = requiredPWAAssets.filter(asset => !fs.existsSync(path.join(publicDir, asset)));

if (missingAssets.length === 0) {
  checks.push({ name: 'PWA Assets', status: '✅', message: 'All PWA icons generated' });
} else {
  checks.push({ name: 'PWA Assets', status: '❌', message: `Missing assets: ${missingAssets.join(', ')}` });
}

// Check 5: Server configuration
const serverPath = path.join(__dirname, '..', 'server', 'server.ts');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  if (serverContent.includes('corsOptions') && serverContent.includes('health')) {
    checks.push({ name: 'Server Config', status: '✅', message: 'CORS and health check configured' });
  } else {
    checks.push({ name: 'Server Config', status: '❌', message: 'Server missing CORS or health check' });
  }
} else {
  checks.push({ name: 'Server Config', status: '❌', message: 'server.ts not found' });
}

// Check 6: Database configuration
const dbConfigPath = path.join(__dirname, '..', 'server', 'database-refactored.ts');
if (fs.existsSync(dbConfigPath)) {
  const dbContent = fs.readFileSync(dbConfigPath, 'utf8');
  
  if (dbContent.includes('DATABASE_URL') && dbContent.includes('ssl')) {
    checks.push({ name: 'Database Config', status: '✅', message: 'Database configured for production' });
  } else {
    checks.push({ name: 'Database Config', status: '❌', message: 'Database missing production configuration' });
  }
} else {
  checks.push({ name: 'Database Config', status: '❌', message: 'database-refactored.ts not found' });
}

// Check 7: Build test
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  checks.push({ name: 'Build Test', status: '✅', message: 'Production build exists' });
} else {
  checks.push({ name: 'Build Test', status: '⚠️', message: 'Run npm run build:production to test' });
}

// Display results
console.log('📋 DEPLOYMENT CHECKLIST RESULTS\n');
console.log('='.repeat(50));

let allPassed = true;
checks.forEach(check => {
  console.log(`${check.status} ${check.name}: ${check.message}`);
  if (check.status === '❌') allPassed = false;
});

console.log('='.repeat(50));

if (allPassed) {
  console.log('\n🎉 ALL CHECKS PASSED! Your app is ready for Railway deployment.');
  console.log('\n📚 Next steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Follow the Railway Deployment Guide');
  console.log('3. Deploy to Railway');
  console.log('\n🚀 Happy deploying!');
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above before deploying.');
}

console.log('\n📖 For detailed deployment instructions, see: RAILWAY_DEPLOYMENT_GUIDE.md');
