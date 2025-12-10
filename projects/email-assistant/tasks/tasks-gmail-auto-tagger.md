# Implementation Tasks: Gmail Auto-Tagger

## Relevant Files

### Backend Files
- `backend/server.js` - Main Express server with API endpoints
- `backend/config/database.js` - Database connection configuration
- `backend/config/gmail.js` - Gmail API OAuth configuration
- `backend/models/User.js` - User model with Gmail tokens
- `backend/models/Rule.js` - Tagging rule model
- `backend/models/TaggingLog.js` - Email tagging activity log model
- `backend/routes/auth.js` - OAuth authentication routes
- `backend/routes/rules.js` - Rule CRUD API endpoints
- `backend/routes/gmail.js` - Gmail API interaction routes
- `backend/services/gmailService.js` - Gmail API wrapper functions
- `backend/services/pubsubService.js` - Gmail Push Notification handler
- `backend/services/emailProcessor.js` - Core email processing logic
- `backend/services/aiMatcher.js` - LLM rule matching service
- `backend/middleware/auth.js` - JWT authentication middleware
- `backend/utils/encryption.js` - Token encryption utilities
- `backend/.env.example` - Environment variables template
- `backend/package.json` - Backend dependencies
- `backend/server.test.js` - Backend integration tests

### Frontend Files
- `frontend/src/App.jsx` - Main React app component
- `frontend/src/pages/Login.jsx` - OAuth login page
- `frontend/src/pages/Settings.jsx` - Main settings page with rules management
- `frontend/src/components/Header.jsx` - Header with account info
- `frontend/src/components/ApiKeySection.jsx` - OpenAI API key management component
- `frontend/src/components/RuleList.jsx` - List of tagging rules
- `frontend/src/components/RuleCard.jsx` - Individual rule display card
- `frontend/src/components/RuleForm.jsx` - Rule creation/editing form
- `frontend/src/components/TestRuleModal.jsx` - Modal for testing rules
- `frontend/src/services/api.js` - Axios API client
- `frontend/src/services/localStorage.js` - LocalStorage utilities for API key
- `frontend/src/utils/validation.js` - Input validation functions
- `frontend/src/styles/Settings.css` - Settings page styles
- `frontend/package.json` - Frontend dependencies
- `frontend/src/App.test.jsx` - Frontend component tests

### Configuration Files
- `README.md` - Project documentation
- `.gitignore` - Git ignore rules
- `docker-compose.yml` - Docker configuration for local development
- `vercel.json` - Vercel deployment configuration

### Notes

- Backend uses Node.js/Express with PostgreSQL database
- Frontend uses React with Axios for API calls
- OpenAI API key stored in browser localStorage (never sent to backend)
- Gmail OAuth tokens encrypted and stored in database
- Use `npm test` to run all tests
- Follow RESTful API conventions for endpoint naming

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/gmail-auto-tagger`)

- [x] 1.0 Project Setup & Infrastructure
  - [x] 1.1 Initialize backend project with Node.js/Express
  - [x] 1.2 Create `backend/package.json` with dependencies (express, pg, googleapis, dotenv, cors, jsonwebtoken, bcrypt)
  - [x] 1.3 Initialize frontend project with React (using Vite or Create React App)
  - [x] 1.4 Create `frontend/package.json` with dependencies (react, react-router-dom, axios, tailwindcss)
  - [x] 1.5 Set up PostgreSQL database locally or use cloud service (ElephantSQL, Supabase)
  - [x] 1.6 Create `.gitignore` files for both backend and frontend (exclude node_modules, .env, build)
  - [x] 1.7 Create `backend/.env.example` with required environment variables template
  - [x] 1.8 Create `README.md` with project overview and setup instructions
  - [x] 1.9 Install all dependencies (`npm install` in both backend and frontend)

- [x] 2.0 Backend API & Authentication System
  - [x] 2.1 Create `backend/server.js` with Express app initialization
  - [x] 2.2 Set up CORS middleware to allow frontend requests
  - [x] 2.3 Create `backend/config/database.js` for PostgreSQL connection
  - [x] 2.4 Create `backend/config/gmail.js` with OAuth 2.0 client configuration
  - [x] 2.5 Create `backend/routes/auth.js` with `/auth/google` endpoint for OAuth initiation
  - [x] 2.6 Implement `/auth/google/callback` endpoint to handle OAuth callback
  - [x] 2.7 Generate JWT tokens after successful authentication
  - [x] 2.8 Create `backend/middleware/auth.js` to verify JWT tokens on protected routes
  - [x] 2.9 Implement `/auth/disconnect` endpoint to revoke tokens and delete user data
  - [x] 2.10 Create `backend/utils/encryption.js` for encrypting/decrypting Gmail refresh tokens
  - [ ] 2.11 Test OAuth flow manually using Postman or browser

- [x] 3.0 Database Schema & Models
  - [x] 3.1 Design database schema with tables: users, rules, tagging_logs
  - [x] 3.2 Create migration script to set up database tables
  - [x] 3.3 Create `backend/models/User.js` with fields: id, email, gmail_token_encrypted, created_at, updated_at
  - [x] 3.4 Create `backend/models/Rule.js` with fields: id, user_id, label_name, rule_description, priority, is_active, created_at
  - [x] 3.5 Create `backend/models/TaggingLog.js` with fields: id, user_id, email_id, applied_label, matched_rule_id, confidence_score, timestamp
  - [x] 3.6 Implement model methods for CRUD operations (create, read, update, delete)
  - [x] 3.7 Add database indexes on user_id and email_id for performance
  - [x] 3.8 Test database connections and model operations

- [ ] 4.0 Gmail API Integration & Pub/Sub Setup
  - [ ] 4.1 Create Google Cloud Project and enable Gmail API
  - [ ] 4.2 Set up OAuth 2.0 credentials (client ID and secret)
  - [ ] 4.3 Configure OAuth consent screen with required scopes (gmail.labels, gmail.modify)
  - [ ] 4.4 Enable Google Cloud Pub/Sub API in the project
  - [ ] 4.5 Create Pub/Sub topic for Gmail push notifications
  - [ ] 4.6 Create `backend/services/gmailService.js` with functions: listLabels, createLabel, getEmail, modifyEmail
  - [ ] 4.7 Implement `watchMailbox()` function to set up Gmail push notifications
  - [ ] 4.8 Create `backend/services/pubsubService.js` to handle incoming Pub/Sub messages
  - [ ] 4.9 Create POST `/webhook/gmail` endpoint to receive push notifications
  - [ ] 4.10 Verify webhook endpoint with Google (use ngrok for local testing)
  - [ ] 4.11 Implement initial 30-day email fetching logic for new users
  - [ ] 4.12 Test receiving push notifications when new emails arrive

- [x] 5.0 AI-Powered Rule Matching System
  - [x] 5.1 Create `backend/services/aiMatcher.js` for LLM integration
  - [x] 5.2 Design prompt template for rule evaluation (include email metadata and body)
  - [x] 5.3 Implement function to call OpenAI API with email data and rules
  - [x] 5.4 Parse LLM response to extract match decision and confidence score
  - [x] 5.5 Implement caching mechanism to avoid redundant LLM calls for similar emails
  - [x] 5.6 Add error handling for LLM API failures (invalid key, rate limits, insufficient credits)
  - [x] 5.7 Implement priority-based rule selection (highest priority wins)
  - [x] 5.8 Add logging for all LLM requests with confidence scores
  - [ ] 5.9 Test rule matching with sample emails and various rule descriptions

- [x] 6.0 Frontend Settings Interface
  - [x] 6.1 Create `frontend/src/App.jsx` with React Router for navigation
  - [x] 6.2 Create `frontend/src/pages/Login.jsx` with "Sign in with Google" button
  - [x] 6.3 Implement OAuth redirect flow in Login component
  - [x] 6.4 Create `frontend/src/pages/Settings.jsx` as main settings page
  - [x] 6.5 Create `frontend/src/components/Header.jsx` with Gmail account display and Disconnect button
  - [x] 6.6 Create `frontend/src/components/ApiKeySection.jsx` for OpenAI API key management
  - [x] 6.7 Implement API key input field (password type) with Save/Update/Delete buttons
  - [x] 6.8 Create `frontend/src/services/localStorage.js` with functions: saveApiKey, getApiKey, deleteApiKey
  - [x] 6.9 Implement API key validation (format: sk-..., length check)
  - [x] 6.10 Display masked API key (show only last 4 characters)
  - [x] 6.11 Create `frontend/src/components/RuleList.jsx` to display all rules
  - [x] 6.12 Create `frontend/src/components/RuleCard.jsx` for individual rule display with edit/delete buttons
  - [x] 6.13 Create `frontend/src/components/RuleForm.jsx` with fields: label selector, rule description textarea, priority slider
  - [x] 6.14 Implement label dropdown that fetches existing Gmail labels from backend
  - [x] 6.15 Add "Create New Label" option in label dropdown
  - [x] 6.16 Implement active/inactive toggle switch for each rule
  - [x] 6.17 Create `frontend/src/components/TestRuleModal.jsx` for testing rules (optional MVP feature)
  - [x] 6.18 Add toast notifications for success/error messages
  - [x] 6.19 Implement connection status indicator (green dot = connected)
  - [x] 6.20 Style all components using Tailwind CSS or Material-UI
  - [x] 6.21 Ensure responsive design for mobile and desktop
  - [x] 6.22 Test all UI interactions and form validations

- [x] 7.0 Email Processing & Tagging Logic
  - [x] 7.1 Create `backend/services/emailProcessor.js` as main processing orchestrator
  - [x] 7.2 Implement `processNewEmail(emailId, userId)` function
  - [x] 7.3 Fetch email details from Gmail API (sender, subject, body, metadata)
  - [x] 7.4 Retrieve all active rules for the user from database
  - [x] 7.5 Retrieve user's OpenAI API key from frontend (passed in request headers)
  - [x] 7.6 Evaluate each rule against the email using AI matcher
  - [x] 7.7 Select highest priority rule if multiple matches
  - [x] 7.8 Apply label to email using Gmail API's modifyEmail function
  - [x] 7.9 Log tagging action to database (email_id, applied_label, matched_rule, confidence)
  - [x] 7.10 Implement error handling with retry logic (exponential backoff, max 3 retries)
  - [x] 7.11 Handle case where no rules match (log and continue)
  - [x] 7.12 Implement rate limiting to respect Gmail API quotas
  - [x] 7.13 Create API endpoint POST `/api/rules` to create new rule
  - [x] 7.14 Create API endpoint PUT `/api/rules/:id` to update rule
  - [x] 7.15 Create API endpoint DELETE `/api/rules/:id` to delete rule
  - [x] 7.16 Create API endpoint GET `/api/rules` to fetch all user rules
  - [x] 7.17 Create API endpoint GET `/api/labels` to fetch Gmail labels
  - [x] 7.18 Create API endpoint POST `/api/labels` to create new Gmail label
  - [ ] 7.19 Test full email processing flow end-to-end

- [ ] 8.0 Testing, Documentation & Deployment
  - [ ] 8.1 Write unit tests for `backend/services/aiMatcher.js`
  - [ ] 8.2 Write unit tests for `backend/services/emailProcessor.js`
  - [ ] 8.3 Write integration tests for authentication routes
  - [ ] 8.4 Write integration tests for rule CRUD endpoints
  - [ ] 8.5 Write frontend component tests for RuleForm and ApiKeySection
  - [ ] 8.6 Test OAuth flow with test Google account
  - [ ] 8.7 Test real-time email tagging with live Gmail account
  - [ ] 8.8 Update `README.md` with complete setup instructions
  - [ ] 8.9 Document API endpoints in `API_DOCS.md` or use Swagger
  - [ ] 8.10 Add troubleshooting section to documentation
  - [ ] 8.11 Create environment setup guide for Google Cloud and Pub/Sub
  - [ ] 8.12 Set up CI/CD pipeline (GitHub Actions) for automated testing
  - [ ] 8.13 Deploy backend to cloud platform (Heroku, Railway, or GCP)
  - [ ] 8.14 Deploy frontend to Vercel or Netlify
  - [ ] 8.15 Configure production environment variables
  - [ ] 8.16 Set up production database (managed PostgreSQL)
  - [ ] 8.17 Test production deployment with real Gmail account
  - [ ] 8.18 Monitor application logs for errors
  - [ ] 8.19 Set up error tracking (Sentry or similar)
  - [ ] 8.20 Create user guide with screenshots for onboarding
