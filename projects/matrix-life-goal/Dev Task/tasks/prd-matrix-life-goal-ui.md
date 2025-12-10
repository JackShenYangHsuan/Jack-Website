# Product Requirements Document: Matrix Life Goal - Core UI

## 1. Introduction/Overview

### Problem Statement
Traditional goal-setting apps present goals as linear lists or simple hierarchies, making it difficult to visualize how supporting goals connect to larger ambitions. Users struggle to break down big dreams into actionable steps and lose motivation when they can't see their overall progress.

### Solution
Matrix Life Goal is a web application that implements the Mandala Chart method (Mandal-Art) - a proven goal-setting framework used by athletes like Shohei Ohtani. The app features an infinitely expandable 3x3 grid where each cell is a goal, and the center cell represents the main objective supported by 8 surrounding sub-goals. Any sub-goal can become the center of its own 3x3 grid, creating a fractal, explorable goal hierarchy.

### Goal
Create a simple, intuitive, production-ready UI that makes goal exploration feel like navigating a personal universe - with smooth animations, clear progress visualization, and focus-enhancing features.

---

## 2. Goals

1. **Intuitive Navigation**: Users can effortlessly zoom in/out of goal hierarchies without getting lost
2. **Visual Clarity**: Progress across all goals is immediately visible through color-coded heatmaps
3. **Focus Enhancement**: Minimize distractions when working on specific goal clusters
4. **Mobile-First**: Seamless experience across desktop, tablet, and mobile devices
5. **Performance**: Smooth 60fps animations even with hundreds of goals
6. **Simplicity**: Zero learning curve - users understand the interface within 30 seconds

---

## 3. User Stories

### As a user starting my goal journey:
- I can create one center goal (e.g., "Run a marathon")
- I can click that goal to expand it into a 3x3 grid
- I can add 8 supporting goals around my center goal (training plan, nutrition, sleep, etc.)
- I see smooth zoom animations that make the expansion feel natural and delightful

### As a user exploring my goal tree:
- I can click any of the 8 supporting goals to make it the new center and expand it further
- I can see a minimap in the corner showing my entire goal tree at a glance
- I can click anywhere on the minimap to instantly jump to that area
- I can use breadcrumbs to understand how deep I am in my goal hierarchy

### As a user tracking progress:
- I can add quick journal entries to any goal ("Ran 5 miles today")
- I see the goal's status automatically update based on my activity
- I can view a heatmap overlay where darker cells = less progress, brighter green = more progress
- I can understand my overall progress across all goals at a glance

### As a user focusing on specific goals:
- I can activate Focus Mode to dim everything except my current 3x3 grid
- I can work distraction-free on one goal cluster
- I can easily exit Focus Mode and return to the full view

### As a mobile user:
- I can use pinch gestures to zoom in/out
- I can pan around the canvas with touch
- I can tap cells to expand them
- I can access all features on my phone without frustration

---

## 4. Functional Requirements

### 4.1 Core Grid System

**FR-1**: The app must start with a single center cell containing user's main goal text
- Clicking this cell expands it into a 3x3 grid (1 center + 8 surrounding cells)

**FR-2**: Each of the 8 surrounding cells can be clicked to become the new center of its own 3x3 grid
- This creates an infinitely expandable fractal structure

**FR-3**: Empty cells must display a subtle "+" icon or placeholder text ("Add goal")
- Clicking an empty cell opens an inline text input
- Pressing Enter saves the goal, Esc cancels

**FR-4**: Each cell must display:
- Goal text (truncated with ellipsis if too long)
- Visual indicator of completion status (via background color/opacity)
- Hover state showing full text in tooltip

**FR-5**: Grid cells must be sized appropriately for the current zoom level
- Minimum size: 60px × 60px (mobile touch-friendly)
- Maximum size: 200px × 200px (desktop zoomed in)

**FR-5A**: Cells must support text-only content (no emojis or icons)
- Clean, minimalist text display
- Single-line or multi-line text depending on cell size
- Text truncation with ellipsis for overflow

**FR-5B**: Users must be able to edit existing goal text
- **Desktop**: Double-click any cell to enter edit mode
- **Mobile**: Long-press any cell to enter edit mode
- Edit mode shows inline text input with current text pre-filled
- Pressing Enter saves changes, Esc cancels
- Click outside cell also saves changes

**FR-5C**: Edit mode must provide clear visual feedback
- Cell border changes color (e.g., blue accent) to indicate edit mode
- Cursor auto-focuses in text input
- Text input expands to fit content (within cell bounds)

**FR-5D**: Edit mode must prevent accidental navigation
- While editing, clicking the cell does NOT trigger zoom/expand
- Edit mode takes priority over expand functionality
- After saving, normal click behavior resumes

**FR-5E**: Infinite canvas expansion - users can add 3x3 grids around the current grid
- Beyond the current 3x3 grid, "+" expansion buttons appear in all 8 directions
- Clicking a "+" button adds a new 3x3 grid adjacent to the current grid in that direction
- The new grid connects seamlessly to create an infinite spatial canvas
- Users can navigate between adjacent grids by panning or clicking cells near the edge

**FR-5F**: Spatial grid navigation
- Panning the canvas reveals adjacent 3x3 grids that have been created
- The current "focused" 3x3 remains in the center of the viewport
- Clicking a cell in an adjacent grid re-centers the view on that grid
- Grid boundaries are visually subtle (no hard lines between adjacent grids)

**FR-5G**: Expansion button visual design
- "+" buttons appear outside the current 3x3 grid in 8 directions (N, NE, E, SE, S, SW, W, NW)
- Buttons are semi-transparent and become fully visible on hover
- Size: 40px × 40px minimum for touch-friendly interaction
- Color: Accent blue (#3B82F6) with subtle glow effect

### 4.2 Fluid Zoom Animations

**FR-6**: Clicking a cell to expand it must trigger a smooth zoom animation
- Duration: 400-600ms (feels natural, not too slow)
- Easing: ease-in-out or spring physics
- The clicked cell moves to center of viewport
- Surrounding 8 cells animate into position around it

**FR-7**: A "back" or "zoom out" button must be visible at all times
- Clicking it animates back to the parent 3x3 grid
- Keyboard shortcut: Esc key

**FR-8**: Breadcrumb navigation must show the current path
- Format: "Main Goal > Sub-goal A > Sub-goal B"
- Each breadcrumb is clickable to jump to that level
- Breadcrumbs scroll horizontally on mobile if too long

**FR-9**: During zoom animations, other UI elements (minimap, buttons) must fade out briefly
- Reduces visual clutter during transitions
- Fade back in when animation completes

**FR-10**: Zoom animations must maintain 60fps performance
- Use CSS transforms (translate, scale) instead of changing positions
- Hardware-accelerated rendering
- Virtualization: Only render cells currently in viewport or nearby

### 4.3 Multi-Scale Overview Map

**FR-11**: A minimap must be always visible in the bottom-right corner
- Size: ~150px × 150px on desktop, ~100px × 100px on mobile
- Shows entire goal tree as tiny cells
- Semi-transparent background (doesn't block main canvas)

**FR-12**: The minimap must display a viewport indicator
- Rectangle showing what portion of the tree is currently visible
- Updates in real-time as user pans/zooms

**FR-13**: Clicking anywhere on the minimap must instantly jump to that area
- Smooth transition animation to the selected location
- Zooms to an appropriate level to show context

**FR-14**: The minimap must support a heatmap overlay toggle
- Button/icon to toggle heatmap on/off
- When on: cells colored by completion % (dark → green)
- When off: cells shown as simple outlines

**FR-15**: The minimap must be draggable to reposition
- Users can move it if it blocks content
- Position persists in localStorage

**FR-16**: On mobile, minimap can be collapsed to a small icon
- Tapping icon expands it temporarily
- Auto-collapses after 5 seconds of inactivity

### 4.4 Focus Mode

**FR-17**: A "Focus Mode" toggle button must be accessible at all times
- Location: Top-right corner or floating action button
- Icon: Target/crosshair or "F" letter
- Keyboard shortcut: F key

**FR-18**: Activating Focus Mode must:
- Dim all cells except the current 3x3 grid (reduce opacity to 20%)
- Apply a subtle vignette effect (dark edges fading to transparent center)
- Hide the minimap temporarily
- Optionally hide breadcrumbs (user preference)

**FR-19**: In Focus Mode, only the current 3x3 grid should be fully interactive
- Other cells still visible but not clickable
- Prevents accidental navigation

**FR-20**: Exiting Focus Mode must restore full view
- Click the toggle again or press F/Esc
- Smooth fade-in animation for dimmed elements

**FR-21**: Focus Mode state must not affect zoom functionality
- Users can still zoom in/out within the focused 3x3 cluster
- Focus mode "follows" the current context

### 4.5 Progress Heatmap

**FR-22**: Each cell must have a "completion percentage" property (0-100%)
- Automatically calculated based on micro-journal activity (see FR-26)
- Can also be manually set via slider/input

**FR-23**: Cell background color must reflect completion percentage
- 0%: Dark gray (#1A1F29 or similar)
- 1-25%: Very dark green (#1a3a2e)
- 26-50%: Medium dark green (#2d5a3f)
- 51-75%: Medium green (#4a9d6f)
- 76-99%: Bright green (#10B981)
- 100%: Vibrant green (#059669) with subtle glow/border

**FR-24**: Heatmap must be the default view (always on)
- No need to toggle - it's the primary visual language
- Progress is immediately visible at all zoom levels

**FR-25**: Hovering over a cell must show exact completion %
- Tooltip: "Goal Name | 67% complete"
- Also show last update timestamp: "Last updated: 2 hours ago"

**FR-26**: Micro-journal entries must affect completion %
- Each journal entry adds activity "weight"
- Algorithm suggestion:
  - 1 entry in last 7 days = 10-20% boost
  - 3+ entries in last 7 days = 40-60% boost
  - No entries in 30 days = gradual decay toward 0%
  - Manual override always available

**FR-27**: Parent cells must show aggregate progress of their children
- If a center cell has 8 children, its % = average of children's %
- Visual indication that it's an aggregate (subtle icon or border style)
- Clicking parent shows breakdown tooltip

### 4.6 Micro-Journal (Progress Tracking)

**FR-28**: Clicking a cell must open a modal/sidebar with journal interface
- Left side: Goal title, description, completion %
- Right side: Journal entries (chronological, newest first)

**FR-29**: Journal entry input must be dead simple
- Single text input: "What did you do today?"
- Submit button or press Enter
- Character limit: 500 chars (keeps it micro)

**FR-30**: Journal entries must display:
- Entry text
- Timestamp (relative: "2 hours ago", "Yesterday", "Nov 10")
- Option to delete (trash icon)

**FR-31**: Journal entries must auto-save to localStorage
- Persist even if user closes browser
- Optional: Cloud backup to Firebase (future phase)

**FR-32**: Modal must show "streak" indicator if applicable
- "🔥 3 days in a row!" for consecutive daily entries
- Simple, non-intrusive motivation

### 4.7 Mobile-Specific Requirements

**FR-33**: Touch gestures must be supported:
- Pinch to zoom in/out
- Two-finger pan to move canvas
- Single tap to select/expand cell
- Long-press to open journal modal (alternative to single tap)

**FR-34**: Mobile UI must adapt:
- Larger tap targets (minimum 44px × 44px)
- Bottom navigation for key actions (zoom out, focus mode, settings)
- Collapsible minimap (see FR-16)
- Simplified breadcrumbs (icons only on small screens)

**FR-35**: Mobile keyboard must not obscure content
- When typing in journal or cell text, viewport scrolls to keep input visible
- "Done" button on keyboard submits entry

**FR-36**: Mobile performance must be optimized:
- Lazy load cells outside viewport
- Throttle scroll/pan events
- Reduce animation complexity if device is low-power (via `navigator.deviceMemory`)

### 4.8 Data Persistence

**FR-37**: All goals and journal entries must save to localStorage automatically
- Save on every change (debounced by 500ms)
- No "save" button required

**FR-38**: App must load previous state on reload
- Restore zoom level, current position, focus mode state
- Show loading indicator if data is large (>100 goals)

**FR-39**: Export functionality must be available
- Export entire goal tree as JSON file
- Future: Export as PNG image (screenshot of canvas)

**FR-40**: Import functionality for restoring backups
- Upload JSON file to restore previous state
- Validate JSON structure before importing

---

## 5. Non-Goals (Out of Scope for MVP)

**NG-1**: AI-powered goal suggestions
- Users manually create all goals for MVP
- AI features deferred to Phase 2

**NG-2**: Multi-user collaboration / sharing
- Single-user app only
- No social features, comments, or sharing in MVP

**NG-3**: Cloud sync / cross-device sync
- localStorage only for MVP
- No Firebase/Supabase integration initially

**NG-4**: Calendar integration
- No automatic deadline reminders or calendar sync
- Users manage deadlines manually

**NG-5**: Gamification beyond basic progress tracking
- No badges, points, leaderboards
- Just heatmap and streaks (minimal)

**NG-6**: Rich text editing in goals/journals
- Plain text only (no markdown, formatting, images)
- Keeps it simple

**NG-7**: Undo/redo functionality
- Can be added later, but not critical for MVP

**NG-8**: Accessibility features (WCAG AA compliance)
- Important for production but not blocking for MVP
- Should be prioritized post-MVP

---

## 6. Design Considerations

### Visual Design System

**Colors** (inspired by your Command Center palette):
- **Background**: Deep dark blue (#0F1419)
- **Cards/Cells**: Dark slate (#1A1F29)
- **Borders**: Subtle gray (#2D3748)
- **Accent**: Blue (#3B82F6) for interactive elements
- **Progress Heatmap**: Dark gray → Green gradient (see FR-23)
- **Text**: White (#FFFFFF) primary, gray (#9CA3AF) secondary

**Typography**:
- **Font**: Inter (system fallback: -apple-system, BlinkMacSystemFont, "Segoe UI")
- **Cell text**: 14px regular (desktop), 12px (mobile)
- **Breadcrumbs**: 12px medium
- **Journal**: 14px regular

**Spacing**:
- Cell padding: 12px
- Grid gap: 8px between cells
- Modal padding: 24px

**Animations**:
- Zoom: 500ms ease-in-out
- Fade: 200ms ease-in
- Hover: 150ms ease-out
- Use `@react-spring/web` for spring physics

### UI Components

**Key Components**:
1. `Grid` - Main 3x3 grid container
2. `Cell` - Individual goal cell with hover/click states
3. `Canvas` - Infinite canvas wrapper with pan/zoom
4. `Minimap` - Overview map component
5. `Breadcrumbs` - Navigation trail
6. `JournalModal` - Journal entry interface
7. `FocusModeOverlay` - Dimming overlay for focus mode

**Component Library**:
- Build custom components (no heavy UI library)
- Use Tailwind CSS for styling (follows your Command Center approach)

### Mockup Descriptions

**Desktop View**:
```
┌─────────────────────────────────────────────────┐
│  [Breadcrumb: Main > Fitness]     [F] Focus     │
│                                                  │
│                                                  │
│              ┌──────┬──────┬──────┐             │
│              │      │      │      │             │
│              │Strength│ Run │ Eat │             │
│              ├──────┼──────┼──────┤             │
│              │      │      │      │             │
│              │Sleep │GOAL │Yoga  │             │
│              ├──────┼──────┼──────┤             │
│              │      │      │      │             │
│              │Track │Health│Shoes │             │
│              └──────┴──────┴──────┘             │
│                                                  │
│                              ┌────────────┐     │
│                              │  Minimap   │     │
│                              │ ▓▓▓░░░░░░  │     │
│                              │ ▓▓▓░░░░░░  │     │
│                              │ ░░░░░░░░░  │     │
│                              └────────────┘     │
└─────────────────────────────────────────────────┘
```

**Mobile View**:
```
┌─────────────────┐
│ Main > Fitness  │
├─────────────────┤
│                 │
│   ┌───┬───┬───┐ │
│   │Str│Run│Eat│ │
│   ├───┼───┼───┤ │
│   │Slp│GOA│Yog│ │
│   ├───┼───┼───┤ │
│   │Trk│Hea│Sho│ │
│   └───┴───┴───┘ │
│                 │
│   [Minimap ▼]   │
├─────────────────┤
│ ←  │ F │ S │ + │
└─────────────────┘
```

---

## 7. Technical Considerations

### Technology Stack

**Frontend Framework**:
- **React 18+** with TypeScript
- Functional components + hooks
- Vite for bundling (fast dev server)

**State Management**:
- **Zustand** or **Jotai** (lightweight, simpler than Redux)
- Store: goals tree, current zoom level, focus mode state, minimap position

**Infinite Canvas**:
- **Option A**: `tldraw` SDK (comprehensive but heavier)
- **Option B**: `Konva.js` (lighter, better performance)
- **Recommended**: Start with `react-zoom-pan-pinch` library + custom grid rendering
  - Handles zoom/pan out of the box
  - Lighter than full canvas libraries

**Animation Library**:
- **@react-spring/web** for smooth, physics-based animations
- More performant than CSS transitions for complex sequences

**Styling**:
- **Tailwind CSS** (consistent with Command Center)
- Custom CSS for canvas-specific styling

**Data Persistence**:
- **localStorage** via `localForage` (better API than raw localStorage)
- JSON serialization of goal tree

### Architecture

**Data Structure**:
```typescript
interface Goal {
  id: string; // UUID
  text: string;
  parentId: string | null;
  childIds: string[]; // Max 8 for surrounding cells
  position: 'center' | 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left';
  completionPercent: number; // 0-100
  journalEntries: JournalEntry[];
  createdAt: string; // ISO timestamp
  updatedAt: string;
}

interface JournalEntry {
  id: string;
  goalId: string;
  text: string;
  timestamp: string;
}

interface AppState {
  goals: Map<string, Goal>;
  rootGoalId: string;
  currentFocusedGoalId: string; // Which goal is currently centered
  focusModeEnabled: boolean;
  minimapCollapsed: boolean;
}
```

**File Structure**:
```
/src
  /components
    Grid.tsx
    Cell.tsx
    Canvas.tsx
    Minimap.tsx
    Breadcrumbs.tsx
    JournalModal.tsx
    FocusModeOverlay.tsx
  /hooks
    useGoalTree.ts
    useZoom.ts
    usePersistence.ts
  /store
    goalStore.ts (Zustand)
  /utils
    calculateCompletion.ts
    exportJSON.ts
  /styles
    globals.css
  App.tsx
  main.tsx
```

### Performance Targets

- **Initial load**: < 2 seconds
- **Zoom animation**: 60fps (16ms per frame)
- **Canvas pan**: 60fps with 100+ cells visible
- **Lighthouse score**: 90+ (Performance, Accessibility, Best Practices)

### Browser Support

- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Android 90+

### Dependencies (Estimated)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-zoom-pan-pinch": "^3.3.0",
    "@react-spring/web": "^9.7.0",
    "zustand": "^4.4.0",
    "localforage": "^1.10.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0"
  }
}
```

---

## 8. Success Metrics

### User Engagement
- **Primary**: Users create at least 9 goals (1 center + 8 surrounding) within first session
- **Secondary**: Users return within 7 days to add journal entries
- **Tertiary**: Average session duration > 3 minutes

### Performance
- **Zoom animation maintains 60fps** (measure via Chrome DevTools FPS counter)
- **Time to interactive < 2 seconds** on 3G connection
- **No crashes or freezes** with 200+ goals loaded

### Usability
- **Zero user support questions about navigation** (intuitive UI)
- **Mobile users complete same tasks as desktop users** (responsive design works)
- **Focus Mode used by 40%+ of active users** (feature is discoverable and valuable)

### Technical
- **Bundle size < 500KB gzipped** (fast load times)
- **localStorage never exceeds 5MB** (efficient data structure)
- **Zero console errors** in production build

---

## 9. Open Questions

1. **Goal deletion**: How should users delete goals? What happens to children?
   - **Suggestion**: Long-press (mobile) or right-click (desktop) → context menu → delete
   - Children become orphaned or moved to parent level

2. **Color themes**: Should users be able to customize the heatmap color scheme?
   - **Suggestion**: MVP uses green only, add themes in v2

3. **Offline behavior**: What happens if user tries to export/import while offline?
   - **Suggestion**: JSON export always works (localStorage), import works too

4. **Maximum depth**: Should there be a limit to how deep users can nest goals?
   - **Suggestion**: No hard limit, but warn if >10 levels deep (potential overwhelm)

5. **Tutorial/onboarding**: Should there be a first-time user guide?
   - **Suggestion**: Minimal: Show tooltip on first load with "Click to expand your goal"

6. **Keyboard shortcuts**: Beyond Esc and F, what other shortcuts would be useful?
   - **Suggestion**:
     - Arrow keys to navigate between sibling cells
     - Enter to expand selected cell
     - Space to toggle focus mode
     - Cmd/Ctrl + Z for undo (if implemented)

7. **Animation preferences**: Should users be able to disable animations (accessibility)?
   - **Suggestion**: Respect `prefers-reduced-motion` media query

8. **Data migration**: If data structure changes in future versions, how to handle upgrades?
    - **Suggestion**: Version the localStorage schema, write migration scripts

## 10. Resolved Clarifications

**Q1: Icon/Emoji usage?**
- **DECISION**: Text-only, no emojis or icons. Clean, minimalist text display. (See FR-5A)

**Q2: Cell editing?**
- **DECISION**: Double-click (desktop) or long-press (mobile) to enter edit mode. Inline text input with Enter to save, Esc to cancel. (See FR-5B, FR-5C, FR-5D)

**Q3: Infinite canvas expansion?**
- **DECISION**: Yes, users can add 3x3 grids in all 8 directions around the current grid using "+" expansion buttons. This creates a true infinite spatial canvas, not just hierarchical drilling. (See FR-5E, FR-5F, FR-5G)

---

## Appendix: Implementation Timeline (6 weeks)

### Week 1-2: Core Grid & Navigation
- Basic 3x3 grid rendering
- Cell creation/editing
- Click-to-expand functionality
- Breadcrumb navigation

### Week 3: Zoom Animations
- Smooth zoom in/out
- Canvas pan functionality
- Keyboard shortcuts
- Mobile touch gestures

### Week 4: Minimap & Focus Mode
- Minimap rendering
- Viewport indicator
- Focus mode overlay
- Minimap interactions

### Week 5: Progress Heatmap & Journal
- Completion % calculation
- Heatmap color coding
- Journal modal
- Micro-journal entries
- Auto-save to localStorage

### Week 6: Polish & Testing
- Mobile responsive testing
- Performance optimization
- Edge case handling
- Export/import
- Cross-browser testing
- Bug fixes

---

## Appendix: Inspirational References

- **Shohei Ohtani's Mandala Chart**: [Search: "Ohtani goal setting chart"]
- **Obsidian Canvas**: Infinite canvas UX patterns
- **GitHub Contribution Graph**: Heatmap visualization
- **Google Maps**: Multi-scale zoom interface
- **Figma**: Canvas pan/zoom interactions

---

**PRD Version**: 1.2
**Last Updated**: 2025-11-15
**Owner**: Jack Shen
**Target Audience**: Junior Developer
**Timeline**: 6 weeks (Production-ready)

**Changelog**:
- v1.2 (2025-11-15): Added infinite canvas expansion feature (FR-5E, FR-5F, FR-5G) - users can add 3x3 grids in all 8 directions around current grid for true infinite spatial canvas
- v1.1 (2025-11-15): Added cell editing requirements (FR-5B, FR-5C, FR-5D), clarified text-only content (FR-5A), removed emoji references, updated mockups
- v1.0 (2025-11-15): Initial PRD creation
