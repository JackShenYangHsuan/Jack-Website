# Firebase Firestore Index Setup Guide

## 🔴 Current Issue
You're seeing this error:
```
Error: 9 FAILED_PRECONDITION: The query requires an index.
```

This happens because Firebase Firestore requires a **composite index** for queries that:
- Filter by one field (`userId`)
- AND order by another field (`createdAt`)

## ✅ Quick Fix (Recommended - 2 minutes)

### Option 1: Click the Link (Easiest!)

The error message includes a direct link to create the index. Here's how:

1. **Copy this link** from your error message:
   ```
   https://console.firebase.google.com/v1/r/project/day-story-2bca8/firestore/indexes?create_composite=...
   ```

2. **Open the link in your browser**
   - You'll be taken to the Firebase Console
   - The index configuration will be pre-filled

3. **Click "Create Index"**
   - Firebase will start building the index
   - This usually takes 1-5 minutes depending on data size

4. **Wait for completion**
   - You'll see a spinner while it's building
   - Once it shows "Enabled", refresh your app

5. **Test your app**
   - Go back to `/debug` and click "Refresh"
   - Stories should now load successfully!

---

## 🛠 Option 2: Deploy Index via Firebase CLI

If you prefer to manage indexes via code:

### Step 1: Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase (if not done)
```bash
firebase init firestore
```
Select:
- ✓ Firestore: Configure security rules and indexes files
- Choose your project: `day-story-2bca8`
- Use default file names (firestore.rules, firestore.indexes.json)

### Step 4: Deploy the Index
I've already created `firestore.indexes.json` in your project root with the required index:

```json
{
  "indexes": [
    {
      "collectionGroup": "stories",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

Deploy it:
```bash
firebase deploy --only firestore:indexes
```

### Step 5: Wait for Index to Build
```bash
# Check index status
firebase firestore:indexes
```

---

## 📋 What This Index Does

The index allows efficient querying for:
- **Stories by user** (`userId`)
- **Ordered by creation date** (`createdAt` descending)

This is used in:
- `/dashboard` - to show your stories in chronological order
- `/api/stories/list` - to fetch user-specific stories
- `/debug` - to display all your stories

---

## 🔍 Verify Index Creation

### Check in Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `day-story-2bca8`
3. Go to **Firestore Database** → **Indexes** tab
4. Look for an index on collection `stories` with fields:
   - `userId` (Ascending)
   - `createdAt` (Descending)

### Status meanings:
- 🟡 **Building**: Index is being created (wait 1-5 minutes)
- 🟢 **Enabled**: Index is ready! Your app should work now
- 🔴 **Error**: Something went wrong - check Firebase Console for details

---

## 🚨 Troubleshooting

### Issue: "Index already exists"
- Good news! The index is there
- Click on it to see if it's still building
- If it's enabled, your app should work

### Issue: "Permission denied"
- Make sure you're logged into Firebase CLI with the correct account
- Run: `firebase login --reauth`
- Ensure your account has "Editor" or "Owner" role on the project

### Issue: "Index build failed"
- Check Firebase Console for error details
- Try deleting and recreating the index
- Contact Firebase support if issue persists

### Issue: App still doesn't work after index is enabled
1. **Hard refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache**
3. **Check Network tab** in DevTools - look for `/api/stories/list` response
4. **Check Firebase Console** - verify index shows "Enabled"
5. **Restart your dev server**: `npm run dev`

---

## 📊 Index Build Time

Typical build times:
- **Empty database**: ~30 seconds
- **< 1000 documents**: 1-2 minutes
- **1000-10000 documents**: 2-5 minutes
- **> 10000 documents**: 5-15 minutes

You can continue developing while the index builds!

---

## 🎯 Quick Checklist

- [ ] Click the link from the error message
- [ ] See the Firebase Console with pre-filled index config
- [ ] Click "Create Index"
- [ ] Wait for status to change from "Building" to "Enabled"
- [ ] Refresh your app at `/debug`
- [ ] Verify stories load successfully
- [ ] Continue with video retrieval testing!

---

## 💡 Pro Tip

To avoid this in the future:
1. Always deploy indexes when adding new queries
2. Keep `firestore.indexes.json` in version control
3. Deploy indexes before deploying code: `firebase deploy --only firestore:indexes`

---

**Need Help?**
- Firebase Docs: https://firebase.google.com/docs/firestore/query-data/indexing
- Firebase Console: https://console.firebase.google.com/project/day-story-2bca8/firestore/indexes
