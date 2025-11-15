# Product Requirements Document: Gmail Auto-Tagger

## Introduction/Overview

The Gmail Auto-Tagger is an intelligent email labeling system that automatically organizes Gmail inbox by applying labels (tags) based on AI-powered, natural language rules. Users manage their tagging rules through a web-based settings interface where they can create custom labels and define rule conditions in plain English (e.g., "promotional emails from retailers", "urgent messages from my manager").

**Problem it solves:** Email organization is time-consuming and repetitive. Users waste valuable time manually sorting and labeling emails. This system automates the labeling process using intelligent rules that understand context and intent, not just keyword matching.

**Goal:** Enable users to achieve inbox zero faster by automatically categorizing emails in real-time with minimal setup effort.

## Goals

1. **Reduce manual email organization time by 80%** - Automate the repetitive task of applying labels to incoming emails
2. **Provide intuitive rule creation** - Non-technical users can create sophisticated tagging rules using natural language
3. **Achieve real-time labeling** - New emails are labeled within seconds of arrival
4. **Ensure high accuracy** - AI-powered rules correctly identify and tag at least 90% of emails on first try
5. **Maintain user control** - Users can easily create, edit, prioritize, and delete tagging rules

## User Stories

### Primary User Stories

1. **As a busy professional**, I want my promotional emails automatically labeled so I can review them later in batch, keeping my primary inbox focused on important communications.

2. **As a project manager**, I want emails about "Project Phoenix" automatically labeled so I can quickly find all related correspondence without manual filing.

3. **As a freelancer**, I want client emails automatically tagged by client name so I can track conversations per project without manual organization.

4. **As a knowledge worker**, I want urgent emails from my boss automatically labeled as "Urgent" and prioritized so I never miss time-sensitive requests.

5. **As a new user**, I want the system to apply my rules to recent emails (last 30 days) during initial setup so my existing inbox gets organized without manual work.

### Secondary User Stories

6. **As a power user**, I want to set priority levels on my rules so when multiple rules could apply, the most important label is used.

7. **As a rule creator**, I want to describe my tagging conditions in natural language so I don't need to learn complex filter syntax.

8. **As a Gmail user**, I want the system to work within Gmail's existing label structure so I can see and manage tags in my normal Gmail interface.

## Functional Requirements

### Authentication & Setup
1. The system must allow users to authenticate via Gmail OAuth 2.0
2. The system must request only the minimum Gmail API permissions needed: `gmail.labels` and `gmail.modify`
3. Upon first login, the system must fetch and process emails from the last 30 days
4. The system must store Gmail refresh tokens securely for continuous access
5. The system must handle OAuth token expiration and re-authentication gracefully

### Frontend Settings Interface
6. The system must provide a web-based settings page for managing tagging rules
7. The system must display all existing Gmail labels and allow users to select them for tagging
8. The system must allow users to create new Gmail labels directly from the settings interface
9. The system must provide a text input field for users to describe rule conditions in natural language
10. The system must display all created rules in a list showing: label name, rule description, priority, and active/inactive status
11. The system must allow users to edit existing rules (change description, label, or priority)
12. The system must allow users to delete rules with a confirmation prompt
13. The system must allow users to set priority levels for each rule (1-10, where 10 is highest)
14. The system must allow users to temporarily disable/enable rules without deletion
15. The system must display a visual indicator showing connection status with Gmail account
16. The system must provide a "Test Rule" feature that shows sample emails that would match a rule
17. The system must provide a settings section for users to input and save their OpenAI API key
18. The system must store the OpenAI API key locally (browser localStorage or encrypted file) for security
19. The system must validate the OpenAI API key format before saving
20. The system must display a masked version of the stored API key (showing only last 4 characters)
21. The system must allow users to update or delete their stored API key

### Real-Time Email Processing
22. The system must use Gmail Push Notifications (Pub/Sub) to receive real-time notifications when new emails arrive
23. Upon receiving a notification, the system must fetch the new email details within 5 seconds
24. The system must evaluate all active rules against each new email
25. The system must use AI (LLM) to interpret natural language rules and determine if an email matches
26. The system must retrieve the user's OpenAI API key from local storage to make LLM API calls
27. When multiple rules match, the system must apply only the label from the highest priority rule
28. The system must apply the determined label via Gmail API's modify endpoint
29. The system must log all tagging actions (timestamp, email ID, applied label, matched rule)
30. The system must handle API rate limits gracefully with exponential backoff retry logic
31. The system must display user-friendly error messages if the OpenAI API key is invalid or missing

### Thread-Aware Re-Evaluation (Dynamic Label Updates)
31a. When a new email arrives that is part of an existing thread, the system must detect the thread relationship
31b. The system must re-evaluate ALL emails in the thread (not just the new email) when thread context changes
31c. Before applying a new label, the system must remove previous auto-applied labels from emails in the thread
31d. The system must track which labels were auto-applied vs manually applied by the user
31e. The system must NEVER remove manually-applied labels during re-evaluation
31f. The system must pass full thread context to the AI for intelligent state-based labeling (e.g., "To Respond" → "Awaiting Reply" after user sends a reply)
31g. The system must support thread-aware rules like:
    - "To Respond" - Emails in threads where the last message is from someone else
    - "Awaiting Reply" - Emails in threads where the last message is from the user
    - "Resolved" - Threads with no activity for 7+ days after user's last message
31h. The system must update thread labels within 10 seconds of detecting a new message in the thread
31i. The system must store thread_id associations in the tagging_logs table to enable efficient thread lookups

### AI-Powered Rule Matching
32. The system must support natural language rule descriptions such as:
    - "Promotional emails from online stores"
    - "Urgent messages from my manager (john@company.com)"
    - "Newsletters about technology"
    - "Emails requiring a response"
    - "Receipts and invoices"
33. The AI must analyze email metadata including: sender, subject, recipients, CC/BCC fields
34. The AI must analyze email body content for context understanding
35. The AI must consider thread context when evaluating rules
36. The system must provide confidence scores for rule matches (stored in logs for debugging)

### Rule Updates & Management
37. When a user creates a new rule, it must only apply to future emails (not retroactive)
38. When a user updates an existing rule, it must only apply to future emails
39. When a user deletes a rule, previously applied labels must remain on emails (no retroactive removal)
40. The system must validate that each rule has: a label, a description, and a priority before saving
41. The system must prevent duplicate rules (same label + same description)

### Error Handling & Recovery
42. The system must display user-friendly error messages when Gmail connection fails
43. The system must automatically retry failed tagging operations up to 3 times
44. The system must notify users via the settings page if their Gmail token has expired
45. The system must notify users if their OpenAI API key is invalid, expired, or has insufficient credits
46. The system must log all errors with sufficient detail for debugging (without exposing sensitive data)
47. The system must continue processing other emails if one email fails to process

### Data & Privacy
48. The system must never send emails on behalf of the user
49. The system must only read email metadata and content for matching purposes
50. The system must not store full email content permanently (only process in-memory)
51. The system must provide a "Disconnect" feature to revoke Gmail access and delete stored credentials
52. The system must store the OpenAI API key locally on the user's device (never transmitted to our servers)
53. The system must be transparent about what data is stored (user settings, rule definitions, activity logs, API keys)

## Non-Goals (Out of Scope)

1. **No email composition or sending** - This system only reads and labels emails, never sends them
2. **No retroactive tagging on rule updates** - When users modify rules, old emails keep their existing labels
3. **No email content modification** - The system only adds labels, never modifies email content
4. **No multi-account support (v1)** - Initial version supports one Gmail account per user
5. **No advanced filters beyond AI natural language** - No regex, complex boolean logic, or manual filter creation
6. **No email analytics or reporting** - Focus is purely on tagging automation
7. **No mobile native app** - Web interface only
8. **No email archiving or deletion** - Labels only, no destructive actions
9. **No integration with other email providers** - Gmail only for v1
10. **No collaborative rule sharing** - Rules are private to each user's account

## Design Considerations

### UI/UX Requirements

**Settings Page Layout:**
- **Header:** Display connected Gmail account with "Disconnect" button
- **API Key Section:** Collapsible section at the top for OpenAI API key management
  - Input field for API key (masked/password type)
  - "Save" button to store API key locally
  - Display masked version of stored key (e.g., "sk-...xyz123")
  - "Update" and "Delete" buttons for key management
- **Main Section:** Two-column layout
  - **Left Column:** List of all tagging rules (sortable by priority)
  - **Right Column:** Rule creation/editing form
- **Rule Card Design:** Each rule displays:
  - Label name (with color indicator matching Gmail label colors)
  - Rule description in quoted text
  - Priority number badge
  - Active/Inactive toggle switch
  - Edit and Delete action buttons
- **Rule Form Fields:**
  - Label selector (dropdown of existing labels + "Create New Label" option)
  - Natural language rule input (multi-line text area with placeholder examples)
  - Priority slider (1-10 with visual indicators)
  - "Test Rule" button and "Save Rule" button

**Visual Feedback:**
- Loading spinner when fetching initial 30 days of emails
- Success toast notification when rule is created/updated
- Inline error messages for validation failures
- Real-time connection status indicator (green dot = connected)

**Accessibility:**
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly labels

### Style Guide
- Clean, modern interface inspired by Gmail's design language
- Color palette: Blues and grays with accent colors for labels
- Typography: Sans-serif font (Roboto or similar)
- Responsive design (desktop-first, mobile-friendly)

## Technical Considerations

### Backend Architecture
- **Framework:** Node.js/Express or Python/Flask for REST API
- **Database:** PostgreSQL or MongoDB for storing user settings and rules
- **Gmail Integration:**
  - Google OAuth 2.0 for authentication
  - Gmail API for email access and label management
  - Google Cloud Pub/Sub for real-time email notifications
- **AI/LLM Integration:**
  - OpenAI GPT-4 or Anthropic Claude for natural language rule interpretation
  - Prompt engineering to evaluate emails against rules
  - Caching mechanism to avoid redundant API calls for similar emails

### Frontend Stack
- **Framework:** React or Vue.js for interactive UI
- **State Management:** Redux or Vuex for managing rules and connection state
- **HTTP Client:** Axios for API communication
- **Styling:** Tailwind CSS or Material-UI

### Security Requirements
- OAuth tokens stored encrypted at rest
- HTTPS only for all communications
- OpenAI API keys stored in browser localStorage (encrypted if possible) or local encrypted file
- API keys never transmitted to backend servers - used directly from client for LLM calls
- Rate limiting on API endpoints to prevent abuse
- Input validation and sanitization on all user inputs
- Clear user messaging that they are responsible for their own OpenAI API costs

### Third-Party Dependencies
- **Gmail API:** Requires Google Cloud project setup with Pub/Sub enabled
- **LLM API:** OpenAI API key or Anthropic API key
- **OAuth Library:** `passport` (Node.js) or `authlib` (Python)

### Performance Considerations
- Gmail API has rate limits (quota of 1 billion quota units/day for free tier)
- Implement caching for frequently accessed data (label lists)
- Use batch requests where possible to reduce API calls
- Queue system for processing multiple incoming emails simultaneously

### Deployment
- **Backend:** Deployed on cloud platform (AWS, GCP, or Heroku)
- **Frontend:** Static hosting (Vercel, Netlify) or served from backend
- **Database:** Managed database service for reliability
- **Environment:** Development, staging, and production environments

## Success Metrics

1. **User Adoption:** 100 active users within first month of launch
2. **Tagging Accuracy:** 90%+ of emails tagged correctly (measured via user feedback/corrections)
3. **Processing Speed:** 95% of emails tagged within 10 seconds of arrival
4. **User Satisfaction:** Average rating of 4.5/5 stars on user feedback survey
5. **Rule Creation:** Average of 5+ rules created per active user
6. **Time Savings:** Users report saving at least 30 minutes per week on email organization (via survey)
7. **System Reliability:** 99%+ uptime for email processing service
8. **Error Rate:** <1% of emails fail to process due to system errors

## Open Questions

1. **Rate Limiting Strategy:** How should we handle users who receive hundreds of emails per hour? Should we implement user-specific rate limits or queuing?

2. **LLM Cost Management:** Each email processed requires an LLM API call using the user's own OpenAI API key. Should we:
   - Provide cost estimation before processing (e.g., "~$0.01 per email")?
   - Implement smart caching to avoid redundant API calls for similar emails?
   - Display monthly cost tracking in the UI?
   - Recommend cost-effective models (GPT-3.5-turbo vs GPT-4)?

3. **Rule Complexity:** Should we allow users to combine multiple conditions with AND/OR logic in natural language (e.g., "emails from john@company.com OR sarah@company.com about Project Phoenix")?

4. **Label Conflicts:** If a user has existing Gmail filters that also apply labels, how do we handle conflicts? Should we:
   - Check for existing labels before applying ours?
   - Apply our label regardless (allow multiple labels)?
   - Provide a warning in the UI about potential conflicts?

5. **Onboarding Experience:** For new users with thousands of emails in the last 30 days, initial processing could take several minutes. How do we make this wait time more pleasant?
   - Progress bar showing "X of Y emails processed"?
   - Allow users to skip initial processing?
   - Process in background and notify when complete?

6. **Rule Testing:** The "Test Rule" feature needs sample emails to show. Should we:
   - Use the user's actual recent emails (privacy concern)?
   - Generate synthetic example emails?
   - Allow users to paste sample email text?

7. **Priority Ties:** If two rules have the same priority level and both match an email, which rule wins? Should we:
   - Apply the first rule created (oldest)?
   - Apply the most recently created rule?
   - Prompt user to fix priority conflicts?
   - Apply both labels (change from single-label to multi-label)?

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Status:** Draft - Awaiting Review
