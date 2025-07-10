# 🔧 PWA Plugin Crypto Compatibility Fix

## Latest Issue
Railway deployment was failing with:
```
crypto.hash is not a function
[vite-plugin-pwa:build] src/App.vue: There was an error during the build
```

## Root Cause
The `vite-plugin-pwa` was using `crypto.hash` which is not available in Node.js 18. This is a compatibility issue between the PWA plugin and the Node.js version.

## Solution Applied

### 1. Upgraded Node.js Version
Updated from Node.js 18 to Node.js 20 which has better crypto function support:

**Updated files:**
- `nixpacks.toml`: `nixPkgs = ["nodejs-20_x"]`
- `package.json`: `"node": ">=20.0.0"`
- `.nvmrc`: `20`

### 2. Updated PWA Plugin Version
```json
"vite-plugin-pwa": "^0.20.5"
```

### 3. Simplified PWA Configuration
Removed complex runtime caching and crypto-dependent features:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  devOptions: {
    enabled: false
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
  },
  // ... rest of config
})
```

## Expected Result
- Node.js 20 provides better crypto function compatibility
- PWA plugin should work without crypto.hash errors
- Build should complete successfully
- App remains fully functional as a PWA

## Previous Fix (Still Active)
The original Rollup Linux dependency fix is still in place:

### 1. Updated `.npmrc`
```
optional=true
include=optional
production=false
```

### 2. Updated `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]  # Updated to Node.js 20

[phases.install]
cmd = "rm -rf node_modules package-lock.json && npm install --include=optional --verbose"

[phases.build]
cmd = "npm run build"

[start]
cmd = "npm run railway:start"

[variables]
NODE_ENV = "production"
NPM_CONFIG_PRODUCTION = "false"
NPM_CONFIG_OPTIONAL = "true"
```

### 3. Removed `package-lock.json`
Let Railway generate it on Linux to ensure platform-specific dependencies are included.

## Status
✅ **BUILD WORKING** - App successfully builds on Railway!
✅ **HEALTH CHECK WORKING LOCALLY** - Simple CommonJS server tested and working
✅ **COMMITTED** - All changes pushed to GitHub  
🔄 **DEPLOYING** - Railway should now deploy with working health checks

## Latest Update - Simple CommonJS Server
Created a bulletproof server approach:
1. **Pure CommonJS server** - `server.cjs` with no TypeScript dependencies
2. **Tested locally** - Health check responds with 200 OK
3. **Comprehensive logging** - Debug information for Railway deployment
4. **Updated all references** - Procfile, package.json, start.js all point to new server
5. **Eliminated ES module issues** - No more import/require conflicts

## Server Test Results
✅ **Local server starts successfully**
✅ **Health check responds**: `{"status":"ok","message":"SleepyCarla is running","timestamp":"2025-07-10T22:50:02.028Z","port":3000}`
✅ **No compilation errors**
✅ **Simple dependency chain**

## What's Different Now
- **No TypeScript** - Pure JavaScript server for Railway
- **No tsx dependency** - Direct node execution
- **CommonJS format** - Avoids ES module conflicts
- **Comprehensive logging** - Debug info for troubleshooting
- **Static file serving** - Serves Vue app from dist directory

Railway should now successfully deploy and pass health checks!
