# DayStory 🎬

**"Your day, told like a Pixar movie"**

Transform your Google Calendar events into personalized, Pixar-style video vlogs using OpenAI's GPT-4o and Sora.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📋 Prerequisites

Before you can run the full application, you'll need:

### 1. Google Cloud Platform (Calendar API & OAuth)
- Create a project at https://console.cloud.google.com
- Enable Google Calendar API
- Create OAuth 2.0 credentials
- Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### 2. OpenAI API
- Sign up at https://platform.openai.com
- Get API key
- Ensure GPT-4o access (Sora access when available)

### 3. Firebase (Database & Storage)
- Create project at https://firebase.google.com
- Set up Firestore Database
- Set up Firebase Storage
- Download service account JSON

### 4. NextAuth Secret
```bash
# Generate a secret
openssl rand -base64 32
```

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```env
# Google OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret

# OpenAI
OPENAI_API_KEY=your_openai_key
# Optional: override the OpenAI model (defaults to gpt-4o-mini)
# OPENAI_MODEL=gpt-4o-mini

# Sora Video Generation (optional – falls back to mock assets if omitted)
# SORA_API_KEY=sk-...       # defaults to OPENAI_API_KEY
# SORA_MODEL=sora-2         # overrides the default sora-2
# SORA_API_BASE_URL=https://api.openai.com/v1/videos

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket_url
```

## 🏗️ Project Structure

```
daystory/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication pages
│   ├── dashboard/        # Main application
│   └── layout.tsx        # Root layout
├── components/            # React components
├── lib/                   # Utilities and services
│   ├── auth.ts           # NextAuth configuration
│   ├── calendar.ts       # Google Calendar API
│   ├── firebase.ts       # Firebase setup
│   ├── openai.ts         # Script generation via GPT-4o
│   ├── sora.ts           # OpenAI Sora integration helpers
│   └── video.ts          # Mock video assets & utilities
├── types/                 # TypeScript types
└── public/               # Static assets
```

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **AI:** OpenAI GPT-4o & Sora
- **Deployment:** Vercel

## 🎭 Features

- ✅ Google Calendar OAuth integration
- ✅ Day picker with event visualization
- ✅ 5 Pixar-style character archetypes
- ✅ AI-generated narrative scripts (GPT-4o)
- ✅ Sora video generation pipeline with automatic mock fallback
- ✅ Video gallery with download/share
- ✅ Fully responsive design

## 🛠️ Development Checkpoints

- [x] **Checkpoint 1:** Project scaffold ✅
- [ ] **Checkpoint 2:** Environment variables & structure
- [ ] **Checkpoint 3:** Google OAuth authentication
- [ ] **Checkpoint 4:** Calendar API integration
- [ ] **Checkpoint 5:** UI Components (day picker, character selection)
- [ ] **Checkpoint 6:** GPT-4o script generation
- [ ] **Checkpoint 7:** Mock video system
- [ ] **Checkpoint 8:** Firebase integration & gallery

## 📝 License

MIT

## 👥 Author

Built as part of the personal website project.
