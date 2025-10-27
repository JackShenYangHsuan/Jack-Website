# DayStory — Technical Plan & Product Requirements Document

**Product Tagline:** "Your day, told like a Pixar movie."

---

## 1. Executive Summary

**DayStory** is a web application that transforms Google Calendar events into personalized, Pixar-style video vlogs using OpenAI's Sora and GPT-4o. Users can select any day from their calendar, choose a character archetype, and receive a short cinematic video narrating their day's events.

### Key Features
- Google Calendar integration (OAuth2)
- Day picker with event visualization
- 5 Pixar-style character archetypes
- AI-generated narrative scripts (GPT-4o)
- Video generation (OpenAI Sora)
- Video gallery with download/share capabilities

---

## 2. Product Requirements

### 2.1 User Flow

```
1. Sign-In
   └─> Google OAuth2 (calendar.readonly scope)

2. Calendar Sync
   └─> Fetch events (90 days past, 30 days future)
   └─> Display in timeline UI

3. Day Selection
   └─> User taps specific day
   └─> View event summary
   └─> Optional: Add personal note

4. Personalization
   └─> Enter name
   └─> Choose character archetype (1 of 5)

5. Video Generation
   └─> Backend creates narrative script (GPT-4o)
   └─> Generate video prompt for Sora
   └─> Process video (10-20 seconds)
   └─> Display in gallery

6. Share/Download
   └─> Download MP4
   └─> Share link to social media
```

### 2.2 Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Google Calendar OAuth | Read-only access to user calendar | P0 |
| Day Picker UI | Interactive timeline/calendar view | P0 |
| Event Summarization | GPT-4o summarizes day's events into narrative | P0 |
| Character Selection | 5 Pixar-style character archetypes | P0 |
| Script Generation | AI-generated narration script | P0 |
| Video Generation | Sora API integration for Pixar-style video | P0 |
| Video Gallery | Store and replay generated vlogs | P1 |
| Download/Share | Export MP4, share on social media | P1 |
| Custom Notes | User-added context for better storytelling | P1 |
| Multi-day Stories | Combine multiple days into one video | P2 |

---

## 3. Technical Architecture

### 3.1 System Architecture

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────┐
│   Next.js   │
│   Frontend  │
└──────┬──────┘
       │
       │ API Routes
       │
┌──────▼──────────────────────────┐
│      Backend API (Node.js)      │
│                                  │
│  ┌────────────┐  ┌────────────┐ │
│  │  Auth      │  │  Calendar  │ │
│  │  Service   │  │  Service   │ │
│  └────────────┘  └────────────┘ │
│                                  │
│  ┌────────────┐  ┌────────────┐ │
│  │  Script    │  │  Video     │ │
│  │  Generator │  │  Generator │ │
│  └────────────┘  └────────────┘ │
└─────────┬────────────────────────┘
          │
    ┌─────┼──────────┐
    │     │          │
┌───▼──┐ ┌▼────┐ ┌──▼────┐
│Google│ │OpenAI│ │Firebase│
│OAuth2│ │ API  │ │Storage│
└──────┘ └──────┘ └───────┘
```

### 3.2 Tech Stack

#### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React Context + Zustand
- **Calendar UI:** react-big-calendar or FullCalendar
- **Video Player:** react-player or video.js
- **HTTP Client:** Axios

#### Backend
- **Runtime:** Node.js 20+
- **Framework:** Next.js API Routes
- **Authentication:** next-auth (Google OAuth2 provider)
- **Validation:** Zod
- **Rate Limiting:** upstash/ratelimit

#### External Services
- **Calendar:** Google Calendar API v3
- **AI Text:** OpenAI GPT-4o API
- **AI Video:** OpenAI Sora API (when available)
- **Storage:** Firebase Storage or AWS S3
- **Database:** Firebase Firestore or PostgreSQL (Supabase)

#### Deployment
- **Hosting:** Vercel
- **CDN:** Vercel Edge Network
- **Monitoring:** Vercel Analytics + Sentry
- **CI/CD:** GitHub Actions

---

## 4. Database Schema

### 4.1 Firestore Collections

```javascript
// users collection
{
  userId: string,                    // Google OAuth user ID
  email: string,
  name: string,
  createdAt: timestamp,
  lastLogin: timestamp,
  settings: {
    defaultCharacter: string,
    notificationsEnabled: boolean
  }
}

// videos collection
{
  videoId: string,                   // Auto-generated
  userId: string,                    // Foreign key to users
  date: string,                      // YYYY-MM-DD
  characterType: string,             // e.g., "explorer", "dreamer"
  userName: string,
  events: [
    {
      title: string,
      startTime: timestamp,
      endTime: timestamp,
      location: string,
      description: string
    }
  ],
  userNote: string,                  // Optional custom note
  generatedScript: string,           // GPT-4o output
  soraPrompt: string,                // Sora API prompt
  videoUrl: string,                  // Storage URL
  thumbnailUrl: string,
  status: string,                    // "processing" | "completed" | "failed"
  createdAt: timestamp,
  processingTime: number,            // Seconds
  shareToken: string                 // For public sharing
}

// calendar_sync collection
{
  userId: string,
  lastSyncTime: timestamp,
  syncToken: string,                 // Google Calendar sync token
  eventsCount: number
}
```

---

## 5. API Specifications

### 5.1 Authentication Endpoints

```
POST /api/auth/google
Description: Initiate Google OAuth2 flow
Response: { redirectUrl: string }

GET /api/auth/callback
Description: Handle OAuth2 callback
Response: { success: boolean, user: User }

POST /api/auth/logout
Description: Sign out user
Response: { success: boolean }
```

### 5.2 Calendar Endpoints

```
GET /api/calendar/sync
Description: Sync Google Calendar events
Auth: Required
Response: {
  success: boolean,
  eventsCount: number,
  lastSyncTime: timestamp
}

GET /api/calendar/events?date=YYYY-MM-DD
Description: Get events for a specific day
Auth: Required
Response: { events: CalendarEvent[] }

GET /api/calendar/timeline?from=YYYY-MM-DD&to=YYYY-MM-DD
Description: Get events for a date range
Auth: Required
Response: { days: DayWithEvents[] }
```

### 5.3 Video Generation Endpoints

```
POST /api/video/generate
Description: Generate video from calendar events
Auth: Required
Body: {
  date: string,              // YYYY-MM-DD
  characterType: string,     // "explorer" | "dreamer" | etc.
  userName: string,
  userNote?: string
}
Response: {
  videoId: string,
  status: "processing"
}

GET /api/video/:videoId
Description: Get video details and status
Auth: Required
Response: {
  video: Video,
  status: "processing" | "completed" | "failed"
}

GET /api/video/:videoId/download
Description: Get signed URL for video download
Auth: Required
Response: { downloadUrl: string }

POST /api/video/:videoId/share
Description: Generate public share link
Auth: Required
Response: { shareUrl: string }
```

### 5.4 User Endpoints

```
GET /api/user/videos
Description: Get user's video gallery
Auth: Required
Response: { videos: Video[] }

DELETE /api/user/videos/:videoId
Description: Delete a video
Auth: Required
Response: { success: boolean }
```

---

## 6. Character Archetypes

### Character Design Specifications

| Character | Personality | Visual Style | Color Palette | Voice Type |
|-----------|-------------|--------------|---------------|------------|
| **Adventurous Explorer** | Bold, curious, optimistic | Up-inspired: Vintage, nostalgic | Warm browns, sky blues, golden yellows | Energetic, warm male |
| **Creative Dreamer** | Imaginative, emotional, artistic | Inside Out-inspired: Colorful, abstract | Vibrant purples, pinks, blues | Soft, thoughtful female |
| **Curious Scientist** | Analytical, resourceful, gentle | Wall-E-inspired: Retro-futuristic | Rusted oranges, greens, metallic grays | Calm, deep male |
| **Kindhearted Friend** | Loyal, supportive, playful | Toy Story-inspired: Classic, wholesome | Primary colors: red, blue, yellow | Friendly, upbeat neutral |
| **Determined Hero** | Passionate, ambitious, resilient | Turning Red-inspired: Modern, bold | Bright reds, teals, neon accents | Confident, youthful female |

---

## 7. OpenAI Integration

### 7.1 GPT-4o Script Generation

**Prompt Template:**
```
You are a Pixar screenwriter creating a 10-second narrated vlog.

User Details:
- Name: {{userName}}
- Character Archetype: {{characterType}}
- Date: {{date}}

Calendar Events:
{{#each events}}
- {{startTime}} - {{endTime}}: {{title}} at {{location}}
  Description: {{description}}
{{/each}}

User Note: {{userNote}}

Task:
Write a warm, heartfelt narration script (30-50 words) that:
1. Captures the essence of {{userName}}'s day
2. Reflects the {{characterType}} personality
3. Uses visual storytelling language suitable for Pixar animation
4. Ends with an emotional or reflective closing line

Output only the narration script, no additional commentary.
```

**Example API Call:**
```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "You are a Pixar screenwriter creating narrated vlogs."
    },
    {
      role: "user",
      content: compiledPrompt
    }
  ],
  temperature: 0.8,
  max_tokens: 150
});

const script = response.choices[0].message.content;
```

### 7.2 Sora Video Generation

**Prompt Template:**
```
Create a colorful Pixar-style {{duration}}-second cinematic vlog with the following specifications:

CHARACTER:
- Name: {{userName}}
- Style: {{characterType}} ({{characterDescription}})
- Visual reference: {{pixarMovieReference}}

STORY & SCENES:
Date: {{date}}
Events:
{{#each events}}
- Scene {{index}}: {{visualDescription}}
{{/each}}

VISUAL STYLE:
- Animation: High-quality Pixar CGI with soft lighting
- Color palette: {{colorPalette}}
- Camera movements: Dynamic, cinematic (crane shots, dolly moves, close-ups)
- Lighting: {{lightingStyle}} (golden hour, soft shadows, volumetric light rays)
- Details: {{specificDetails}}

NARRATION:
Voice: {{voiceType}}
Script: "{{generatedScript}}"

END CARD:
Text overlay: "{{userName}}'s Day — {{formattedDate}}"
Style: Elegant, animated text with subtle glow

TONE: {{tone}} (heartfelt, curious, nostalgic, uplifting)
```

**Example Filled Prompt:**
```
Create a colorful Pixar-style 15-second cinematic vlog with the following specifications:

CHARACTER:
- Name: Luna
- Style: Curious Scientist (Wall-E-inspired)
- Visual reference: Wall-E's earth with retro-futuristic elements

STORY & SCENES:
Date: October 25, 2025
Events:
- Scene 1: Morning at Blue Bottle Coffee near Salesforce Tower - steaming coffee cup with city skyline reflection
- Scene 2: Midday meeting with LeapingAI team - animated holographic screens and collaborative energy
- Scene 3: Evening at Berkeley Hills - watching golden sunset over San Francisco Bay

VISUAL STYLE:
- Animation: High-quality Pixar CGI with soft, warm lighting
- Color palette: Rusted oranges, greens, metallic grays with golden hour warmth
- Camera movements: Start with close-up of coffee, crane up to city view, cut to meeting room wide shot, end with sweeping sunset panorama
- Lighting: Golden hour throughout, soft shadows, volumetric light rays through windows
- Details: Steam wisps from coffee, glowing screens, lens flare on sunset, small mechanical details

NARRATION:
Voice: Calm, deep male voice
Script: "In a city that never slows down, Luna found calm between the hum of machines and the glow of sunset. A day measured not in hours, but in moments worth remembering."

END CARD:
Text overlay: "Luna's Day — October 25, 2025"
Style: Elegant serif font with soft white glow, fading in over sunset scene

TONE: Reflective, nostalgic, quietly hopeful
```

**API Integration (Conceptual):**
```javascript
// Note: Sora API is not yet publicly available
// This is a conceptual implementation

const soraResponse = await openai.sora.generate({
  prompt: compiledSoraPrompt,
  duration: 15, // seconds
  aspectRatio: "16:9",
  style: "cinematic",
  quality: "high"
});

const videoUrl = soraResponse.video_url;
```

---

## 8. Implementation Phases

### Phase 1: MVP (Weeks 1-3)
**Goal:** Basic working prototype

- [ ] Set up Next.js project with Tailwind CSS
- [ ] Implement Google OAuth2 authentication
- [ ] Integrate Google Calendar API
- [ ] Build simple day picker UI
- [ ] Create GPT-4o script generation
- [ ] Mock Sora video generation (use stock footage or simple animations)
- [ ] Basic video display

**Deliverable:** Working demo with mock videos

### Phase 2: Core Features (Weeks 4-6)
**Goal:** Complete core user experience

- [ ] Implement all 5 character archetypes
- [ ] Build video gallery with Firestore
- [ ] Add video download functionality
- [ ] Implement proper error handling
- [ ] Create loading states and animations
- [ ] Add user settings page
- [ ] Optimize calendar sync (incremental sync with sync tokens)

**Deliverable:** Feature-complete beta version

### Phase 3: Sora Integration (Weeks 7-8)
**Goal:** Replace mock videos with real Sora generation

- [ ] Integrate OpenAI Sora API
- [ ] Implement video processing queue
- [ ] Add webhook handling for async video generation
- [ ] Create retry logic for failed generations
- [ ] Optimize prompt engineering for best results

**Deliverable:** Production-ready with real video generation

### Phase 4: Polish & Launch (Weeks 9-10)
**Goal:** Launch-ready product

- [ ] UI/UX refinement
- [ ] Add share functionality (social media, email)
- [ ] Implement rate limiting
- [ ] Security audit
- [ ] Performance optimization
- [ ] Create landing page
- [ ] Write documentation
- [ ] Beta testing with 20-50 users

**Deliverable:** Public launch

### Phase 5: Post-Launch Features (Future)
- [ ] Multi-day story compilation
- [ ] Custom character uploads
- [ ] Music selection
- [ ] Video editing (trim, adjust)
- [ ] Collaboration features (shared calendars)
- [ ] Mobile app (React Native)

---

## 9. Security Considerations

### 9.1 Authentication & Authorization
- Use `next-auth` with secure session management
- Store OAuth tokens encrypted in database
- Implement CSRF protection
- Use HTTP-only cookies for session tokens

### 9.2 Data Privacy
- Request minimal calendar permissions (read-only)
- Never store raw calendar data permanently
- Allow users to delete all their data
- GDPR compliance: data export and deletion

### 9.3 API Security
- Rate limiting per user/IP (Upstash Redis)
- API key rotation for OpenAI
- Input validation with Zod
- Sanitize user inputs to prevent prompt injection

### 9.4 Video Storage
- Signed URLs with expiration (1 hour)
- Private by default, public only via share token
- Automatic deletion of videos after 30 days (optional)

---

## 10. Performance Optimization

### 10.1 Frontend
- Code splitting with Next.js dynamic imports
- Image optimization with next/image
- Lazy load video gallery
- Implement skeleton loading states
- Cache calendar events in IndexedDB

### 10.2 Backend
- Calendar API response caching (Redis, 5-minute TTL)
- Batch calendar requests
- Use incremental sync with Google Calendar sync tokens
- Implement job queue for video generation (Bull MQ)

### 10.3 Video Processing
- Generate thumbnail during video creation
- Compress videos for web delivery (H.264)
- Use CDN for video distribution (Cloudflare/Vercel)
- Implement progressive video loading

---

## 11. Testing Strategy

### 11.1 Unit Tests (Jest + React Testing Library)
- Calendar date parsing logic
- Character selection logic
- Script generation formatting
- API response validation

### 11.2 Integration Tests
- Google OAuth flow
- Calendar API integration
- OpenAI API integration
- Video upload to storage

### 11.3 E2E Tests (Playwright)
- Complete user flow: sign in → select day → generate video
- Video gallery operations
- Download/share functionality

### 11.4 Manual Testing
- Test with various calendar event types
- Test with empty days (no events)
- Test with days having 10+ events
- Cross-browser testing (Chrome, Safari, Firefox)

---

## 12. Cost Estimation

### 12.1 Per-User Costs

| Service | Cost Per Video | Notes |
|---------|----------------|-------|
| GPT-4o API | ~$0.01 | ~500 input tokens, ~150 output tokens |
| Sora API | ~$1.00 - $2.00 | Estimated (not yet released) |
| Firebase Storage | ~$0.02 | 50MB video for 30 days |
| Firebase Firestore | <$0.01 | Document reads/writes |
| **Total per video** | **~$1.05 - $2.05** | |

### 12.2 Monthly Infrastructure (100 active users, 5 videos/month)

| Service | Cost |
|---------|------|
| Vercel Pro | $20 |
| Firebase Blaze | ~$50 (storage + bandwidth) |
| OpenAI API | ~$500 (500 videos × $1.00) |
| Domain + SSL | $15 |
| **Total** | **~$585/month** |

### 12.3 Monetization Strategy
- **Freemium:** 2 free videos/month, $9.99/month for unlimited
- **One-time credits:** $2.99 for 5 videos
- Break-even at ~60 paying subscribers

---

## 13. Deployment Plan

### 13.1 Development Environment
```bash
# Local setup
npm install
npm run dev

# Environment variables (.env.local)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xxx
OPENAI_API_KEY=xxx
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY=xxx
```

### 13.2 Staging Environment (Vercel Preview)
- Automatic deployments on PR
- Test environment variables
- Separate Firebase project

### 13.3 Production Environment (Vercel)
- Main branch auto-deploys to production
- Environment variables in Vercel dashboard
- Production Firebase project
- Custom domain: daystory.app
- Enable Vercel Analytics and Web Vitals

### 13.4 Monitoring
- Sentry for error tracking
- Vercel Analytics for performance
- Custom logging for video generation success/failure
- Set up alerts for API failures

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sora API not available/delayed | High | Start with mock videos, alternative: Runway ML or Stable Video Diffusion |
| High Sora API costs | High | Implement strict rate limiting, freemium model |
| Google Calendar API rate limits | Medium | Implement incremental sync, cache aggressively |
| Poor video quality | Medium | Extensive prompt engineering, add manual refinement option |
| Slow video generation (>5 min) | Medium | Set expectations, implement email notifications when ready |
| Privacy concerns | High | Transparent data policy, minimal data retention, SOC 2 compliance |

---

## 15. Success Metrics

### 15.1 Product Metrics
- **Activation:** % of users who generate their first video
- **Engagement:** Average videos generated per user per month
- **Retention:** D7, D30 retention rates
- **Share Rate:** % of videos shared

### 15.2 Technical Metrics
- Video generation success rate (target: >95%)
- Average generation time (target: <3 minutes)
- API uptime (target: 99.9%)
- Page load time (target: <2 seconds)

### 15.3 Business Metrics
- Cost per video
- Conversion rate (free → paid)
- Monthly recurring revenue (MRR)
- Customer lifetime value (LTV)

---

## 16. Future Enhancements

### 16.1 Short-term (3-6 months)
- Multiple video styles (documentary, comedy, thriller)
- Custom background music selection
- Video editing tools (trim, adjust scenes)
- Share to TikTok, Instagram Stories, YouTube Shorts

### 16.2 Medium-term (6-12 months)
- Mobile app (iOS + Android)
- Team/family shared calendars
- Automated weekly/monthly recap videos
- Integration with other calendar services (Outlook, Apple Calendar)

### 16.3 Long-term (12+ months)
- AI-powered life story compilation (year in review)
- Custom character creation (upload your own avatar)
- Voice cloning for personalized narration
- B2B version (company event vlogs, team retrospectives)

---

## 17. Appendix

### 17.1 Useful Resources
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Next.js Documentation](https://nextjs.org/docs)
- [next-auth Documentation](https://next-auth.js.org/)
- [Firebase Documentation](https://firebase.google.com/docs)

### 17.2 Design References
- Pixar Animation Studios: Up, Inside Out, Wall-E, Toy Story, Turning Red
- Video creation apps: Veed.io, Descript, Kapwing
- Calendar apps: Notion Calendar, Fantastical, Google Calendar

### 17.3 Development Timeline Summary
```
Week 1-3:   MVP with mock videos
Week 4-6:   Core features + polish
Week 7-8:   Sora integration
Week 9-10:  Launch preparation
Week 10:    Public Beta Launch
```

---

**Document Version:** 1.0
**Last Updated:** October 26, 2025
**Author:** DayStory Team
**Next Review:** After MVP completion
