# 🌐 Railway Environment Variables Setup

Copy these environment variables to your Railway project:

## Required Variables (Railway will set automatically):

```
NODE_ENV=production
PORT=${{ PORT }}
DATABASE_URL=${{ DATABASE_URL }}
```

## Optional Variables (you can add these):

```
CORS_ORIGIN=https://your-app-name.railway.app
PWA_APP_NAME=SleepyCarla - Baby Sleep Tracker
PWA_SHORT_NAME=SleepyCarla
PWA_DESCRIPTION=Track your baby's sleep patterns and get nap recommendations
```

## How to Set Environment Variables in Railway:

1. **Go to your Railway project**
2. **Click on your service (app)**
3. **Go to the "Variables" tab**
4. **Add each variable:**
   - Click "New Variable"
   - Enter the name (e.g., `CORS_ORIGIN`)
   - Enter the value (e.g., `https://your-app-name.railway.app`)
   - Click "Add"

## 🔧 Railway Auto-Generated Variables:

Railway automatically provides:

- `PORT` - The port your app should listen on
- `DATABASE_URL` - PostgreSQL connection string
- `RAILWAY_STATIC_URL` - Your app's public URL
- `RAILWAY_PUBLIC_DOMAIN` - Your app's domain

## 🎯 Custom Domain (Optional):

If you want a custom domain:

1. Go to "Settings" tab in Railway
2. Click "Domains"
3. Add your custom domain
4. Update `CORS_ORIGIN` to match your domain

---

**Note:** Railway will automatically inject these variables into your app at runtime.
