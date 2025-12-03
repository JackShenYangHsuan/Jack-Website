# Tasks: SpeakCoach v0.1

## Relevant Files

### Core Application
- `index.html` - Main HTML file with all screen layouts
- `styles/main.css` - Global styles, variables, and responsive breakpoints
- `styles/components.css` - Component-specific styles (buttons, cards, timer, hints)
- `js/app.js` - Main application logic, state management, and screen transitions
- `js/topics.js` - Topic bank data and random selection logic
- `js/recorder.js` - MediaRecorder integration and audio capture
- `js/liveHints.js` - Real-time streaming transcription and hint detection
- `js/analyzer.js` - API integration for transcription and GPT analysis
- `js/ui.js` - DOM manipulation and UI rendering helpers

### API / Serverless Functions
- `api/transcribe.js` - Serverless function for Whisper API (keeps API key secure)
- `api/analyze.js` - Serverless function for GPT-4 analysis

### Data
- `data/topics.json` - Topic bank with 80+ topics across 4 categories

### Configuration
- `.env.local` - Environment variables (API keys) - not committed
- `.env.example` - Example environment file for documentation
- `package.json` - Project dependencies and scripts
- `vercel.json` - Vercel deployment configuration (if using Vercel)

### Tests
- `js/topics.test.js` - Unit tests for topic generator
- `js/recorder.test.js` - Unit tests for recorder module
- `js/liveHints.test.js` - Unit tests for hint detection logic
- `js/analyzer.test.js` - Unit tests for API response parsing

### Notes

- This is a vanilla JS project for simplicity; no framework required
- Serverless functions handle API calls to keep keys secure
- Use `npm test` to run Jest tests
- Use `npm run dev` for local development server
- Audio is stored in memory only (not persisted)

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [x] **0.0 Create feature branch**
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/speakcoach-v0.1`

- [x] **1.0 Set up project structure and configuration**
  - [x] 1.1 Initialize npm project with `npm init -y`
  - [x] 1.2 Create folder structure: `styles/`, `js/`, `api/`, `data/`
  - [x] 1.3 Install dev dependencies: `npm install --save-dev jest live-server`
  - [x] 1.4 Create `.env.example` with placeholder keys (`OPENAI_API_KEY=your_key_here`)
  - [x] 1.5 Create `.gitignore` (include `.env.local`, `node_modules/`)
  - [x] 1.6 Create base `index.html` with meta tags, viewport, and favicon placeholder
  - [x] 1.7 Create `styles/main.css` with CSS reset, variables, and base typography
  - [x] 1.8 Create `vercel.json` for serverless function routing
  - [x] 1.9 Add npm scripts to `package.json`: `dev`, `test`, `build`

- [x] **2.0 Build landing page**
  - [x] 2.1 Add landing screen HTML structure to `index.html` (hero section with mic icon)
  - [x] 2.2 Add tagline: "Practice clear, confident communication"
  - [x] 2.3 Create primary "Start Practice" button with hover/active states
  - [x] 2.4 Style landing page (centered layout, calming colors, large typography)
  - [x] 2.5 Make landing page responsive (mobile-first)
  - [x] 2.6 Add click handler to transition from landing to topic screen

- [x] **3.0 Implement topic generator system**
  - [x] 3.1 Create `data/topics.json` with 80+ topics (20 per category: opinion, story, explain, persuade)
  - [x] 3.2 Create `js/topics.js` with function to load and parse topics
  - [x] 3.3 Implement `getRandomTopic(category?)` function that returns topic + category
  - [x] 3.4 Build topic screen HTML (category label, topic text, buttons)
  - [x] 3.5 Style topic screen (card layout, readable topic text)
  - [x] 3.6 Implement "Different Topic" button to regenerate random topic
  - [x] 3.7 Add "Enable live hints" checkbox/toggle with default OFF
  - [x] 3.8 Create "Start Speaking" button to transition to recording screen
  - [ ] 3.9 Write unit tests for `getRandomTopic()` in `js/topics.test.js`

- [x] **4.0 Build recording interface with countdown timer**
  - [x] 4.1 Create recording screen HTML (timer display, mic icon, stop button)
  - [x] 4.2 Implement `requestMicrophonePermission()` in `js/recorder.js`
  - [x] 4.3 Handle permission denied state with user-friendly message
  - [x] 4.4 Implement `startRecording()` using MediaRecorder API
  - [x] 4.5 Create countdown timer (60 → 0) with visual display (mm:ss format)
  - [x] 4.6 Add circular progress indicator around timer
  - [x] 4.7 Create pulsing mic animation CSS for recording state
  - [x] 4.8 Implement `stopRecording()` and return audio Blob
  - [x] 4.9 Add auto-stop when timer reaches 0
  - [x] 4.10 Store audio Blob in app state (session memory)
  - [x] 4.11 Implement minimum recording check (warn if < 10 seconds)
  - [ ] 4.12 Write unit tests for timer logic in `js/recorder.test.js`

- [x] **5.0 Implement live hints system (real-time feedback)**
  - [x] 5.1 Create `js/liveHints.js` module
  - [x] 5.2 Implement chunked audio streaming to transcription API
  - [x] 5.3 Create `detectHints(transcript)` function with rules for:
    - Filler words (um, uh, like, you know, basically, actually)
    - Long sentences (> 20 words without pause)
    - Rambling detection (no clear point after 20 seconds)
    - Missing example (claim without support)
  - [x] 5.4 Build hint overlay UI component (toast-style, non-blocking)
  - [x] 5.5 Position hints at top or bottom of recording screen
  - [x] 5.6 Implement 3-second auto-dismiss for hints
  - [x] 5.7 Add rate limiting (max 1 hint per 5 seconds to avoid spam)
  - [x] 5.8 Connect live hints toggle to enable/disable streaming
  - [ ] 5.9 Write unit tests for `detectHints()` in `js/liveHints.test.js`

- [x] **6.0 Integrate speech-to-text transcription and AI analysis**
  - [x] 6.1 Create `api/transcribe.js` serverless function
  - [x] 6.2 Implement Whisper API call (accept audio blob, return transcript)
  - [x] 6.3 Handle transcription errors (timeout, invalid audio, API error)
  - [x] 6.4 Create `api/analyze.js` serverless function
  - [x] 6.5 Build GPT-4 prompt template (from PRD Appendix B)
  - [x] 6.6 Implement GPT API call with structured JSON response
  - [x] 6.7 Validate and parse API response JSON
  - [x] 6.8 Handle analysis errors gracefully (fallback message)
  - [x] 6.9 Create `js/analyzer.js` client module to call serverless functions
  - [x] 6.10 Implement `transcribeAudio(blob)` function
  - [x] 6.11 Implement `analyzeTranscript(transcript, topic)` function
  - [x] 6.12 Add loading state while APIs process
  - [ ] 6.13 Write unit tests for response parsing in `js/analyzer.test.js`

- [x] **7.0 Build feedback display screen**
  - [x] 7.1 Create feedback screen HTML structure (card-based layout)
  - [x] 7.2 Build "Main Point" section with quote-style display
  - [x] 7.3 Build "Structure" section with checkmarks/warnings:
    - ✓ or ⚠️ for clear claim
    - ✓ or ⚠️ for supporting reason
    - ✓ or ⚠️ for example
    - Pattern detected label
  - [x] 7.4 Build "Fillers" section with count badge and word list
  - [x] 7.5 Build "Long Sentences" section with count and examples (collapsible)
  - [x] 7.6 Build "Suggested Rewrite" section with highlighted text box
  - [x] 7.7 Style feedback cards (icons, spacing, visual hierarchy)
  - [x] 7.8 Add "Try Again" button (same topic)
  - [x] 7.9 Add "New Topic" button (different topic)
  - [x] 7.10 Make feedback screen scrollable on mobile
  - [x] 7.11 Add subtle animations for feedback appearance

- [x] **8.0 Implement session flow and state management**
  - [x] 8.1 Create app state object in `js/app.js`:
    - `currentScreen`: 'landing' | 'topic' | 'recording' | 'feedback'
    - `currentTopic`: { text, category }
    - `audioBlob`: Blob | null
    - `transcript`: string | null
    - `feedback`: object | null
    - `hintsEnabled`: boolean
  - [x] 8.2 Implement `showScreen(screenName)` function
  - [x] 8.3 Add CSS for screen transitions (fade or slide)
  - [x] 8.4 Wire "Start Practice" → topic screen
  - [x] 8.5 Wire "Start Speaking" → recording screen (with permission check)
  - [x] 8.6 Wire recording complete → feedback screen (with API calls)
  - [x] 8.7 Wire "Try Again" → recording screen (same topic, clear audio)
  - [x] 8.8 Wire "New Topic" → topic screen (new topic, clear all)
  - [x] 8.9 Implement `resetSession()` to clear audio and feedback data
  - [x] 8.10 Add loading spinner component for API wait states
  - [x] 8.11 Handle edge case: user navigates away during recording

- [ ] **9.0 Testing, responsive polish, and deployment**
  - [ ] 9.1 Test full flow on Chrome desktop
  - [ ] 9.2 Test full flow on Safari desktop
  - [ ] 9.3 Test full flow on Firefox desktop
  - [ ] 9.4 Test full flow on iOS Safari (iPhone)
  - [ ] 9.5 Test full flow on Chrome Android
  - [ ] 9.6 Fix any responsive layout issues found
  - [ ] 9.7 Verify all touch targets are ≥ 44x44px
  - [ ] 9.8 Test microphone permission denied flow
  - [ ] 9.9 Test API failure scenarios (show user-friendly errors)
  - [ ] 9.10 Test with very short recording (< 10 seconds)
  - [ ] 9.11 Test with full 60-second recording
  - [ ] 9.12 Measure and optimize: page load < 2 seconds
  - [ ] 9.13 Measure and optimize: feedback generation < 5 seconds
  - [ ] 9.14 Run all unit tests and fix failures
  - [ ] 9.15 Deploy to Vercel (or Netlify)
  - [ ] 9.16 Test deployed version end-to-end
  - [ ] 9.17 Update README with setup and usage instructions

---

## Summary

| Phase | Tasks | Est. Complexity |
|-------|-------|-----------------|
| 0 | Branch setup | Low |
| 1 | Project setup | Low |
| 2 | Landing page | Low |
| 3 | Topic generator | Medium |
| 4 | Recording interface | High |
| 5 | Live hints | High |
| 6 | API integration | High |
| 7 | Feedback screen | Medium |
| 8 | State management | Medium |
| 9 | Testing & deploy | Medium |

**Total sub-tasks:** 89
