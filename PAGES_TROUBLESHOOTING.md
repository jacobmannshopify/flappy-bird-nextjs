# 🔧 GitHub Pages Troubleshooting

## ❌ **Error: "Get Pages site failed"**

This error means GitHub Pages isn't enabled yet. Here's how to fix it:

---

## ✅ **Solution: Enable GitHub Pages (Step by Step)**

### **1. Go to Repository Settings**
🔗 **Direct Link**: https://github.com/jacobmannshopify/flappy-bird-nextjs/settings

### **2. Find Pages Section**
- Scroll down the left sidebar
- Click **"Pages"**

### **3. Configure Source**
- Under **"Source"**, select **"GitHub Actions"**
- DO NOT select "Deploy from a branch"
- Click **"Save"**

### **4. Verify Setup**
You should see:
```
✅ Your site is ready to be published at:
   https://jacobmannshopify.github.io/flappy-bird-nextjs
```

---

## 🔄 **Re-trigger Deployment**

After enabling Pages, push a small change to trigger deployment:

```bash
# Make a small change (add a space to README)
echo " " >> README.md

# Commit and push
git add README.md
git commit -m "Trigger GitHub Pages deployment"
git push origin main
```

---

## 📊 **Check Deployment Status**

1. **Go to Actions**: https://github.com/jacobmannshopify/flappy-bird-nextjs/actions
2. **Look for**: "Deploy to GitHub Pages" workflow
3. **Status should be**: ✅ Green checkmark

---

## 🚨 **Common Issues & Fixes**

### **Issue 1: "Pages disabled"**
**Fix**: Repository must be public OR you need GitHub Pro/Team

### **Issue 2: "Actions not allowed"**
**Fix**: Go to Settings > Actions > General > Allow all actions

### **Issue 3: "Workflow permissions"**
**Fix**: Settings > Actions > General > Workflow permissions > "Read and write permissions"

---

## 🎯 **Expected Timeline**

1. **Enable Pages**: Instant
2. **First deployment**: 3-5 minutes
3. **Site live**: Additional 1-2 minutes

**Total**: ~5-7 minutes from enabling to live site

---

## 📞 **Need Help?**

If still having issues:
1. Check if repository is public
2. Verify you have admin access
3. Try the alternative Vercel deployment (already working)

**Working URL**: https://flappy-bird-nextjs-iqrr2t3hh-jacobs-projects-d4825c0d.vercel.app 