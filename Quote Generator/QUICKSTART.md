# Quick Start Guide

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key with access to GPT-4 and DALL-E 3
   - Sign up at https://platform.openai.com/
   - Create an API key
   - Ensure your account has credits

## Setup (5 minutes)

### Step 1: Configure Environment Variables

```bash
cd backend
```

Open `.env` file and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=3000
NODE_ENV=development
```

### Step 2: Install Dependencies

Dependencies are already installed, but if needed:

```bash
npm install
```

### Step 3: Start the Server

```bash
npm start
```

You should see:

```
🚀 YouTube Quote Card Generator API
📡 Server running on http://localhost:3000
🏥 Health check: http://localhost:3000/api/health
📝 Environment: development

Ready to generate quote cards!
```

### Step 4: Open the Application

Open your browser and navigate to:

```
http://localhost:3000
```

Or directly open the `index.html` file in your browser.

## Usage

1. **Paste a YouTube URL** into the input field
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

2. **Click "Generate Quote Cards"**

3. **Wait 60-120 seconds** while the AI:
   - Extracts the video transcript
   - Selects 3-5 impactful quotes
   - Generates beautiful quote cards with DALL-E 3

4. **Download your cards!**
   - Download individual cards
   - Or click "Download All Cards"

## Testing URLs

Here are some good YouTube videos to test with:

### Short Videos (< 10 minutes)
- TED Talks: https://www.youtube.com/watch?v=8S0FDjFBj8o
- Educational videos with clear speech and captions

### Medium Videos (10-30 minutes)
- Podcast clips
- Interview segments

### Avoid
- Music videos (usually no transcript)
- Videos without captions
- Live streams

## Troubleshooting

### "Unable to connect to server"
- Make sure the backend is running on localhost:3000
- Check terminal for error messages

### "No transcript available"
- The video doesn't have captions enabled
- Try a different video

### "OpenAI API quota exceeded"
- You've hit your OpenAI API rate limit or run out of credits
- Check your OpenAI account: https://platform.openai.com/usage

### "Too many requests"
- Rate limit: 5 requests per 15 minutes
- Wait a few minutes and try again

## Cost Estimates

Each video costs approximately:
- GPT-4: $0.01-0.03 (quote extraction)
- DALL-E 3: $0.20 (5 images × $0.04 each)
- **Total: ~$0.25 per video**

## Project Structure

```
Quote Generator/
├── backend/
│   ├── services/         # AI & processing logic
│   ├── utils/            # Validation, rate limiting
│   ├── server.js         # Express API server
│   └── package.json
├── index.html            # Frontend UI
├── styles.css            # Styling
├── app.js                # Frontend logic
└── README.md             # Documentation
```

## Development

### Run in Development Mode

```bash
cd backend
npm run dev  # If you install nodemon
```

### Check Server Health

```bash
curl http://localhost:3000/api/health
```

### View Logs

The terminal will show detailed logs for each request:
- Transcript extraction progress
- Quote extraction results
- DALL-E image generation
- Processing time

## Next Steps

1. **Add your OpenAI API key** to `.env`
2. **Start the server**: `npm start`
3. **Open the app**: http://localhost:3000
4. **Paste a YouTube URL** and generate cards!

Enjoy creating beautiful quote cards! 🎉
