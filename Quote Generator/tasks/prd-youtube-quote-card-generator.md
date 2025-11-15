# Product Requirements Document: YouTube Quote Card Generator

## Introduction/Overview

The YouTube Quote Card Generator is a web application that transforms YouTube video content into shareable Instagram-style quote cards. Users input a YouTube video URL, and the application uses AI to extract 10 impactful quotes from the video transcript. Users can then select their favorite quotes (3-5) and choose a design style before generating professionally designed quote cards ready for social media sharing.

**Problem it solves:** Content creators and marketers spend significant time manually extracting quotes from video content and designing graphics. This tool automates quote extraction while giving users control over which quotes to use and how they look, enabling them to create shareable quote cards in minutes instead of hours.

**Goal:** Enable users to generate high-quality, Instagram-ready quote cards from any YouTube video with user control over quote selection and design style preferences.

## Goals

1. Allow users to generate quote cards from YouTube videos in under 3 minutes
2. Leverage OpenAI API to intelligently extract 10 impactful/shareable quotes from video transcripts
3. Give users control to select which 3-5 quotes they want to convert into cards
4. Allow users to choose their preferred design style for the quote cards
5. Automatically produce professionally designed 1080x1080px PNG images suitable for Instagram
6. Provide a simple, intuitive interface with clear workflow steps
7. Deliver consistent, high-quality design output without requiring user design skills

## User Stories

1. **As a content creator**, I want to see multiple quote options from my video so I can choose the ones that best represent my message before creating cards.

2. **As a social media manager**, I want to select which design style matches my brand aesthetic so the quote cards align with my overall social media presence.

3. **As a podcaster**, I want to preview 10 AI-selected quotes and pick my top 3-5 favorites so I can ensure the most impactful moments are shared.

4. **As a marketer**, I want to choose between different visual styles (minimal, bold, elegant, etc.) so I can match the quote cards to different campaign themes.

5. **As a brand manager**, I want control over which quotes are published so I can ensure brand messaging consistency and quality control.

## Functional Requirements

### Core Functionality

1. The system must accept a valid YouTube video URL as input
2. The system must validate the YouTube URL format before processing
3. The system must extract the video transcript using YouTube's transcript API or equivalent
4. The system must send the transcript to OpenAI API to identify 10 impactful, shareable quotes
5. The system must display all 10 quotes to the user in a selectable list format
6. The system must allow users to select between 3-5 quotes from the list (via checkboxes or similar UI)
7. The system must display 5 available design style options with preview/description
8. The system must allow users to choose ONE design style that will be applied to all selected quotes
9. The system must generate quote cards only for the user-selected quotes using the chosen style
10. The system must create quote cards in 1080x1080px PNG format (Instagram square ratio)
11. The system must use OpenAI's DALL-E 3 image generation API to create each quote card with professional design
12. The system must allow users to download all generated quote cards as individual PNG files
13. The system must display a loading/progress indicator while processing the video
14. The system must handle errors gracefully (e.g., invalid URL, no transcript available, API failures)

### OpenAI Integration

15. The system must use OpenAI Chat API (GPT-4 or equivalent) to analyze video transcripts
16. The prompt must instruct OpenAI to select 10 quotes that are:
    - Self-contained and understandable without additional context
    - Impactful, memorable, or thought-provoking
    - Suitable length for a quote card (15-100 words)
    - Diverse in topic/theme across all 10 selections
    - Ranked by impact/shareability
17. The system must use OpenAI DALL-E 3 API to generate quote card images for selected quotes only
18. The DALL-E prompt must specify:
    - Instagram-style quote card design (1024x1024px, which is DALL-E's native square format)
    - The quote text to be prominently displayed
    - Professional aesthetic appropriate for social media based on user-selected style
    - High contrast and readability
    - Consistent design style across all cards (as chosen by user)
19. The system must handle OpenAI API rate limits and errors appropriately for both Chat and DALL-E APIs
20. The system must resize DALL-E output (1024x1024px) to 1080x1080px for Instagram optimization

### User Interface

21. The landing page must have a single, prominent input field for YouTube URL
22. After transcript extraction, the system must display a "Quote Selection" screen with 10 AI-generated quotes
23. Each quote must have a checkbox for selection
24. The system must enforce selection limits: minimum 3 quotes, maximum 5 quotes
25. The system must display selection counter (e.g., "3/5 quotes selected")
26. The system must display a "Style Selection" screen showing 5 design style options:
    - Modern Minimal
    - Bold Gradient
    - Dark Mode Elegant
    - Magazine Style
    - Tech Startup
27. Each style option must include a visual preview or descriptive text
28. The system must allow users to select ONE style via radio buttons or cards
29. The system must have a "Generate Cards" button (disabled until 3-5 quotes + 1 style selected)
30. The system must display all generated quote cards in a gallery/grid view
31. Each quote card must have a clearly visible download button
32. The system must provide a "Download All" option to get all cards at once
33. The interface must be responsive and work on mobile, tablet, and desktop devices
34. The system must provide a clear workflow with steps: URL Input → Quote Selection → Style Selection → Card Generation → Download

### Technical Requirements

35. The system must support modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
36. The application must provide appropriate user feedback for all states (loading, success, error)
37. The system must implement basic security measures (input validation, API key protection)
38. The system must validate that 3-5 quotes are selected before allowing generation
39. The system must validate that a style is selected before allowing generation

## Non-Goals (Out of Scope)

1. **Custom design editing** - Users cannot modify colors, fonts, layouts, or add custom branding beyond style selection
2. **Multiple platform support** - Only YouTube videos are supported (no Vimeo, TikTok, etc.)
3. **Manual quote writing** - Users cannot write their own custom quotes; they must select from AI-generated options
4. **User accounts/authentication** - No login required, no saved history
5. **Direct Instagram posting** - No direct API integration to post to Instagram
6. **Multiple aspect ratios** - Only 1080x1080px square format (no stories, reels, etc.)
7. **Video editing features** - No ability to clip, trim, or edit the source video
8. **Transcript editing** - Users cannot manually edit the extracted transcript
9. **Quote editing** - Users cannot edit the AI-generated quotes; they can only select/deselect
10. **Mixed style cards** - All cards in one batch must use the same design style
11. **Payment/monetization** - Free to use, no premium tiers in initial version
12. **Multi-language support** - English transcripts only in v1

## Design Considerations

### UI/UX Requirements

- **Multi-step workflow**: Clear progression through URL Input → Quote Selection → Style Selection → Card Generation
- **Step indicators**: Visual progress bar or breadcrumbs showing current step
- **Quote selection UI**: Clean, scannable list with checkboxes and character count for each quote
- **Selection validation**: Real-time feedback on selection count (e.g., "Select 2 more quotes")
- **Style selection UI**: Visual cards or tiles showing each design style with preview/description
- **Loading states**: Display progress for transcript extraction, quote generation, and image generation phases
  - Step 1 (URL → Quote Selection): Show loading spinner with "Extracting transcript and finding quotes..."
  - Step 3 (Style Selection → Results): Show loading spinner with "Generating your quote cards with DALL-E 3..." and estimated time (30-90 seconds)
- **Error feedback**: Clear messaging if DALL-E generation fails or produces unsatisfactory results
- **Preview quality**: Display generated images at full resolution in the gallery
- **Navigation**: Allow users to go back to previous steps (e.g., change quote or style selection)

### Quote Card Design Elements (via DALL-E Prompts)

Each DALL-E-generated quote card should be prompted to include:
- **Quote text**: The selected quote as the primary visual focus, integrated into the design
- **Typography**: Clear, professional, Instagram-friendly text styling
- **Visual style variety**: Use different design aesthetics across the 3-5 cards (e.g., "modern minimal white background", "bold colorful gradient", "elegant dark mode with accent colors", "magazine-style layout", "tech/startup aesthetic")
- **Readability**: High contrast between text and background
- **Composition**: Professional layout with balanced negative space
- **Attribution** (optional): Video title or channel name subtly incorporated if desired
- **Instagram-optimized**: Design specifically for social media sharing (eye-catching, scrollable feed-friendly)

## Technical Considerations

### Architecture Suggestions

- **Frontend**: HTML, CSS, JavaScript (vanilla or React)
- **Backend**: Node.js/Express for API routes
- **APIs**:
  - OpenAI Chat API (GPT-4) for quote extraction from transcripts
  - OpenAI DALL-E 3 API for image generation
  - YouTube Data API v3 or youtube-transcript library for transcript extraction
- **Image Processing**: Sharp or similar library for resizing DALL-E output from 1024x1024 to 1080x1080
- **Hosting**: Vercel, Netlify, or similar platform for easy deployment

### Dependencies

- OpenAI API key (required) - must support both Chat and DALL-E 3 endpoints
- YouTube Data API key OR use of youtube-transcript npm library
- Image manipulation library (e.g., sharp, jimp) for resizing PNG output

### Performance Considerations

- **Total processing time**: Target under 90-120 seconds for typical videos (DALL-E generation is slower than template-based approaches)
- **DALL-E 3 API**: Each image generation takes 15-30 seconds; 3-5 cards = 45-150 seconds total
- **Parallel processing**: Generate all 5 DALL-E images in parallel (concurrent API calls) to reduce total wait time
- **Caching**: Cache transcripts and extracted quotes for repeated requests of the same video
- **Rate limiting**: Implement per-IP rate limiting to manage OpenAI API costs (DALL-E is more expensive than GPT-4)
- **Cost estimation**: DALL-E 3 (1024x1024) costs ~$0.040 per image; 5 cards = ~$0.20 per video processed

### Security

- Store API keys in environment variables (.env), never in client-side code
- Validate and sanitize all user inputs
- Implement CORS appropriately
- Consider rate limiting per IP to prevent abuse

## Success Metrics

1. **Speed**: Average generation time from URL input to downloadable cards < 120 seconds
2. **Quote Quality**: 80%+ of extracted quotes are contextually appropriate and shareable
3. **Design Quality**: 80%+ of DALL-E generated cards are aesthetically pleasing and Instagram-ready without regeneration
4. **Reliability**: 90%+ success rate for valid YouTube URLs with available transcripts (accounting for DALL-E API occasional failures)
5. **User Satisfaction**: Subjective feedback - users find the AI-generated designs "professional" and "ready to post"
6. **Cost Efficiency**: Average cost per successful generation < $0.25 (including GPT-4 + DALL-E costs)
7. **Usage**: Track number of successful generations per week/month

## Open Questions

1. **Quote attribution**: Should cards include the video title, channel name, or YouTube handle in the DALL-E prompt? If so, how should it be incorporated into the design?
2. **Error handling specifics**: What should happen if a video has no transcript (e.g., music videos)? Show error message or attempt to use auto-generated captions?
3. **Rate limiting strategy**: Should there be a limit on requests per user/IP to manage API costs? (Critical given DALL-E expense)
4. **DALL-E style consistency**: Should all 5 cards from one video share a cohesive design theme, or have completely different aesthetic styles?
5. **DALL-E prompt engineering**: Should we create a library of proven prompt templates, or dynamically generate prompts for each card?
6. **Regeneration option**: Should users be able to regenerate individual cards if they're unsatisfied with DALL-E's output?
7. **Caching strategy**: Should we cache DALL-E generated images for the same video URL to reduce API costs on repeat requests?
8. **Video length limits**: Should there be a maximum video duration limit (e.g., only process videos under 60 minutes)?
9. **Analytics**: Should we track which videos are being processed, DALL-E success rates, and regeneration requests?
10. **Fallback mechanism**: If DALL-E fails for a specific card, should we retry, skip that card, or use a template-based fallback?

---

## User Workflow

The application follows a clear 4-step workflow:

### Step 1: URL Input
- User enters YouTube video URL
- System validates URL and extracts transcript
- Loading indicator shows progress

### Step 2: Quote Selection
- System displays 10 AI-generated quotes in a selectable list
- User reviews quotes and selects 3-5 favorites using checkboxes
- Selection counter shows progress (e.g., "3/5 selected")
- "Next" button becomes enabled when 3-5 quotes are selected

### Step 3: Style Selection
- User chooses ONE design style from 5 options:
  - Modern Minimal
  - Bold Gradient
  - Dark Mode Elegant
  - Magazine Style
  - Tech Startup
- Each style shows a visual preview or description
- "Generate Cards" button becomes enabled when style is selected

### Step 4: Card Generation & Download
- System generates quote cards using DALL-E 3 with selected style
- Cards are displayed in a gallery
- User can download individual cards or all at once

---

**Document Version:** 2.0 (Added quote selection and style customization features)
**Created:** 2025-11-05
**Last Updated:** 2025-11-08
**Target Audience:** Junior Developer
**Estimated Effort:** 3-4 weeks for MVP

## Key Changes from v1.1

- **Quote Selection**: Users now see 10 AI-generated quotes and select their favorites (3-5) instead of automatic selection
- **Style Customization**: Users can choose from 5 predefined design styles instead of automatic random assignment
- **Multi-step Workflow**: Changed from single-step automatic generation to 4-step guided workflow
- **User Control**: Increased user agency and customization while maintaining simplicity
- **UI Complexity**: Added quote selection screen and style selection screen
- **Processing Time**: Slightly increased to ~2-3 minutes due to additional user interaction steps
