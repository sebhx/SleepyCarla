# Railway Deployment Troubleshooting Guide

## Latest Changes Made to Fix Build Issues

### 1. Removed nixpacks.toml
- Let Railway auto-detect Node.js instead of manual configuration
- Nixpacks was having issues with Nix package installation

### 2. Added Node.js Detection Files
- **`.nvmrc`**: Specifies Node.js version 18
- **`Procfile`**: Tells Railway how to start the app (`web: node start.js`)
- **`start.js`**: Custom startup script for better process management

### 3. Simplified Configuration
- **`railway.toml`**: Only contains deployment config, no build config
- **`package.json`**: Updated `railway:start` to use `node start.js`

### 4. Clean Dependencies
- Regenerated `package-lock.json` for clean dependency tree
- Removed problematic `postinstall` and `husky` scripts

## Current Deployment Setup

### Build Process
1. Railway detects Node.js project automatically
2. Runs `npm install` 
3. Runs `npm run railway:build` (builds the Vue.js frontend)
4. Starts with `node start.js` (which runs the Express server)

### Files Structure
```
SleepyCarla/
├── .nvmrc              # Node.js version
├── Procfile            # Railway process definition
├── start.js            # Custom startup script
├── railway.toml        # Railway deployment config
├── package.json        # NPM scripts and dependencies
└── package-lock.json   # Clean dependency tree
```

### Next Steps for Railway Deployment

1. **Go to your Railway dashboard**: https://railway.app/dashboard
2. **Click your SleepyCarla project**
3. **Go to the Deployments tab**
4. **Click "Deploy" or wait for auto-deployment**

### What to Check if Build Still Fails

1. **Check the build logs** in Railway dashboard
2. **Look for specific error messages** (not just "Nix build failed")
3. **Check if dependencies are installing properly**
4. **Verify Node.js version is being detected**

### Alternative: Manual Deploy Command

If auto-deployment fails, you can trigger a manual deploy:

```bash
# In Railway dashboard, go to Settings > Environment
# Add these environment variables:
NODE_ENV=production
PORT=3000

# Then trigger a new deployment
```

### Environment Variables Still Needed

Once deployment succeeds, add these in Railway:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<Railway PostgreSQL URL>
CORS_ORIGIN=<Your Railway app URL>
```

### Testing After Deployment

1. **Check health endpoint**: `https://your-app.railway.app/health`
2. **Test the main app**: `https://your-app.railway.app`
3. **Check PWA functionality** on mobile

## Common Issues and Solutions

### Issue: "Build failed" 
- Check if `package-lock.json` is causing conflicts
- Try deleting and regenerating it locally, then push

### Issue: "Start command failed"
- Check if all dependencies are in `dependencies` not `devDependencies`
- Verify `start.js` has proper permissions

### Issue: "Database connection failed"
- Ensure PostgreSQL database is created in Railway
- Check `DATABASE_URL` environment variable
- Verify database schema is created

## Success Indicators

✅ Build completes without errors
✅ `/health` endpoint returns 200 OK
✅ App loads in browser
✅ PWA can be installed on mobile
✅ Database operations work
