# 🚀 GitHub Pages Setup Guide

## 📋 **Quick Setup (5 minutes)**

Your Flappy Bird game can be deployed to **GitHub Pages** for easy access at:
**`https://jacobmannshopify.github.io/flappy-bird-nextjs`**

### ✅ **Step 1: Enable GitHub Pages**

1. Go to your repository: https://github.com/jacobmannshopify/flappy-bird-nextjs
2. Click **Settings** tab
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**, select **"GitHub Actions"**
5. Click **Save**

### ✅ **Step 2: Push Changes (Triggers Auto-Deploy)**

The GitHub Actions workflow is already set up! Just push your code:

```bash
git add .
git commit -m "🚀 Add GitHub Pages deployment"
git push origin main
```

### ✅ **Step 3: Wait for Deployment**

- GitHub will automatically build and deploy your game
- Check the **Actions** tab to see deployment progress
- Takes ~2-3 minutes for first deployment

---

## 🌐 **Your Game URLs**

Once deployed, your game will be available at:

- **GitHub Pages**: `https://jacobmannshopify.github.io/flappy-bird-nextjs`
- **Vercel**: `https://flappy-bird-nextjs-iqrr2t3hh-jacobs-projects-d4825c0d.vercel.app`

---

## 🔧 **Local Testing**

Test the GitHub Pages build locally:

```bash
# Build static files
npm run build:static

# Preview locally
npm run deploy:preview
```

Then visit `http://localhost:3000` to test the static version.

---

## 📊 **Deployment Status**

- ✅ **Vercel**: Live and auto-deploying
- 🔄 **GitHub Pages**: Setting up... (will be live after push)

---

## 🛠 **How It Works**

1. **GitHub Actions** automatically triggers on every push to `main`
2. Installs dependencies and builds static files to `./out`
3. Deploys to GitHub Pages with proper routing
4. Game accessible at `*.github.io` URL

---

## 🎯 **Benefits of GitHub Pages**

- ✅ **Free hosting** with GitHub account
- ✅ **Easy to remember** `.github.io` URL
- ✅ **Automatic deployment** on every push
- ✅ **No external dependencies** (purely GitHub)
- ✅ **Perfect for portfolios** and sharing

Your game will be live at GitHub Pages after the next push! 🎮 