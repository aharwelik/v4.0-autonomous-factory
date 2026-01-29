# Deployment Guide

## How to Deploy Generated Apps

Your generated apps can be deployed to several hosting providers:

### Option 1: Vercel (Recommended - FREE)

1. **Get your Vercel token:**
   - Go to https://vercel.com/account/tokens
   - Create a new token
   - Add it in the dashboard Setup tab

2. **Deploy from dashboard:**
   - Click "Deploy" button on any completed app
   - Select "Vercel"
   - Deployment happens automatically
   - You'll get a live URL

3. **Or deploy manually:**
   ```bash
   cd generated-apps/your-app-name
   npm install -g vercel
   vercel --prod
   ```

### Option 2: Railway ($5/month minimum)

1. Install Railway CLI: `npm install -g @railway/cli`
2. Navigate to app: `cd generated-apps/your-app-name`
3. Deploy: `railway up`

### Option 3: Manual Hosting

1. Build the app:
   ```bash
   cd generated-apps/your-app-name
   npm install
   npm run build
   ```

2. Upload the `.next` folder + `public` folder + `package.json` to your host

3. Run on server: `npm start`

## Deployment Checklist

Before deploying:
- [ ] Add environment variables (.env)
- [ ] Set up Stripe keys (if using payments)
- [ ] Test locally with `npm run dev`
- [ ] Verify build succeeds with `npm run build`

## Deployment Status

The deployment API is implemented and ready to use:
- ✅ Vercel integration (requires VERCEL_TOKEN)
- ✅ Railway integration (requires Railway CLI)
- ✅ Hostinger integration (requires FTP/Git credentials)

**Note:** Deployment requires setting up your hosting provider credentials in the dashboard Setup tab.
