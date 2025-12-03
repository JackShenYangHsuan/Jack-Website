# SpeakCoach

Practice clear, confident communication with AI-powered feedback.

## Overview

SpeakCoach is a web app that helps users improve their verbal communication skills. Users receive a random topic, speak for 30-60 seconds, and get instant, actionable feedback on clarity, structure, filler words, and delivery.

## Features

- **Topic Generator**: Random practice topics across 4 categories (opinion, story, explain, persuade)
- **60-Second Recording**: Record your response with a visual countdown timer
- **Live Hints** (optional): Real-time nudges while speaking to avoid fillers, shorten sentences, etc.
- **Instant Feedback**: AI-powered analysis including:
  - Main point detection
  - Structure analysis (claim → reason → example)
  - Filler word count
  - Long sentence identification
  - Suggested 20-second rewrite

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_key_here
   ```

### Development

Run the local development server:

```bash
npm run dev
```

This will open the app at `http://localhost:3000`.

### Deployment

The app is designed to be deployed on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Add `OPENAI_API_KEY` environment variable
4. Deploy

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Custom CSS with CSS variables
- **Audio**: Web Audio API, MediaRecorder
- **APIs**: OpenAI Whisper (transcription), GPT-4o-mini (analysis)
- **Deployment**: Vercel serverless functions

## Project Structure

```
speak-coach/
├── index.html          # Main HTML with all screens
├── styles/
│   ├── main.css        # Global styles, variables, typography
│   └── components.css  # Component-specific styles
├── js/
│   ├── app.js          # Main app logic, state management
│   ├── topics.js       # Topic generator module
│   ├── recorder.js     # Audio recording module
│   ├── liveHints.js    # Real-time hint detection
│   └── analyzer.js     # API client for analysis
├── api/
│   ├── transcribe.js   # Whisper API serverless function
│   └── analyze.js      # GPT analysis serverless function
├── data/
│   └── topics.json     # Topic bank (optional, embedded in topics.js)
└── tasks/
    ├── prd-speakcoach.md
    └── tasks-speakcoach.md
```

## License

Personal project for demonstration purposes.
