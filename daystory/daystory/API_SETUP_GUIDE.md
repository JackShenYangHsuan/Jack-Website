# 🔐 API Setup Guide

Follow these step-by-step instructions to get all the API credentials you need for DayStory.

---

## 1️⃣ Google OAuth & Calendar API (15 minutes)

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name it **"DayStory"**
4. Click **"Create"**

### Step 2: Enable Google Calendar API
1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Calendar API"**
3. Click on it and press **"Enable"**

### Step 3: Configure OAuth Consent Screen
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in:
   - **App name:** DayStory
   - **User support email:** your email
   - **Developer contact:** your email
5. Click **"Save and Continue"**
6. On **"Scopes"** page, click **"Add or Remove Scopes"**
7. Search and add: `https://www.googleapis.com/auth/calendar.readonly`
8. Click **"Save and Continue"**
9. Add yourself as a **test user** (your email)
10. Click **"Save and Continue"**

### Step 4: Create OAuth 2.0 Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Choose **"Web application"**
4. Name: **"DayStory Web Client"**
5. Under **"Authorized redirect URIs"**, click **"Add URI"** and enter:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Click **"Create"**
7. **COPY** your **Client ID** and **Client Secret** (you'll need these!)

### ✅ Result:
- ✅ `GOOGLE_CLIENT_ID`: Looks like `123456789-abc123.apps.googleusercontent.com`
- ✅ `GOOGLE_CLIENT_SECRET`: Looks like `GOCSPX-abcd1234efgh5678`

---

## 2️⃣ OpenAI API (5 minutes)

### Step 1: Create OpenAI Account
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in

### Step 2: Generate API Key
1. Click your profile (top right) → **"View API keys"**
2. Click **"Create new secret key"**
3. Name it: **"DayStory"**
4. **COPY** the key immediately (you won't see it again!)

### Step 3: Add Credits (if needed)
1. Go to **"Settings"** → **"Billing"**
2. Add payment method
3. Add at least $5-10 in credits

### ✅ Result:
- ✅ `OPENAI_API_KEY`: Looks like `sk-proj-abc123def456...`

---

## 3️⃣ Firebase (Database & Storage) (10 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name: **"daystory"** (lowercase, no spaces)
4. Disable Google Analytics (not needed for now)
5. Click **"Create project"**

### Step 2: Set Up Firestore Database
1. In your project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Select a location (choose closest to you, e.g., `us-central1`)
5. Click **"Enable"**

### Step 3: Set Up Firebase Storage
1. Click **"Storage"** in the left sidebar
2. Click **"Get started"**
3. Choose **"Start in test mode"**
4. Use the same location as Firestore
5. Click **"Done"**

### Step 4: Get Service Account Credentials
1. Click the **gear icon** ⚙️ → **"Project settings"**
2. Go to the **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** (downloads a JSON file)
5. **OPEN** the JSON file and find these values:
   - `project_id`
   - `private_key` (long string starting with `-----BEGIN PRIVATE KEY-----`)
   - `client_email`

### Step 5: Get Storage Bucket URL
1. Go to **"Storage"** in the left sidebar
2. Copy the bucket name (looks like: `daystory.appspot.com`)

### ✅ Result:
- ✅ `FIREBASE_PROJECT_ID`: Like `daystory-abc123`
- ✅ `FIREBASE_PRIVATE_KEY`: Starts with `-----BEGIN PRIVATE KEY-----`
- ✅ `FIREBASE_CLIENT_EMAIL`: Like `firebase-adminsdk-xyz@daystory.iam.gserviceaccount.com`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Like `daystory.appspot.com`

---

## 4️⃣ NextAuth Secret (1 minute)

### Generate a Random Secret

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### ✅ Result:
- ✅ `NEXTAUTH_SECRET`: A random 32+ character string

---

## 5️⃣ Add to Your `.env.local` File

1. In your project folder, create a file called `.env.local`
2. Copy and paste this template:

```env
# Google OAuth2 (for Calendar API)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret_here

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Firebase Storage
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_url
```

3. **Replace** all the `your_xxx_here` placeholders with your actual credentials
4. **IMPORTANT:** Keep the quotes around `FIREBASE_PRIVATE_KEY`
5. **Save** the file

---

## 6️⃣ Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart it:
npm run dev
```

---

## ✅ Done!

You're now ready to build the full DayStory application!

### What's Next:
- Test the demo at http://localhost:3000/demo
- Set up authentication with your Google credentials
- Connect to the Calendar API
- Integrate OpenAI for script generation

### Need Help?
- Google Cloud: https://console.cloud.google.com/apis/credentials
- OpenAI: https://platform.openai.com/api-keys
- Firebase: https://console.firebase.google.com

---

**⚠️ Security Notes:**
- NEVER commit `.env.local` to git (it's already in `.gitignore`)
- NEVER share your API keys publicly
- Keep your Firebase service account JSON file secure
- Use environment variables in production (Vercel handles this automatically)
