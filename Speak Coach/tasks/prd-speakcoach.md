# PRD: SpeakCoach v0.1

## 1. Introduction/Overview

**SpeakCoach** is a practice tool that helps users improve their verbal communication skills. Users receive a random topic, speak for 30–60 seconds, and get instant, actionable feedback on clarity, structure, filler words, and delivery.

**Problem:** Many people struggle with concise, confident communication in high-stakes situations (interviews, meetings, pitches). Traditional practice requires a partner or coach. SpeakCoach provides on-demand, private practice with immediate AI-powered feedback.

**Solution:** A lightweight web app that acts as a personal speech coach—giving users topics, recording their responses, and delivering structured feedback to help them improve over time.

---

## 2. Goals

1. Enable users to complete a full practice session (topic → record → feedback) in under 2 minutes
2. Provide actionable feedback that users can immediately apply to their next attempt
3. Achieve a target of 3 practice sessions per user per week
4. Help users reduce filler words and improve clarity score over 10 sessions

---

## 3. User Stories

### US-1: Start a Practice Session
> As a user, I want to quickly start a practice session so I can improve my speaking without setup friction.

**Acceptance Criteria:**
- User can start a session from the landing page with one click
- No login or account creation required
- Session begins within 3 seconds of clicking "Start"

### US-2: Receive a Random Topic
> As a user, I want to receive a random speaking topic so I can practice thinking on my feet.

**Acceptance Criteria:**
- System displays a topic from one of four categories: opinion, story, explain, persuade
- User can request a different topic if desired
- Topic is clearly displayed with the category labeled

### US-3: Record My Speech
> As a user, I want to record my response so the app can analyze my speaking.

**Acceptance Criteria:**
- User sees a visible countdown timer (60 seconds max)
- User can stop recording early (minimum 30 seconds recommended)
- Recording auto-stops at 60 seconds
- Visual indicator shows recording is active (e.g., pulsing mic icon)
- Browser requests microphone permission on first use

### US-4: Receive Live Hints While Speaking
> As a user, I want optional real-time nudges while speaking so I can self-correct in the moment.

**Acceptance Criteria:**
- Live hints can be toggled on/off before recording starts
- Hints appear as brief, non-intrusive text overlays
- Hint types include:
  - "Shorten this" (when sentences run long)
  - "State your point" (when rambling detected)
  - "Add an example" (when claim lacks support)
  - "Avoid fillers" (when um/uh detected)
- Hints do not interrupt or pause the recording

### US-5: View Instant Feedback
> As a user, I want to see structured feedback after I finish speaking so I know exactly what to improve.

**Acceptance Criteria:**
- Feedback screen appears within 5 seconds of recording end
- Feedback includes:
  - **Main point detected:** One-sentence summary of what the user said
  - **Structure analysis:** Did it follow a clear pattern (setup → action → result OR claim → reason → example)?
  - **Filler count:** Number of filler words (um, uh, like, you know, etc.)
  - **Long sentences:** Sentences that exceeded ~20 words
  - **Suggested rewrite:** A concise 20-second version of their response
- User can tap "Try Again" (same topic) or "New Topic"

### US-6: Practice Again
> As a user, I want to easily retry the same topic or get a new one so I can continue practicing.

**Acceptance Criteria:**
- "Try Again" button reloads the same topic and resets the recorder
- "New Topic" button fetches a fresh random topic
- Session data from previous attempt is cleared

---

## 4. Functional Requirements

### 4.1 Landing Page
| ID | Requirement |
|----|-------------|
| FR-1 | The system must display a landing page with a prominent "Start Practice" button |
| FR-2 | The landing page must include a brief tagline explaining the app's purpose |
| FR-3 | The system must not require login or authentication to use |

### 4.2 Topic Generator
| ID | Requirement |
|----|-------------|
| FR-4 | The system must generate random topics from a predefined bank |
| FR-5 | Topics must be categorized into four types: opinion, story, explain, persuade |
| FR-6 | The system must display the topic type as a label (e.g., "Opinion Question") |
| FR-7 | The system must provide a "Different Topic" button to regenerate |
| FR-8 | The system should have at least 20 topics per category (80 total minimum) |

### 4.3 Recording
| ID | Requirement |
|----|-------------|
| FR-9 | The system must request microphone permission from the browser |
| FR-10 | The system must display a countdown timer starting at 60 seconds |
| FR-11 | The system must show a visual recording indicator (pulsing/animated) |
| FR-12 | The system must allow the user to stop recording manually |
| FR-13 | The system must auto-stop recording at 60 seconds |
| FR-14 | The system must store the audio temporarily (session only) |
| FR-15 | The system must display a "Start Speaking" button to begin recording |

### 4.4 Live Hints
| ID | Requirement |
|----|-------------|
| FR-16 | The system must provide a toggle to enable/disable live hints before recording |
| FR-17 | Live hints must default to OFF |
| FR-18 | When enabled, the system must stream audio to the transcription API in real-time |
| FR-19 | The system must display hint text as a non-blocking overlay |
| FR-20 | Hints must auto-dismiss after 3 seconds |
| FR-21 | The system must detect and hint on: long sentences, filler words, lack of structure, missing examples |

### 4.5 Speech Analysis & Feedback
| ID | Requirement |
|----|-------------|
| FR-22 | The system must transcribe the recorded audio using a cloud API (e.g., OpenAI Whisper) |
| FR-23 | The system must analyze the transcript for: main point, structure, filler words, sentence length |
| FR-24 | The system must generate a suggested 20-second rewrite of the user's response |
| FR-25 | The system must display feedback within 5 seconds of recording completion |
| FR-26 | The system must display filler word count with specific words highlighted |
| FR-27 | The system must identify sentences longer than 20 words |

### 4.6 Post-Feedback Actions
| ID | Requirement |
|----|-------------|
| FR-28 | The system must display a "Try Again" button to retry the same topic |
| FR-29 | The system must display a "New Topic" button to get a different topic |
| FR-30 | The system must clear session audio data when starting a new session |

### 4.7 Responsive Design
| ID | Requirement |
|----|-------------|
| FR-31 | The app must be fully functional on desktop browsers (Chrome, Safari, Firefox) |
| FR-32 | The app must be fully functional on mobile browsers (iOS Safari, Chrome Android) |
| FR-33 | The UI must adapt to screen sizes from 320px to 1920px width |
| FR-34 | Touch targets must be at least 44x44px on mobile |

---

## 5. Non-Goals (Out of Scope for v0.1)

- **User accounts / authentication** — No login, no saved history
- **Session history / progress tracking** — Each session is standalone
- **Style packs** (Chamath, Naval, PG personas) — Deferred to future version
- **Social sharing** — No sharing of results
- **Advanced scoring system** — Keep feedback qualitative, not numeric scores
- **Personalized coaching** — No learning from past sessions
- **Long speeches (>2 min)** — Cap at 60 seconds
- **Offline mode** — Requires internet for transcription API
- **Native mobile apps** — Web-only for v0.1

---

## 6. Design Considerations

### 6.1 UX Flow
```
┌─────────────────────────────────────────────────────────────┐
│  LANDING                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          🎤 SpeakCoach                               │   │
│  │   Practice clear, confident communication            │   │
│  │                                                      │   │
│  │            [ Start Practice ]                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  TOPIC SCREEN                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Opinion Question                                    │   │
│  │  ─────────────────                                   │   │
│  │  "What's one habit everyone should adopt            │   │
│  │   and why?"                                          │   │
│  │                                                      │   │
│  │  [ Different Topic ]                                 │   │
│  │                                                      │   │
│  │  ☐ Enable live hints                                │   │
│  │                                                      │   │
│  │            [ Start Speaking ]                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  RECORDING SCREEN                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │              ◉ 0:45                                  │   │
│  │           (pulsing mic)                              │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────┐            │   │
│  │  │  💡 "Add an example"                │  ← hint    │   │
│  │  └─────────────────────────────────────┘            │   │
│  │                                                      │   │
│  │            [ Stop Recording ]                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FEEDBACK SCREEN                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Your Feedback                                       │   │
│  │  ─────────────                                       │   │
│  │                                                      │   │
│  │  📌 Main Point                                       │   │
│  │  "You argued that journaling improves clarity..."   │   │
│  │                                                      │   │
│  │  🏗️ Structure                                        │   │
│  │  ✓ Clear claim                                       │   │
│  │  ⚠️ Missing concrete example                         │   │
│  │                                                      │   │
│  │  🔇 Fillers: 4 (um, like, you know)                 │   │
│  │                                                      │   │
│  │  📏 Long Sentences: 2                                │   │
│  │                                                      │   │
│  │  ✨ Suggested Rewrite (20 sec)                       │   │
│  │  "Journaling is the one habit everyone should..."   │   │
│  │                                                      │   │
│  │     [ Try Again ]    [ New Topic ]                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Visual Style
- **Theme:** Clean, minimal, calming (not intimidating)
- **Colors:** Neutral background, accent color for CTAs
- **Typography:** Sans-serif, large readable text
- **Mobile-first:** Design for phone screens, scale up for desktop

### 6.3 Key UI Components
- Large, tappable buttons (primary CTA style)
- Countdown timer with circular progress indicator
- Toast/overlay for live hints (non-blocking)
- Card-based feedback sections
- Microphone permission prompt handling

---

## 7. Technical Considerations

### 7.1 Architecture
```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Frontend   │────▶│   Backend    │────▶│  External APIs   │
│  (Web App)   │◀────│  (Optional)  │◀────│                  │
└──────────────┘     └──────────────┘     └──────────────────┘
                                          │ - Whisper API    │
                                          │ - OpenAI GPT     │
                                          │   (for analysis) │
                                          └──────────────────┘
```

### 7.2 Technology Stack (Suggested)
| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | HTML/CSS/JS or React | PWA-capable for mobile |
| Audio Capture | Web Audio API / MediaRecorder | Browser-native |
| Transcription | OpenAI Whisper API | Cloud-based STT |
| Analysis | OpenAI GPT-4 | Prompt-based analysis |
| Hosting | Vercel / Netlify | Static + serverless functions |

### 7.3 API Integration

**Transcription (Whisper):**
- Send audio blob to Whisper API
- Receive transcript text
- For live hints: use streaming/chunked transcription

**Analysis (GPT):**
- Send transcript + structured prompt
- Prompt should request: main point, structure analysis, filler count, long sentences, rewrite
- Return structured JSON for frontend parsing

### 7.4 Key Technical Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Audio format | WebM/Opus or WAV | Browser-native, Whisper-compatible |
| Real-time hints | Streaming transcription | Required for live feedback |
| Audio storage | Session memory only | Privacy, simplicity |
| Backend | Serverless functions | Keep API keys secure, low cost |

### 7.5 Browser APIs Required
- `MediaRecorder` — Audio capture
- `getUserMedia` — Microphone access
- `AudioContext` — Audio processing (if needed for hints)

### 7.6 Performance Targets
- Time to first interaction: < 2 seconds
- Recording start latency: < 500ms
- Feedback generation: < 5 seconds after recording stops

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Session completion rate | > 80% | Users who start → finish feedback |
| Sessions per user per week | 3+ | Anonymous session tracking |
| Feedback load time | < 5 sec | Time from recording stop to feedback display |
| Live hints accuracy | > 70% | User-perceived relevance (future survey) |
| Return rate | > 40% | Users who return within 7 days |

---

## 9. Open Questions

1. **Topic Bank:** Should topics be hardcoded or fetched from an API/database for easier updates?

2. **Live Hints Latency:** Is real-time streaming transcription fast enough for useful hints, or will there be noticeable delay?

3. **Error Handling:** What should happen if:
   - Microphone permission is denied?
   - Transcription API fails?
   - User speaks for less than 10 seconds?

4. **Feedback Depth:** How detailed should structure analysis be? Simple pass/fail or detailed breakdown?

5. **Cost Management:** Should there be any rate limiting to control API costs (e.g., max sessions per day)?

---

## Appendix A: Sample Topic Bank

### Opinion Topics
- What's one habit everyone should adopt and why?
- Is remote work better than office work?
- Should college be free for everyone?
- Is social media doing more harm than good?

### Story Topics
- Tell me about a time you failed and what you learned.
- Describe a moment that changed your perspective.
- Share a story about helping someone unexpected.
- Tell me about your proudest accomplishment.

### Explain Topics
- Explain how a search engine works to a 10-year-old.
- Explain why the sky is blue.
- Explain what makes a good leader.
- Explain how compound interest works.

### Persuade Topics
- Convince me to read more books.
- Convince me to try your favorite hobby.
- Convince me to visit your hometown.
- Convince me to learn a new language.

---

## Appendix B: Feedback Prompt Template (for GPT)

```
Analyze this speech transcript and provide feedback in JSON format:

TRANSCRIPT:
"""
{transcript}
"""

TOPIC:
"""
{topic}
"""

Respond with this exact JSON structure:
{
  "main_point": "One sentence summary of what the speaker argued/explained",
  "structure": {
    "has_clear_claim": true/false,
    "has_supporting_reason": true/false,
    "has_example": true/false,
    "pattern_detected": "claim-reason-example" | "setup-action-result" | "unclear"
  },
  "fillers": {
    "count": number,
    "words": ["um", "like", ...]
  },
  "long_sentences": {
    "count": number,
    "examples": ["First long sentence...", ...]
  },
  "suggested_rewrite": "A concise 20-second version (roughly 50-60 words)"
}
```

---

*Document created: 2024-11-29*
*Version: 0.1*
*Status: Draft*
