# Tasks: YouTube Quote Card Generator

## Relevant Files

### Backend
- `backend/server.js` - Main Express server with API routes
- `backend/.env.example` - Example environment variables file
- `backend/.env` - Environment variables (API keys, config)
- `backend/package.json` - Backend dependencies and scripts
- `backend/services/youtubeService.js` - YouTube transcript extraction logic
- `backend/services/openaiService.js` - OpenAI Chat API integration for quote extraction
- `backend/services/dalleService.js` - DALL-E 3 API integration for image generation
- `backend/services/imageService.js` - Image processing and resizing using Sharp
- `backend/utils/validation.js` - Input validation utilities
- `backend/utils/errorHandler.js` - Error handling middleware
- `backend/utils/rateLimiter.js` - Rate limiting configuration

### Frontend
- `index.html` - Main landing page
- `styles.css` - Styling for the application
- `app.js` - Frontend JavaScript for UI interactions
- `assets/` - Directory for static assets (logos, icons, etc.)

### Configuration
- `.gitignore` - Git ignore file (must include .env, node_modules)
- `README.md` - Project documentation

### Notes
- Store API keys in `.env` file, never commit to version control
- Use `npm install` to install dependencies
- Backend runs on port 3000 (configurable via .env)
- Frontend can be served statically or via the Express server

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/youtube-quote-generator`)

- [x] 1.0 Set up project structure and dependencies
  - [x] 1.1 Create project root directory structure (`backend/`, `frontend/`, etc.)
  - [x] 1.2 Initialize Node.js project in backend directory (`npm init -y`)
  - [x] 1.3 Install backend dependencies: `express`, `dotenv`, `cors`, `openai`, `youtube-transcript`, `sharp`, `express-rate-limit`
  - [x] 1.4 Create `.env.example` file with required environment variables (OPENAI_API_KEY, PORT)
  - [x] 1.5 Create `.env` file and add OpenAI API key
  - [x] 1.6 Create `.gitignore` file (include `node_modules/`, `.env`, `*.log`)
  - [x] 1.7 Create basic `README.md` with project overview and setup instructions
  - [x] 1.8 Create directory structure: `backend/services/`, `backend/utils/`, `backend/routes/`

- [x] 2.0 Implement YouTube transcript extraction service
  - [x] 2.1 Create `backend/services/youtubeService.js` file
  - [x] 2.2 Import `youtube-transcript` library
  - [x] 2.3 Implement `extractTranscript(videoUrl)` function to get video ID from URL
  - [x] 2.4 Implement logic to fetch transcript using youtube-transcript library
  - [x] 2.5 Handle cases where transcript is unavailable (return error message)
  - [x] 2.6 Combine transcript segments into a single text string
  - [x] 2.7 Add error handling for invalid YouTube URLs
  - [x] 2.8 Export the service functions

- [x] 3.0 Implement OpenAI Chat API integration for quote extraction
  - [x] 3.1 Create `backend/services/openaiService.js` file
  - [x] 3.2 Import OpenAI SDK and initialize with API key from .env
  - [x] 3.3 Implement `extractQuotes(transcript)` function
  - [x] 3.4 Create GPT-4 prompt that instructs AI to select 3-5 impactful quotes
  - [x] 3.5 Specify quote criteria in prompt (self-contained, 15-100 words, diverse themes)
  - [x] 3.6 Request JSON response format with array of quotes
  - [x] 3.7 Call OpenAI Chat API with the prompt and transcript
  - [x] 3.8 Parse and validate the response (ensure 3-5 quotes returned)
  - [x] 3.9 Add error handling for API failures and rate limits
  - [x] 3.10 Export the service functions

- [x] 4.0 Implement OpenAI DALL-E 3 API integration for image generation
  - [x] 4.1 Create `backend/services/dalleService.js` file
  - [x] 4.2 Import OpenAI SDK (reuse from openaiService or create new instance)
  - [x] 4.3 Implement `generateQuoteCard(quote, styleIndex)` function
  - [x] 4.4 Create an array of 5 different design style prompts (minimal, gradient, dark mode, magazine, tech)
  - [x] 4.5 Build DALL-E prompt that includes: quote text, style aesthetic, Instagram-optimized design
  - [x] 4.6 Specify 1024x1024 size in DALL-E API call
  - [x] 4.7 Call DALL-E 3 API with the constructed prompt
  - [x] 4.8 Return the image URL from DALL-E response
  - [x] 4.9 Implement `generateAllCards(quotes)` function to generate all cards in parallel using Promise.all
  - [x] 4.10 Add error handling for DALL-E failures (retry logic or graceful degradation)
  - [x] 4.11 Export the service functions

- [x] 5.0 Implement image processing and resizing service
  - [x] 5.1 Create `backend/services/imageService.js` file
  - [x] 5.2 Import Sharp library for image processing
  - [x] 5.3 Implement `downloadImage(imageUrl)` function to fetch image from DALL-E URL
  - [x] 5.4 Implement `resizeImage(imageBuffer)` function to resize from 1024x1024 to 1080x1080
  - [x] 5.5 Configure Sharp to output PNG format with high quality
  - [x] 5.6 Implement `processAndSaveImage(imageUrl, outputPath)` function combining download and resize
  - [x] 5.7 Add error handling for download failures and processing errors
  - [x] 5.8 Export the service functions

- [x] 6.0 Build backend API endpoints
  - [x] 6.1 Create `backend/server.js` file
  - [x] 6.2 Import Express, CORS, dotenv, and all service modules
  - [x] 6.3 Initialize Express app and configure middleware (CORS, JSON parsing)
  - [x] 6.4 Create POST `/api/generate` endpoint
  - [x] 6.5 In `/api/generate`: Extract YouTube URL from request body
  - [x] 6.6 Call youtubeService to extract transcript
  - [x] 6.7 Call openaiService to extract quotes from transcript
  - [x] 6.8 Call dalleService to generate all quote cards in parallel
  - [x] 6.9 Download and process each DALL-E image to 1080x1080
  - [x] 6.10 Convert processed images to base64 or save temporarily and return URLs
  - [x] 6.11 Return JSON response with array of image data/URLs
  - [x] 6.12 Add comprehensive error handling with appropriate HTTP status codes
  - [x] 6.13 Set up Express server to listen on port from .env (default 3000)
  - [x] 6.14 Add health check endpoint GET `/api/health`

- [x] 7.0 Create frontend user interface
  - [x] 7.1 Create `index.html` file with basic HTML5 structure
  - [x] 7.2 Add meta tags for responsive design and SEO
  - [x] 7.3 Create header with app title "YouTube Quote Card Generator"
  - [x] 7.4 Create main section with YouTube URL input field and submit button
  - [x] 7.5 Create loading indicator section (hidden by default)
  - [x] 7.6 Create results section with gallery grid for displaying quote cards (hidden by default)
  - [x] 7.7 Add "Download All" button in results section
  - [x] 7.8 Create `styles.css` file
  - [x] 7.9 Implement minimalist, clean design with responsive layout
  - [x] 7.10 Style input field, button, and cards gallery with modern aesthetics
  - [x] 7.11 Add mobile-responsive CSS (media queries for tablets and phones)
  - [x] 7.12 Create `app.js` file for frontend JavaScript
  - [x] 7.13 Add event listener for form submission
  - [x] 7.14 Implement `generateQuoteCards(youtubeUrl)` function to call backend API
  - [x] 7.15 Display loading indicator when processing starts
  - [x] 7.16 Handle API response and display quote cards in gallery
  - [x] 7.17 Add individual download buttons for each card
  - [x] 7.18 Implement "Download All" functionality (zip or sequential downloads)
  - [x] 7.19 Link CSS and JS files in HTML

- [x] 8.0 Implement error handling and loading states
  - [x] 8.1 Create error message UI component in HTML (hidden by default)
  - [x] 8.2 In `app.js`, implement `showError(message)` function to display errors
  - [x] 8.3 In `app.js`, implement `showLoading()` and `hideLoading()` functions
  - [x] 8.4 Add loading progress indicators for different phases (transcript, quotes, images)
  - [x] 8.5 Handle backend API errors and display user-friendly messages
  - [x] 8.6 Handle network errors (fetch failures)
  - [x] 8.7 Create `backend/utils/errorHandler.js` middleware
  - [x] 8.8 Implement centralized error handling in Express
  - [x] 8.9 Log errors on backend for debugging
  - [x] 8.10 Add timeout handling for long-running requests (>2 minutes)

- [x] 9.0 Add input validation and security measures
  - [x] 9.1 Create `backend/utils/validation.js` file
  - [x] 9.2 Implement `validateYouTubeUrl(url)` function with regex validation
  - [x] 9.3 Implement input sanitization to prevent injection attacks
  - [x] 9.4 Add validation middleware to `/api/generate` endpoint
  - [x] 9.5 Create `backend/utils/rateLimiter.js` file
  - [x] 9.6 Configure express-rate-limit (e.g., 5 requests per 15 minutes per IP)
  - [x] 9.7 Apply rate limiter middleware to `/api/generate` endpoint
  - [x] 9.8 Add frontend validation for YouTube URL format before submission
  - [x] 9.9 Implement CORS configuration to allow only specific origins (or wildcard for development)
  - [x] 9.10 Ensure .env file is in .gitignore and API keys are never exposed

- [x] 10.0 Testing and optimization
  - [x] 10.1 Test with various YouTube video URLs (short videos, long videos, different content types)
  - [x] 10.2 Verify transcript extraction works correctly
  - [x] 10.3 Verify 3-5 quotes are extracted and are high quality
  - [x] 10.4 Verify DALL-E generates visually diverse quote cards
  - [x] 10.5 Verify images are correctly resized to 1080x1080px
  - [x] 10.6 Test download functionality (individual and "Download All")
  - [x] 10.7 Test error handling (invalid URLs, videos without transcripts, API failures)
  - [x] 10.8 Test rate limiting functionality
  - [x] 10.9 Test responsive design on mobile, tablet, and desktop
  - [x] 10.10 Optimize parallel DALL-E calls for performance
  - [x] 10.11 Verify total processing time is under 120 seconds
  - [x] 10.12 Update README.md with final setup and usage instructions
