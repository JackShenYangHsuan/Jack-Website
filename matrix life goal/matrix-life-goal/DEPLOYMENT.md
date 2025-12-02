# Vision Quest - Deployment Guide

## 🌐 Deploy to jackshen.co/visionquest

### Quick Deploy

```bash
./deploy.sh
```

This will:
1. Build the app with base path `/visionquest/`
2. Copy files to `../visionquest` directory
3. Provide next steps for git commit

---

## 📋 Complete Deployment Steps

### 1. Build and Copy Files

```bash
# From this directory (matrix-life-goal)
./deploy.sh
```

### 2. Commit to Main Website

```bash
# Navigate to main personal-website directory
cd ..

# Add the visionquest directory
git add visionquest

# Commit
git commit -m "Deploy Vision Quest app"

# Push to trigger Vercel deployment
git push
```

### 3. Configure Firebase Authentication

⚠️ **IMPORTANT**: Update Firebase to allow authentication from jackshen.co

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vision-matrix**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add: `jackshen.co`
5. Save changes

### 4. Set Environment Variable in Vercel

For the main jackshen.co Vercel project:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **jackshen.co** project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - Key: `VITE_OPENAI_API_KEY`
   - Value: `[your OpenAI API key from .env file]`
   - Environments: Production, Preview, Development
5. **Redeploy** the project to apply the environment variable

---

## 🔄 Updating the App

Whenever you make changes:

```bash
# 1. Test locally
npm run dev

# 2. Deploy
./deploy.sh

# 3. Commit and push
cd ..
git add visionquest
git commit -m "Update Vision Quest: [your changes]"
git push
```

---

## 🧪 Testing

### Local Testing (Development)
```bash
npm run dev
# Visit: http://localhost:5177
```

### Local Testing (Production Build)
```bash
npm run build
npm run preview
# Visit: http://localhost:4173/visionquest/
```

### Production
After deployment, visit: `https://jackshen.co/visionquest`

---

## 📁 Project Structure

```
personal-website/
├── visionquest/          # Built app (created by deploy.sh)
│   ├── index.html
│   ├── assets/
│   └── ...
├── matrix life goal/     # Source code (this directory)
│   ├── src/
│   ├── deploy.sh
│   └── ...
└── ...
```

---

## 🔧 Troubleshooting

### Assets Not Loading
- Check that `vite.config.ts` has `base: '/visionquest/'`
- Rebuild: `npm run build`

### Authentication Fails
- Verify `jackshen.co` is in Firebase authorized domains
- Check browser console for CORS errors

### Environment Variables Missing
- Ensure `VITE_OPENAI_API_KEY` is set in main jackshen.co Vercel project
- Redeploy after adding environment variables

### Routing Issues (404 on refresh)
- Ensure main jackshen.co has proper SPA rewrite rules in vercel.json:
  ```json
  {
    "rewrites": [
      {
        "source": "/visionquest/(.*)",
        "destination": "/visionquest/index.html"
      }
    ]
  }
  ```

---

## 🎯 Checklist

Before first deployment:
- [ ] Run `./deploy.sh` to build and copy files
- [ ] Add `jackshen.co` to Firebase authorized domains
- [ ] Set `VITE_OPENAI_API_KEY` in Vercel environment variables
- [ ] Commit and push visionquest directory
- [ ] Verify app loads at jackshen.co/visionquest
- [ ] Test Google sign-in
- [ ] Test AI suggestions

---

## 📝 Notes

- The app is built with base path `/visionquest/` for proper asset loading
- Firebase credentials are in the code (safe for client-side)
- OpenAI API key must be set as environment variable in Vercel
- Changes require rebuilding and redeploying (not hot reload in production)
