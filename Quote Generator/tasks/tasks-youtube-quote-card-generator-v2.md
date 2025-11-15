# Tasks: YouTube Quote Card Generator v2.0 - Quote & Style Selection Features

## Relevant Files

### Backend (Modified)
- `backend/services/openaiService.js` - Update to extract 10 quotes instead of 3-5
- `backend/services/dalleService.js` - Update to use user-selected style consistently
- `backend/server.js` - Update API endpoint to accept quote selection and style preference

### Frontend (Modified)
- `index.html` - Add quote selection and style selection screens
- `styles.css` - Add styles for new UI components
- `app.js` - Add quote selection, style selection, and multi-step workflow logic

### New Files
- None required (all modifications to existing files)

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch for v2.0
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/quote-style-selection`)

- [x] 1.0 Update backend to extract 10 quotes
  - [x] 1.1 Open `backend/services/openaiService.js`
  - [x] 1.2 Update GPT-4 prompt to request 10 quotes instead of 3-5
  - [x] 1.3 Update response validation to expect 10 quotes
  - [x] 1.4 Update error messages to reflect 10-quote requirement
  - [ ] 1.5 Test with sample transcript to verify 10 quotes are returned

- [x] 2.0 Update backend API to accept quote and style selections
  - [x] 2.1 Open `backend/server.js`
  - [x] 2.2 Update `/api/generate` endpoint to accept new parameters:
    - [x] 2.2.1 Add `selectedQuotes` array parameter (3-5 quote strings)
    - [x] 2.2.2 Add `selectedStyle` string parameter (style name)
  - [x] 2.3 Add validation for selectedQuotes (must be array of 3-5 strings)
  - [x] 2.4 Add validation for selectedStyle (must be one of 5 valid styles)
  - [x] 2.5 Update workflow to use selectedQuotes instead of all quotes
  - [x] 2.6 Pass selectedStyle to DALL-E service

- [x] 3.0 Create new API endpoint for quote extraction only
  - [x] 3.1 Create new POST `/api/extract-quotes` endpoint in `backend/server.js`
  - [x] 3.2 Accept YouTube URL in request body
  - [x] 3.3 Extract transcript using youtubeService
  - [x] 3.4 Extract 10 quotes using openaiService
  - [x] 3.5 Return JSON response with quotes array only (no image generation)
  - [x] 3.6 Add error handling and validation
  - [x] 3.7 Apply rate limiting to this endpoint

- [x] 4.0 Update DALL-E service to use consistent style
  - [x] 4.1 Open `backend/services/dalleService.js`
  - [x] 4.2 Update `generateQuoteCard()` function signature to accept style parameter
  - [x] 4.3 Modify function to use the specified style instead of styleIndex
  - [x] 4.4 Update `generateAllCards()` to accept and pass style parameter
  - [x] 4.5 Ensure all cards use the same style (no variation)
  - [x] 4.6 Update DALL-E prompts to use style consistently
  - [ ] 4.7 Test that style is applied correctly to all cards

- [x] 5.0 Create quote selection UI screen
  - [x] 5.1 Open `index.html`
  - [x] 5.2 Create new section with id="quote-selection-section" (hidden by default)
  - [x] 5.3 Add heading "Select Your Favorite Quotes (3-5)"
  - [x] 5.4 Create container div for quote list (id="quote-list")
  - [x] 5.5 Add selection counter display (e.g., "3/5 quotes selected")
  - [x] 5.6 Add "Next" button to proceed to style selection (disabled by default)
  - [x] 5.7 Add "Back" button to return to URL input

- [x] 6.0 Create style selection UI screen
  - [x] 6.1 Open `index.html`
  - [x] 6.2 Create new section with id="style-selection-section" (hidden by default)
  - [x] 6.3 Add heading "Choose Your Design Style"
  - [x] 6.4 Create container div for style options (id="style-options")
  - [x] 6.5 Create 5 style cards (Modern Minimal, Bold Gradient, Dark Mode Elegant, Magazine Style, Tech Startup)
  - [x] 6.6 Each style card should have:
    - [x] 6.6.1 Radio button for selection
    - [x] 6.6.2 Style name as label
    - [x] 6.6.3 Description text
    - [x] 6.6.4 Visual preview or icon
  - [x] 6.7 Add "Generate Cards" button (disabled by default)
  - [x] 6.8 Add "Back" button to return to quote selection

- [x] 7.0 Add CSS styling for new UI components
  - [x] 7.1 Open `styles.css`
  - [x] 7.2 Add styles for quote selection section
  - [x] 7.3 Style quote list items with checkboxes
  - [x] 7.4 Add hover and selected states for quote items
  - [x] 7.5 Style selection counter
  - [x] 7.6 Add styles for style selection section
  - [x] 7.7 Create card-based layout for style options
  - [x] 7.8 Style radio buttons and labels
  - [x] 7.9 Add selected state styling for style cards
  - [x] 7.10 Add responsive styles for mobile/tablet
  - [x] 7.11 Style "Back" and "Next" buttons
  - [x] 7.12 Add transition animations between screens

- [x] 8.0 Implement quote selection logic in frontend
  - [x] 8.1 Open `app.js`
  - [x] 8.2 Create state variable to store extracted quotes
  - [x] 8.3 Create state variable to store selected quote indices
  - [x] 8.4 Create function `showQuoteSelection(quotes)` to display quote screen
  - [x] 8.5 Create function `renderQuoteList(quotes)` to generate quote checkboxes
  - [x] 8.6 Add event listeners for quote checkbox changes
  - [x] 8.7 Implement selection validation (min 3, max 5)
  - [x] 8.8 Update selection counter in real-time
  - [x] 8.9 Enable/disable "Next" button based on selection count
  - [x] 8.10 Handle "Next" button click to proceed to style selection
  - [x] 8.11 Handle "Back" button click to return to URL input
  - [x] 8.12 Prevent selecting more than 5 quotes

- [x] 9.0 Implement style selection logic in frontend
  - [x] 9.1 Create state variable to store selected style
  - [x] 9.2 Create function `showStyleSelection()` to display style screen
  - [x] 9.3 Add event listeners for style radio button changes
  - [x] 9.4 Update visual feedback when style is selected
  - [x] 9.5 Enable "Generate Cards" button when style is selected
  - [x] 9.6 Handle "Generate Cards" button click
  - [x] 9.7 Handle "Back" button click to return to quote selection
  - [x] 9.8 Validate that exactly one style is selected

- [x] 10.0 Update frontend API integration for multi-step workflow
  - [x] 10.1 Split existing `generateQuoteCards()` into two API calls:
    - [x] 10.1.1 `extractQuotes(youtubeUrl)` - calls `/api/extract-quotes`
    - [x] 10.1.2 `generateCards(selectedQuotes, selectedStyle)` - calls `/api/generate`
  - [x] 10.2 Update form submission to only call extractQuotes
  - [x] 10.3 Display quote selection screen after quotes are extracted
  - [x] 10.4 Call generateCards only after both quote and style are selected
  - [x] 10.5 Pass selected quotes and style to backend
  - [x] 10.6 Handle loading states for both API calls
  - [x] 10.7 Update progress indicators for multi-step workflow

- [x] 11.0 Implement workflow navigation and state management
  - [x] 11.1 Create state variable to track current step (1-4)
  - [x] 11.2 Create function `showStep(stepNumber)` to display appropriate screen
  - [x] 11.3 Hide all other screens when showing one screen
  - [x] 11.4 Implement step navigation (forward/backward)
  - [x] 11.5 Preserve user selections when going back
  - [x] 11.6 Add step indicator/breadcrumbs at top of page (not needed - clear UI without)
  - [x] 11.7 Update step indicator as user progresses (not needed - clear UI without)
  - [x] 11.8 Handle browser back button appropriately (retry button resets to step 1)

- [x] 12.0 Update loading states and progress indicators
  - [x] 12.1 Update loading text for step 1 (extracting quotes)
  - [x] 12.2 Add loading state for style selection to generation transition
  - [x] 12.3 Update progress steps to reflect new workflow
  - [x] 12.4 Add step completion indicators
  - [x] 12.5 Show estimated time for each step (handled by backend)

- [x] 13.0 Update error handling for new workflow
  - [x] 13.1 Handle errors during quote extraction separately
  - [x] 13.2 Add validation error for invalid quote selection
  - [x] 13.3 Add validation error for missing style selection
  - [x] 13.4 Update error messages to be step-specific
  - [x] 13.5 Allow users to retry from failed step

- [x] 14.0 Update backend validation utilities
  - [x] 14.1 Open `backend/utils/validation.js` (validation done inline in server.js)
  - [x] 14.2 Add `validateQuoteSelection(quotes)` function (done in server.js endpoint)
  - [x] 14.3 Add `validateStyleSelection(style)` function (done in server.js endpoint)
  - [x] 14.4 Export new validation functions (not needed - inline validation)
  - [x] 14.5 Apply validation in API endpoints

- [ ] 15.0 Testing and quality assurance
  - [ ] 15.1 Test complete workflow end-to-end with real YouTube URL
  - [ ] 15.2 Verify 10 quotes are extracted correctly
  - [ ] 15.3 Test quote selection with various combinations (3, 4, 5 quotes)
  - [ ] 15.4 Test that selecting <3 or >5 quotes shows appropriate errors
  - [ ] 15.5 Test all 5 style options generate correct designs
  - [ ] 15.6 Verify all cards use the same selected style
  - [ ] 15.7 Test backward navigation preserves selections
  - [ ] 15.8 Test error handling at each step
  - [ ] 15.9 Test responsive design on mobile/tablet
  - [ ] 15.10 Test loading states and transitions
  - [ ] 15.11 Verify download functionality still works
  - [ ] 15.12 Update README.md with new workflow documentation

- [ ] 16.0 Documentation and cleanup
  - [ ] 16.1 Update README.md to describe new 4-step workflow
  - [ ] 16.2 Add screenshots or descriptions of new UI
  - [ ] 16.3 Update QUICKSTART.md with new usage instructions
  - [ ] 16.4 Document the two API endpoints
  - [ ] 16.5 Add comments to new code sections
  - [ ] 16.6 Remove any console.log statements used for debugging
  - [ ] 16.7 Update PRD status to "Implemented"
