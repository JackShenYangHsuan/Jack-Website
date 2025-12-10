# YouTube Quote Card Generator

Transform YouTube videos into shareable Instagram quote cards using AI.

## Overview

This web application automatically extracts impactful quotes from YouTube video transcripts and generates professional Instagram-style quote cards (1080x1080px) using OpenAI's GPT-4 and DALL-E 3 APIs.

## Features

- 🎥 Extract transcripts from any YouTube video
- 🤖 AI-powered quote selection (3-5 most impactful quotes)
- 🎨 Automated design generation using DALL-E 3
- 📱 Instagram-optimized 1080x1080px PNG format
- ⬇️ Download individual cards or all at once
- 🚀 Simple, single-page interface

## Tech Stack

**Backend:**
- Node.js + Express
- OpenAI API (GPT-4 + DALL-E 3)
- youtube-transcript library
- Sharp (image processing)

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Responsive design

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- OpenAI API key with access to GPT-4 and DALL-E 3

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd "Quote Generator"
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

4. Start the backend server
```bash
npm start
```

5. Open `index.html` in your browser or serve it via the Express server

## Usage

1. Paste a YouTube video URL into the input field
2. Click "Generate Quote Cards"
3. Wait 60-120 seconds while the AI processes the video
4. Download your generated quote cards

## API Endpoints

- `POST /api/generate` - Generate quote cards from YouTube URL
- `GET /api/health` - Health check endpoint

## Project Structure

```
quote-generator/
├── backend/
│   ├── services/
│   │   ├── youtubeService.js    # Transcript extraction
│   │   ├── openaiService.js     # GPT-4 quote extraction
│   │   ├── dalleService.js      # DALL-E 3 image generation
│   │   └── imageService.js      # Image processing
│   ├── utils/
│   │   ├── validation.js        # Input validation
│   │   ├── errorHandler.js      # Error handling
│   │   └── rateLimiter.js       # Rate limiting
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env
├── index.html                   # Frontend UI
├── styles.css                   # Styling
├── app.js                       # Frontend logic
└── README.md
```

## Cost Considerations

- GPT-4: ~$0.01-0.03 per video
- DALL-E 3: ~$0.20 per video (5 images @ $0.04 each)
- **Total: ~$0.25 per video processed**

## Rate Limiting

Default: 5 requests per 15 minutes per IP address (configurable in backend/utils/rateLimiter.js)

## License

Personal project for demonstration purposes.

## Author

Jack Shen

---

**Note:** This project requires an OpenAI API key. Add it to the `.env` file before running.
