# 🚀 Quick Start - Fix Firebase Index Issue

## Your Current Issue
You're seeing: **"Failed to fetch stories"** with a Firebase index error.

## ✅ SOLUTION (Takes 2 minutes)

### Step 1: Start Your Dev Server
```bash
npm run dev
```

### Step 2: Sign In
1. Go to: `http://localhost:3000/auth/signin`
2. Sign in with Google

### Step 3: Open Debug Page
1. Go to: `http://localhost:3000/debug`
2. You'll see a **yellow box** with a big button: "🚀 Create Index in Firebase"

### Step 4: Create the Index
1. **Click the "🚀 Create Index in Firebase" button**
2. Firebase Console will open in a new tab
3. You'll see the index configuration already filled in
4. **Click the "Create Index" button** in Firebase Console
5. Wait 1-2 minutes while it says "Building..."

### Step 5: Test It
1. When the index status changes to "Enabled" (green checkmark ✓)
2. Go back to your debug page
3. **Click "Try Again"**
4. Your stories should load! 🎉

---

## 🎯 What You Should See

### Before Creating Index:
- Debug page shows: **"🔧 Firebase Index Required"** (yellow box)
- Button says: **"🚀 Create Index in Firebase"**

### After Creating Index:
- Stories load successfully
- Table shows all your stories with their status
- Dashboard at `/dashboard` works properly
- Videos can be retrieved and displayed

---

## 📊 Next Steps After Index is Ready

Once the index is created and stories load:

1. **Check for videos being generated**:
   - Look in the debug table for stories with "Status: video_generating"
   - Check if they have a "Video Job ID"
   - These should automatically start polling

2. **Watch the dashboard**:
   - Go to `/dashboard`
   - Videos with job IDs will show a loading spinner
   - They'll automatically appear when ready from Sora

3. **Test video retrieval**:
   - Use the "Test Retrieve" button in debug page
   - Check the response to see video status

---

## 🐛 Troubleshooting

### "Index is building for a long time"
- Normal for first time: 30 seconds to 2 minutes
- Check Firebase Console for status
- Refresh the page if it seems stuck

### "Index created but still getting error"
- Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Restart dev server: Stop and run `npm run dev` again

### "Can't access Firebase Console"
- Make sure you're logged in with the correct Google account
- Check you have access to project: `day-story-2bca8`
- Ask project owner for access if needed

---

## 📁 Files Created

I've created these files to help you:

1. **firestore.indexes.json** - Index configuration for Firebase CLI
2. **FIREBASE_INDEX_SETUP.md** - Detailed instructions
3. **VIDEO_RETRIEVAL_GUIDE.md** - How video retrieval works
4. **QUICK_START.md** - This file!

---

## ⚡ Super Quick Summary

```bash
# 1. Start server
npm run dev

# 2. Open in browser
http://localhost:3000/debug

# 3. Click yellow button
"🚀 Create Index in Firebase"

# 4. In Firebase Console, click
"Create Index"

# 5. Wait 1-2 minutes, then click
"Try Again"

# Done! ✅
```

---

**You're almost there! Just create that index and everything will work! 🎉**
