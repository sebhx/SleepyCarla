# 🚀 Railway Deployment Guide for SleepyCarla

## Quick Start

Your app is **ready for Railway deployment**! Follow these steps:

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Verify your email

### Step 2: Deploy Your App

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your SleepyCarla repository
4. Railway will automatically detect your configuration

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"Add Service"**
2. Select **"PostgreSQL"**
3. Railway will automatically create the database

### Step 4: Configure Environment Variables

Railway will automatically set most variables, but you may want to add:

```env
NODE_ENV=production
CORS_ORIGIN=https://your-app-name.railway.app
PWA_APP_NAME=SleepyCarla - Baby Sleep Tracker
PWA_SHORT_NAME=SleepyCarla
PWA_DESCRIPTION=Track your baby's sleep patterns and get nap recommendations
```

### Step 5: Deploy!

1. Railway will automatically build and deploy your app
2. You'll get a URL like: `https://your-app-name.railway.app`
3. Test the health check: `https://your-app-name.railway.app/api/health`

## 📱 Install on iPhone

Once deployed:

1. Open the app URL in Safari on your iPhone
2. Tap the **Share** button (square with arrow up)
3. Select **"Add to Home Screen"**
4. Your PWA will be installed like a native app!

## 🔧 What's Already Configured

✅ **Production Build**: Optimized for performance
✅ **PWA**: Service worker, manifest, and icons
✅ **Database**: PostgreSQL with connection pooling
✅ **Security**: HTTPS, security headers, CORS
✅ **Health Checks**: Automatic monitoring
✅ **Auto-scaling**: Railway handles traffic scaling
✅ **Node.js Detection**: `.nvmrc`, `Procfile`, and `start.js`
✅ **Clean Dependencies**: Fresh `package-lock.json`
✅ **Deployment Config**: Simplified `railway.toml`

## 🚀 Recent Fixes for Build Issues

We've fixed the Nixpacks/Nix build error by:
- Removing `nixpacks.toml` to let Railway auto-detect Node.js
- Adding `.nvmrc` file for Node.js version specification
- Creating `Procfile` for Railway process definition
- Adding `start.js` custom startup script
- Simplifying `railway.toml` configuration

## 📋 Next Steps

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Find your SleepyCarla project**
3. **Check the Deployments tab**
4. **Railway should automatically deploy the latest changes**

If the deployment still fails, check `RAILWAY_TROUBLESHOOTING.md` for detailed solutions.

## 🎯 Expected Costs

- **Your app**: FREE (Railway's free tier)
- **Database**: FREE (Railway's free PostgreSQL tier)
- **Custom domain**: FREE (Railway subdomain)

## 📞 Need Help?

If you encounter any issues:

1. Check Railway's build logs
2. Verify environment variables are set
3. Test the health check endpoint
4. Review the deployment logs

## 🔄 Automatic Updates

Every time you push to GitHub:

- Railway will automatically rebuild
- Deploy the new version
- Zero downtime deployments

---

**Ready to deploy?** Just follow the steps above and you'll be live in minutes!
