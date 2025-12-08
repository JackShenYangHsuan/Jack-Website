# Phase 1: Discovery — Implementation Tasks

**Parent PRD:** Launch-Video-Studio-PRD.md
**Phase Goal:** Extract the emotional story from raw company information through guided chat interview

---

## Overview

Build a real-time chat interface where users engage with an AI creative director that probes for the emotional truth of their company's story, then summarizes into a structured Story Brief.

---

## Design Decisions

| Decision | Choice |
|----------|--------|
| **Project Location** | `/Users/jackshen/Desktop/personal-website/Tell Great Stories/launch-video-studio/` |
| **Design System** | Vercel Geist (https://vercel.com/geist/introduction) |
| **Chat Initiation** | AI starts first with opening question |
| **Story Brief Layout** | Right sidebar (always visible) |
| **Interview Length** | AI decides when it has enough info |
| **Brief Editing** | Inline editing (click field to edit) |
| **Project Cards** | Rich cards (name, status, date, tagline preview, progress indicator) |
| **Brief Generation** | Auto-populate sidebar as AI responds |
| **Restart Option** | Yes, clear all (button to clear chat and start over) |

---

## Task Breakdown

### 1. Project Setup

- [ ] **1.1** Initialize Next.js project with TypeScript
- [ ] **1.2** Set up project structure (app router, components, lib, types)
- [ ] **1.3** Configure Tailwind CSS with Geist design tokens
- [ ] **1.4** Create base layout with sidebar + main content area
- [ ] **1.5** Set up local storage utilities for project persistence

### 2. Settings Page

- [ ] **2.1** Create `/settings` route
- [ ] **2.2** Build settings form UI
  - OpenRouter API key input (password field with show/hide toggle)
  - Default model selector (dropdown with common models)
  - Default duration selector (30 / 60 / 90 seconds)
  - Save button
- [ ] **2.3** Build system prompts editor section
  - Collapsible "Advanced: System Prompts" section
  - Discovery prompt textarea (Phase 1)
  - Style Analysis prompt textarea (Phase 2 - for later)
  - Storyboard prompt textarea (Phase 3 - for later)
  - "Reset to Default" button per prompt
- [ ] **2.4** Implement settings persistence to local JSON file (`~/launch-video-studio/settings.json`)
  - Include `prompts` object with all system prompts
- [ ] **2.5** Add API key validation (test call to OpenRouter)
- [ ] **2.6** Show success/error toast on save

### 3. Project Management

- [ ] **3.1** Create project data model and types
  ```typescript
  interface Project {
    id: string;
    name: string;
    status: 'discover' | 'style' | 'storyboard' | ...;
    createdAt: Date;
    updatedAt: Date;
    storyBrief: StoryBrief | null;
    // ... other phases
  }
  ```
- [ ] **3.2** Create `/projects` route (project list)
- [ ] **3.3** Build "New Project" button and modal
  - Company name input
  - Tagline input
  - Create button
- [ ] **3.4** Implement project CRUD operations
  - Create project (generates UUID, creates folder)
  - List projects (read from `~/launch-video-studio/projects/`)
  - Delete project (with confirmation)
- [ ] **3.5** Create project folder structure on disk
  ```
  ~/launch-video-studio/projects/{id}/
    ├── project.json      # Project metadata + state
    ├── assets/           # Generated images, videos, audio
    └── exports/          # Final rendered videos
  ```
- [ ] **3.6** Build rich project card component
  - Company name
  - Status badge (current phase)
  - Created date
  - Tagline preview (first line)
  - Progress indicator (phases completed)
  - Actions (open, delete)

### 4. Discovery Chat Interface

- [ ] **4.1** Create `/projects/[id]/discover` route
- [ ] **4.2** Build chat UI layout (Geist design system)
  - Left: Message list (scrollable)
  - Left bottom: Input area (textarea + send button)
  - Right: Story Brief sidebar (always visible, ~350px wide)
- [ ] **4.3** Create message components
  - AI message bubble (left-aligned)
  - User message bubble (right-aligned)
  - Typing indicator
- [ ] **4.4** Implement chat state management
  - Message history array
  - Loading state
  - Error state
- [ ] **4.5** Style chat interface (clean, professional, easy to read)

### 5. OpenRouter Integration

- [ ] **5.1** Create OpenRouter API client (`/lib/openrouter.ts`)
  - Initialize with API key from settings
  - Chat completion endpoint wrapper
  - Streaming support
- [ ] **5.2** Create default Discovery system prompt (user can override in settings)
  ```
  You are a creative director conducting a discovery interview
  for a startup launch video. Your goal is to extract the
  emotional truth of the company's story--not marketing speak.

  Ask one question at a time. Listen carefully. Follow up on
  emotional cues. Dig deeper when answers are generic.

  When you have enough information (typically after 5-7 exchanges),
  generate a Story Brief in this exact JSON format:

  ```json
  {
    "storyBrief": {
      "pain": "raw, visceral description of the problem",
      "solution": "what changes",
      "transformation": "before state → after state",
      "emotionalStakes": "who suffers, who triumphs, why it matters",
      "uniqueAngle": "what makes this story worth telling",

      "emotionalBehaviors": [
        "describe emotion through action, not words",
        "e.g., 'she refreshes the dashboard for the fifth time'",
        "e.g., 'he closes the laptop slowly, staring at nothing'",
        "e.g., 'they lean forward when the notification appears'"
      ],

      "toneNotes": [
        "guiding mood phrases for the whole video",
        "e.g., 'quiet confidence building under chaos'",
        "e.g., 'hope mixed with exhaustion'",
        "e.g., 'a world where small wins feel huge'"
      ]
    }
  }
  ```

  For emotionalBehaviors: Show, don't tell. Describe specific
  physical actions that reveal emotion. Never say "they're frustrated"
  -- instead describe what frustration looks like in action.

  For toneNotes: These guide every scene so the video feels coherent.
  Think of them as the emotional undercurrent running through the film.

  Be warm but probing. You're helping them find the story
  they didn't know they had.
  ```
- [ ] **5.2.1** Load system prompt from settings (fall back to default if not set)
- [ ] **5.3** Implement chat API route (`/api/chat`)
  - Accept messages array
  - Call OpenRouter with system prompt + history
  - Stream response back to client
- [ ] **5.3.1** On new project, auto-send first AI message (opening question)
  - AI initiates conversation immediately after project creation
- [ ] **5.4** Handle streaming responses in UI
  - Display tokens as they arrive
  - Update message when complete
- [ ] **5.5** Auto-save chat history to project.json after each exchange

### 6. Story Brief Extraction

- [ ] **6.1** Create Story Brief data model
  ```typescript
  interface StoryBrief {
    companyName: string;
    tagline: string;
    pain: string;
    solution: string;
    transformation: string;
    emotionalStakes: string;
    uniqueAngle: string;

    // Emotional storytelling elements
    emotionalBehaviors: string[];    // Actions that show emotion (not tell)
                                      // e.g., "she refreshes the dashboard for the fifth time"
                                      // e.g., "he closes the laptop slowly, staring at nothing"

    toneNotes: string[];             // Guiding mood for the whole video
                                      // e.g., "quiet confidence building under chaos"
                                      // e.g., "hope mixed with exhaustion"
                                      // e.g., "a world where small wins feel huge"

    interviewTranscript: Message[];
  }
  ```
- [ ] **6.2** Detect when AI provides Story Brief summary (parse from response)
  - AI decides when it has enough info to generate brief
  - Parse structured output from AI response
- [ ] **6.3** Build Story Brief sidebar panel
  - Show each field with label
  - Auto-populate fields as AI streams response
  - Inline editable (click to edit directly)
  - "Regenerate" button per field
- [ ] **6.4** Implement Story Brief editing
  - User can edit any field directly
  - Changes auto-save
- [ ] **6.5** Implement field regeneration
  - Send current brief + field to regenerate to LLM
  - Replace field with new suggestion
- [ ] **6.6** Add "Confirm & Continue" button
  - Validates all fields are filled
  - Updates project status to 'style'
  - Navigates to Phase 2 (or placeholder)

### 7. Progress & Navigation

- [ ] **7.1** Build phase stepper component (1-7 phases)
  - Highlight current phase
  - Show completed phases with checkmark
  - Disabled future phases
- [ ] **7.2** Add breadcrumb navigation
- [ ] **7.3** Create phase placeholder pages (Phase 2-7)
  - "Coming soon" message
  - Back button to previous phase

### 8. Error Handling & Edge Cases

- [ ] **8.1** Handle missing API key (redirect to settings with message)
- [ ] **8.2** Handle API errors (rate limit, invalid key, network)
  - Display error message in chat
  - Retry button
- [ ] **8.3** Handle empty/incomplete responses
- [ ] **8.4** Add loading states throughout
- [ ] **8.5** Implement auto-save with debouncing
- [ ] **8.6** Add "Restart Conversation" button
  - Clears chat history and Story Brief
  - AI sends new opening question

### 9. Polish & UX

- [ ] **9.1** Add keyboard shortcuts
  - Enter to send message
  - Shift+Enter for new line
- [ ] **9.2** Auto-scroll chat to bottom on new messages
- [ ] **9.3** Focus input after AI responds
- [ ] **9.4** Add character count / token estimate
- [ ] **9.5** Mobile responsive layout
- [ ] **9.6** Dark mode support (optional for MVP)

---

## File Structure

```
launch-video-studio/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # Redirect to /projects
│   ├── settings/
│   │   └── page.tsx            # Settings page
│   ├── projects/
│   │   ├── page.tsx            # Project list
│   │   └── [id]/
│   │       ├── page.tsx        # Project overview (redirect to current phase)
│   │       └── discover/
│   │           └── page.tsx    # Phase 1: Discovery chat
│   └── api/
│       ├── settings/
│       │   └── route.ts        # GET/POST settings
│       ├── projects/
│       │   └── route.ts        # CRUD projects
│       └── chat/
│           └── route.ts        # Chat completion (streaming)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PhaseStepper.tsx
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── TypingIndicator.tsx
│   ├── discovery/
│   │   ├── StoryBriefPanel.tsx
│   │   └── StoryBriefField.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectList.tsx
│   │   └── NewProjectModal.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
├── lib/
│   ├── openrouter.ts           # OpenRouter API client
│   ├── storage.ts              # Local file storage utilities
│   ├── prompts.ts              # System prompts
│   └── utils.ts                # Helpers
├── types/
│   ├── project.ts              # Project, StoryBrief, etc.
│   └── chat.ts                 # Message types
└── public/
    └── ...
```

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "geist": "^1.x",      // Vercel Geist font + design tokens
    "uuid": "^9.x",
    "ai": "^3.x"          // Vercel AI SDK for streaming
  }
}
```

---

## Acceptance Criteria

Phase 1 is complete when:

1. User can configure OpenRouter API key in settings
2. User can create a new project with company name + tagline
3. User can engage in real-time chat with AI creative director
4. AI asks probing questions and extracts emotional story
5. After 5-7 questions, AI generates Story Brief
6. User can view, edit, and regenerate Story Brief fields
7. User can confirm Story Brief and proceed to Phase 2 (placeholder)
8. All data persists to local filesystem
9. Chat history is preserved on page refresh

---

## Estimated Complexity

| Task Group | Effort |
|------------|--------|
| Project Setup | Small |
| Settings Page | Small |
| Project Management | Medium |
| Discovery Chat Interface | Medium |
| OpenRouter Integration | Medium |
| Story Brief Extraction | Medium |
| Progress & Navigation | Small |
| Error Handling | Small |
| Polish & UX | Small |

**Total:** ~40-50 discrete tasks

---

## Next Steps

After Phase 1 is complete:
- Phase 2: Video Style (Gemini integration, reference analysis)
- Phase 3: Storyboard (scene generation, VO script)

---

*Created: December 6, 2025*
