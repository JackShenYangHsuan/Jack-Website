# Task List: Matrix Life Goal - Core UI Implementation

**Based on**: PRD v1.1 (prd-matrix-life-goal-ui.md)
**Timeline**: 6 weeks (Production-ready)
**Target**: Junior Developer

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/matrix-life-goal-ui`

- [x] 1.0 Set up project infrastructure and development environment
  - [x] 1.1 Initialize Vite React TypeScript project: `npm create vite@latest matrix-life-goal -- --template react-ts`
  - [x] 1.2 Navigate to project directory and install dependencies: `cd matrix-life-goal && npm install`
  - [x] 1.3 Install UI/animation dependencies: `npm install @react-spring/web react-zoom-pan-pinch zustand localforage uuid`
  - [x] 1.4 Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
  - [x] 1.5 Configure Tailwind CSS in `tailwind.config.js` (content paths, theme colors from PRD)
  - [x] 1.6 Add Tailwind directives to `src/index.css`
  - [x] 1.7 Create project folder structure: `/components`, `/hooks`, `/store`, `/utils`, `/types`, `/styles`
  - [x] 1.8 Create color theme variables in `src/styles/theme.ts` (PRD Section 6 colors)
  - [x] 1.9 Test dev server runs: `npm run dev`

- [x] 2.0 Implement core grid system and cell management
  - [x] 2.1 Create TypeScript interfaces in `src/types/goal.ts` (Goal, JournalEntry, AppState per PRD Section 7)
  - [x] 2.2 Set up Zustand store in `src/store/goalStore.ts` with initial state and actions
  - [x] 2.3 Create `src/components/Grid.tsx` component with 3x3 CSS Grid layout
  - [x] 2.4 Create `src/components/Cell.tsx` component with text display, truncation, and hover tooltip (FR-4)
  - [x] 2.5 Implement cell creation: clicking empty cell opens inline text input (FR-3)
  - [x] 2.6 Implement double-click to edit mode for desktop (FR-5B)
  - [x] 2.7 Implement long-press to edit mode for mobile using touch events (FR-5B)
  - [x] 2.8 Add edit mode visual feedback: blue border (#3B82F6), auto-focus input (FR-5C)
  - [x] 2.9 Handle save on Enter, cancel on Esc, save on click-outside (FR-5B)
  - [x] 2.10 Prevent zoom/expand during edit mode (FR-5D)
  - [x] 2.11 Implement click-to-expand: clicking a filled cell expands it to center (FR-1, FR-2)
  - [x] 2.12 Add cell size constraints (60px min, 200px max per FR-5)
  - [x] 2.13 Test grid rendering with text-only content (FR-5A)
  - [ ] 2.14 Add infinite canvas expansion buttons around current 3x3 grid (FR-5E)
  - [ ] 2.15 Implement "+" expansion buttons in 8 directions (N, NE, E, SE, S, SW, W, NW per FR-5G)
  - [ ] 2.16 Handle expansion button clicks to create adjacent 3x3 grids (FR-5E)
  - [ ] 2.17 Update data model to support spatial positioning of grids (coordinates)
  - [ ] 2.18 Implement pan navigation between adjacent grids (FR-5F)
  - [ ] 2.19 Test infinite canvas expansion and navigation

- [x] 3.0 Implement fluid zoom animations and navigation
  - [x] 3.1 Set up Canvas wrapper in `src/components/Canvas.tsx` with @react-spring
  - [x] 3.2 Implement smooth zoom animation on cell click using @react-spring (500ms, ease-in-out per FR-6)
  - [x] 3.3 Ensure clicked cell moves to viewport center during zoom (FR-6)
  - [x] 3.4 Animate surrounding 8 cells into position around center (FR-6)
  - [x] 3.5 Create `src/components/Breadcrumbs.tsx` component (FR-8)
  - [x] 3.6 Update breadcrumbs on navigation: "Main Goal > Sub-goal A > Sub-goal B" format
  - [x] 3.7 Make breadcrumbs clickable to jump to any level (FR-8)
  - [x] 3.8 Add zoom out button with Esc keyboard shortcut (FR-7)
  - [x] 3.9 Implement fade out/in for UI elements during zoom transitions (FR-9)
  - [x] 3.10 Test animation performance: verify 60fps using Chrome DevTools (FR-10)
  - [x] 3.11 Add horizontal scroll for breadcrumbs on mobile (FR-8)
  - [x] 3.12 Implement virtualization: only render cells in/near viewport (FR-10)

- [ ] 4.0 Implement minimap and focus mode
  - [ ] 4.1 Create `src/components/Minimap.tsx` component (150px × 150px desktop, 100px mobile per FR-11)
  - [ ] 4.2 Render entire goal tree as tiny cells in minimap (FR-11)
  - [ ] 4.3 Add viewport indicator rectangle that updates on pan/zoom (FR-12)
  - [ ] 4.4 Implement click-to-jump: clicking minimap area navigates to that location (FR-13)
  - [ ] 4.5 Add heatmap overlay toggle button on minimap (FR-14)
  - [ ] 4.6 Apply heatmap colors to minimap cells when toggle is on (FR-14)
  - [ ] 4.7 Make minimap draggable and save position to localStorage (FR-15)
  - [ ] 4.8 Add collapse/expand functionality for mobile (icon-based per FR-16)
  - [ ] 4.9 Auto-collapse minimap after 5s inactivity on mobile (FR-16)
  - [ ] 4.10 Create `src/components/FocusModeOverlay.tsx` component (FR-17)
  - [ ] 4.11 Add Focus Mode toggle button (top-right) with F key shortcut (FR-17)
  - [ ] 4.12 Implement dimming effect: reduce non-focused cells to 20% opacity (FR-18)
  - [ ] 4.13 Add subtle vignette effect (dark edges) (FR-18)
  - [ ] 4.14 Hide minimap during Focus Mode (FR-18)
  - [ ] 4.15 Make only current 3x3 grid interactive in Focus Mode (FR-19)
  - [ ] 4.16 Test Focus Mode toggle and exit (F key, Esc, button click per FR-20)

- [ ] 5.0 Implement progress heatmap and micro-journal
  - [ ] 5.1 Add `completionPercent` property (0-100) to Goal interface (FR-22)
  - [ ] 5.2 Create `src/utils/calculateCompletion.ts` utility for journal-based completion % (FR-26)
  - [ ] 5.3 Define heatmap color gradient in theme: 0% = #1A1F29, 100% = #059669 (FR-23)
  - [ ] 5.4 Apply heatmap background colors to cells based on completion % (FR-23)
  - [ ] 5.5 Add glow/border for 100% complete cells (FR-23)
  - [ ] 5.6 Create `src/components/JournalModal.tsx` component (FR-28)
  - [ ] 5.7 Implement journal entry form: single text input (500 char limit per FR-29)
  - [ ] 5.8 Display journal entries chronologically with timestamps (FR-30)
  - [ ] 5.9 Add delete button for each journal entry (FR-30)
  - [ ] 5.10 Implement auto-update completion % based on journal activity (FR-26 algorithm)
  - [ ] 5.11 Add manual completion % override slider (FR-22)
  - [ ] 5.12 Show streak indicator if consecutive daily entries exist (FR-32)
  - [ ] 5.13 Implement parent cell aggregate progress (average of children per FR-27)
  - [ ] 5.14 Add tooltip showing exact completion % and last update time (FR-25)
  - [ ] 5.15 Test journal entries auto-save to localStorage (FR-31)

- [ ] 6.0 Add mobile responsiveness and touch gestures
  - [ ] 6.1 Add responsive CSS for grid cells (44px min tap target per FR-34)
  - [ ] 6.2 Implement pinch-to-zoom gesture for mobile (FR-33)
  - [ ] 6.3 Implement two-finger pan gesture (FR-33)
  - [ ] 6.4 Implement single tap to select/expand cell (FR-33)
  - [ ] 6.5 Confirm long-press for edit mode works on mobile (already in 2.7)
  - [ ] 6.6 Create mobile bottom navigation bar for key actions (FR-34)
  - [ ] 6.7 Simplify breadcrumbs to icons only on small screens (FR-34)
  - [ ] 6.8 Ensure mobile keyboard doesn't obscure input fields (FR-35)
  - [ ] 6.9 Add "Done" button on mobile keyboard to submit (FR-35)
  - [ ] 6.10 Test on iOS Safari and Chrome Android
  - [ ] 6.11 Optimize for low-power devices: check `navigator.deviceMemory` (FR-36)
  - [ ] 6.12 Throttle scroll/pan events for mobile performance (FR-36)
  - [ ] 6.13 Test lazy loading for cells outside viewport on mobile (FR-36)

- [ ] 7.0 Implement data persistence and export/import
  - [ ] 7.1 Set up localForage in `src/utils/storage.ts`
  - [ ] 7.2 Create `src/hooks/usePersistence.ts` hook for auto-save
  - [ ] 7.3 Implement debounced auto-save (500ms) on every state change (FR-37)
  - [ ] 7.4 Implement load state on app initialization (FR-38)
  - [ ] 7.5 Add loading indicator for large goal trees (>100 goals per FR-38)
  - [ ] 7.6 Create `src/utils/exportJSON.ts` utility (FR-39)
  - [ ] 7.7 Add export button that downloads JSON file (FR-39)
  - [ ] 7.8 Create import functionality with file upload (FR-40)
  - [ ] 7.9 Validate JSON structure before importing (FR-40)
  - [ ] 7.10 Add error handling for corrupt/invalid imports
  - [ ] 7.11 Test save/load cycle: create goals, reload page, verify state restored
  - [ ] 7.12 Test export/import: export JSON, clear data, import, verify identical state

- [ ] 8.0 Polish, testing, and performance optimization
  - [ ] 8.1 Test on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (per PRD Section 7)
  - [ ] 8.2 Profile performance with Chrome DevTools: verify 60fps zoom animations
  - [ ] 8.3 Check bundle size: target < 500KB gzipped (Success Metric)
  - [ ] 8.4 Add `prefers-reduced-motion` media query support (Open Question 9)
  - [ ] 8.5 Add basic keyboard navigation (arrow keys, Enter, Space per Open Question 8)
  - [ ] 8.6 Implement React error boundaries for graceful error handling
  - [ ] 8.7 Test edge cases: empty initial state, max depth (>10 levels), 200+ goals
  - [ ] 8.8 Test goal deletion with context menu (right-click desktop, long-press mobile)
  - [ ] 8.9 Fix any remaining bugs from testing
  - [ ] 8.10 Verify all success metrics from PRD Section 8 (60fps, <2s load, <5MB localStorage)
  - [ ] 8.11 Update README.md with setup instructions
  - [ ] 8.12 Add inline code comments for complex logic

---

## Relevant Files

### Core Application
- `src/main.tsx` - App entry point, renders React app
- `src/App.tsx` - Root component, contains Canvas and main layout
- `src/index.css` - Global styles, Tailwind directives
- `src/vite-env.d.ts` - Vite TypeScript declarations

### Types
- `src/types/goal.ts` - TypeScript interfaces for Goal, JournalEntry, AppState (per PRD Section 7)

### Components
- `src/components/Canvas.tsx` - Infinite canvas wrapper with zoom/pan using react-zoom-pan-pinch
- `src/components/Grid.tsx` - Main 3x3 grid layout component
- `src/components/Cell.tsx` - Individual goal cell with text display, edit mode, hover states
- `src/components/Breadcrumbs.tsx` - Navigation breadcrumb trail
- `src/components/Minimap.tsx` - Overview map with viewport indicator and heatmap toggle
- `src/components/FocusModeOverlay.tsx` - Dimming overlay for Focus Mode
- `src/components/JournalModal.tsx` - Journal entry interface modal/sidebar

### State Management
- `src/store/goalStore.ts` - Zustand store for goal tree, focus state, UI state

### Hooks
- `src/hooks/useGoalTree.ts` - Custom hook for goal tree operations (add, edit, expand, delete)
- `src/hooks/useZoom.ts` - Custom hook for zoom animation logic
- `src/hooks/usePersistence.ts` - Custom hook for auto-save and load from localStorage

### Utilities
- `src/utils/calculateCompletion.ts` - Algorithm to calculate completion % from journal entries
- `src/utils/exportJSON.ts` - Export goal tree to JSON file
- `src/utils/importJSON.ts` - Import and validate JSON file
- `src/utils/storage.ts` - LocalForage setup and storage helpers

### Styles
- `src/styles/theme.ts` - Color theme constants (dark blue background, green heatmap gradient)
- `src/styles/globals.css` - Additional global styles beyond Tailwind

### Configuration
- `tailwind.config.js` - Tailwind CSS configuration with custom colors from PRD
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `package.json` - Dependencies and scripts

### Notes
- Focus on one task at a time and check it off immediately after completion
- Test each feature as you build it before moving to the next task
- Refer to PRD Section numbers for detailed requirements (e.g., FR-6 for zoom animation specs)
- All animations should target 60fps - use Chrome DevTools Performance tab to verify
- Mobile testing should be done on real devices or simulators (iOS Safari, Chrome Android minimum)

---

**Status**: Phase 2 Complete - All sub-tasks generated
**Ready to implement**: Start with Task 0.0 and work sequentially through the list
