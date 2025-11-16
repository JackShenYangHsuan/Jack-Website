# Vibe Concert - Deployment Guide

This guide explains how to deploy the Vibe Concert installer to jackshen.co.

## 📁 Files Ready for Deployment

The following files have been prepared in your repository:

```
/Users/jackshen/Desktop/personal-website/
├── install-vibe-concert.sh          # Main installer script
└── vibe-concert/
    └── source.tar.gz                # Source code tarball (1.8MB)
```

## 🚀 Deployment Steps

### Option 1: Deploy via Git (Recommended if using Vercel/Netlify)

1. **Commit the new files:**
   ```bash
   cd /Users/jackshen/Desktop/personal-website
   git add install-vibe-concert.sh vibe-concert/
   git commit -m "Add Vibe Concert command-line installer"
   git push
   ```

2. **Verify deployment:**
   - Wait for Vercel/Netlify to deploy
   - Test the URLs:
     - https://jackshen.co/install-vibe-concert.sh
     - https://jackshen.co/vibe-concert/source.tar.gz

3. **Test installation:**
   ```bash
   curl -fsSL https://jackshen.co/install-vibe-concert.sh | bash
   ```

### Option 2: Manual Upload (if using traditional hosting)

1. Upload `install-vibe-concert.sh` to your website root
2. Upload `vibe-concert/source.tar.gz` to `/vibe-concert/` directory
3. Ensure files are publicly accessible

## 🧪 Testing

### Test the installer locally first:

```bash
cd "/Users/jackshen/Desktop/personal-website/vibe concert/TerminalMusicPlayer"
./install-local.sh
```

### Test from hosted URL (after deployment):

```bash
# Download and inspect
curl -fsSL https://jackshen.co/install-vibe-concert.sh -o test-install.sh
cat test-install.sh

# Run it
bash test-install.sh
```

## 📋 Installation URLs

Once deployed, users can install with:

**One-line install:**
```bash
curl -fsSL https://jackshen.co/install-vibe-concert.sh | bash
```

**Inspect first:**
```bash
curl -fsSL https://jackshen.co/install-vibe-concert.sh -o install.sh
cat install.sh
bash install.sh
```

## ✅ What the Installer Does

1. ✅ Checks for macOS and Xcode Command Line Tools
2. ✅ Downloads source code from `https://jackshen.co/vibe-concert/source.tar.gz`
3. ✅ Builds the app locally (bypasses all macOS security restrictions!)
4. ✅ Installs to /Applications
5. ✅ Sets up Claude Code hooks
6. ✅ Launches the app

## 🔧 Maintenance

### Updating the app:

1. Make changes to the source code
2. Rebuild the tarball:
   ```bash
   cd "/Users/jackshen/Desktop/personal-website/vibe concert/TerminalMusicPlayer"
   tar -czf vibe-concert-source.tar.gz \
     build-app.sh \
     Package.swift \
     Sources/ \
     installer-scripts/ \
     AppIcon.icns \
     README.md
   ```
3. Copy to website:
   ```bash
   cp vibe-concert-source.tar.gz "/Users/jackshen/Desktop/personal-website/vibe-concert/source.tar.gz"
   ```
4. Commit and push

## 🎯 Benefits

- **No DMG headaches** - No quarantine, no unsigned app warnings
- **One command** - Simple for developers to install
- **Transparent** - Users can inspect the script before running
- **Always fresh** - Builds from latest source
- **Developer-friendly** - Perfect for your Claude Code user audience

## 📊 File Sizes

- Install script: 6.2 KB
- Source tarball: 1.8 MB

Total bandwidth per install: ~1.8 MB

## 🐛 Troubleshooting

If users report issues:

1. **Check URLs are accessible:**
   ```bash
   curl -I https://jackshen.co/install-vibe-concert.sh
   curl -I https://jackshen.co/vibe-concert/source.tar.gz
   ```

2. **Verify tarball extracts correctly:**
   ```bash
   tar -tzf /Users/jackshen/Desktop/personal-website/vibe-concert/source.tar.gz | head -20
   ```

3. **Test the local installer:**
   ```bash
   cd "/Users/jackshen/Desktop/personal-website/vibe concert/TerminalMusicPlayer"
   ./install-local.sh
   ```

## 🎵 Next Steps

After deployment:
1. Update social media / documentation with new install command
2. Test from a fresh Mac if possible
3. Monitor for any installation issues
4. Consider adding analytics to track installations (optional)

---

**Ready to deploy!** Just commit and push the files, and the installer will be live. 🚀
