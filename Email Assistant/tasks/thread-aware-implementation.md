# Thread-Aware Re-Evaluation Implementation Task List

## Overview
Implement thread-aware email processing that automatically re-evaluates and updates labels on all emails in a thread when thread context changes (e.g., when user replies to an email).

## Example Use Case
1. **Initial State**: Email from client arrives → Labeled as "To Respond"
2. **User Action**: User replies to the client
3. **System Response**: Thread is re-evaluated → All emails in thread relabeled as "Awaiting Reply"

## Database Changes

### Task 1: Update `tagging_logs` table schema
**File**: `backend/database/migrations/002_add_thread_tracking.sql`

Add columns to track:
- `thread_id` - Gmail thread ID for grouping
- `is_auto_applied` - Boolean to distinguish auto vs manual labels
- `removed_at` - Timestamp when label was removed (for audit trail)

```sql
ALTER TABLE tagging_logs
ADD COLUMN IF NOT EXISTS thread_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_auto_applied BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_tagging_logs_thread_id ON tagging_logs(thread_id);
CREATE INDEX IF NOT EXISTS idx_tagging_logs_user_thread ON tagging_logs(user_id, thread_id);
```

## Backend Service Changes

### Task 2: Add `removeLabel` function to gmailService.js
**File**: `backend/services/gmailService.js`

Add new function to remove labels from emails:
```javascript
/**
 * Remove a label from an email
 * @param {string} userId - User ID
 * @param {string} emailId - Gmail message ID
 * @param {string} labelName - Name of the label to remove
 * @returns {Promise<Object>} Modified message object
 */
const removeLabel = async (userId, emailId, labelName) => {
  // Get label ID by name
  // Call modifyEmail with removeLabels parameter
}
```

### Task 3: Add thread re-evaluation to emailProcessor.js
**File**: `backend/services/emailProcessor.js`

Add new functions:

1. **`processThread`** - Process all emails in a thread
```javascript
/**
 * Process an entire email thread and re-evaluate labels
 * @param {string} userId - User ID
 * @param {string} threadId - Gmail thread ID
 * @param {string} openaiApiKey - User's OpenAI API key
 * @returns {Promise<Object>} Processing result
 */
const processThread = async (userId, threadId, openaiApiKey) => {
  // 1. Fetch all emails in the thread via gmailService.getThread()
  // 2. Get all active rules for user
  // 3. For each email in thread:
  //    a. Find best matching rule (passing FULL thread context to AI)
  //    b. Get currently applied auto-labels from tagging_logs
  //    c. If label changed:
  //       - Remove old auto-applied label
  //       - Apply new label
  //       - Log the change
  // 4. Return summary of updates
}
```

2. **`getAutoAppliedLabels`** - Get auto-applied labels for an email
```javascript
/**
 * Get all auto-applied labels for an email
 * @param {string} userId - User ID
 * @param {string} emailId - Gmail message ID
 * @returns {Promise<Array>} List of auto-applied label names
 */
const getAutoAppliedLabels = async (userId, emailId) => {
  // Query tagging_logs where is_auto_applied=true and removed_at IS NULL
}
```

3. Update **`processNewEmail`** to store thread_id and is_auto_applied:
```javascript
// In the logging section:
await db.query(
  `INSERT INTO tagging_logs (user_id, email_id, thread_id, applied_label, matched_rule_id, confidence_score, is_auto_applied)
   VALUES ($1, $2, $3, $4, $5, $6, true)`,
  [userId, emailId, email.threadId, matchResult.labelName, matchResult.ruleId, matchResult.confidence]
);
```

### Task 4: Update emailPoller.js to detect threads
**File**: `backend/services/emailPoller.js`

Modify the polling logic:

```javascript
// After fetching new email:
const latestEmail = await gmailService.getEmail(userId, emails[0].id);
const threadId = latestEmail.threadId;

// Check if this thread has been processed before
const threadHistory = await db.query(
  'SELECT DISTINCT thread_id FROM tagging_logs WHERE user_id = $1 AND thread_id = $2',
  [userId, threadId]
);

if (threadHistory.rows.length > 0) {
  // Thread exists - re-evaluate entire thread
  console.log(`[emailPoller] Thread ${threadId} exists, re-evaluating...`);
  await emailProcessor.processThread(userId, threadId, openaiApiKey);
} else {
  // New thread - process single email
  console.log(`[emailPoller] New thread ${threadId}, processing single email`);
  await emailProcessor.processEmailWithRetry(userId, emailSummary.id, openaiApiKey);
}
```

### Task 5: Update AI matcher to support thread context
**File**: `backend/services/aiMatcher.js`

Update the AI prompts to include thread context:

```javascript
// In findBestMatch function, include thread information:
const emailContext = `
Email: "${email.subject}"
From: ${email.from}
Date: ${email.date}
Body: ${email.body}

Thread Context:
${email.thread.map((msg, idx) =>
  `Message ${idx + 1} (${msg.from} at ${msg.date}): ${msg.snippet}`
).join('\n')}

Last message in thread from: ${email.thread[email.thread.length - 1].from}
User's email: ${userEmail}
`;
```

## Testing

### Task 6: Create test scenarios
**File**: `backend/tests/thread-aware.test.js`

Test cases:
1. New thread → Apply initial label
2. Reply to thread → Re-evaluate and update labels
3. Thread with manual labels → Don't remove manual labels
4. Multiple threads processed simultaneously
5. Thread with 10+ messages → Performance test

### Task 7: Manual testing checklist
1. ✓ Create rule "To Respond" for incoming emails
2. ✓ Create rule "Awaiting Reply" for threads where user sent last message
3. ✓ Receive email → Verify "To Respond" label applied
4. ✓ Reply to email → Verify label changes to "Awaiting Reply"
5. ✓ Manually add label → Verify it's not removed on re-evaluation
6. ✓ Receive reply from sender → Verify label changes back to "To Respond"

## Migration & Deployment

### Task 8: Run database migration
```bash
psql -U jackshen -d gmail_auto_tagger -f backend/database/migrations/002_add_thread_tracking.sql
```

### Task 9: Update existing tagging_logs
```sql
-- Backfill thread_id for existing logs (if possible from email data)
-- Set is_auto_applied=true for all existing logs
UPDATE tagging_logs SET is_auto_applied = true WHERE is_auto_applied IS NULL;
```

## Performance Considerations

1. **Thread size limit**: Only re-evaluate threads with <50 messages to avoid excessive API calls
2. **Rate limiting**: Add 500ms delay between processing each email in a thread
3. **Caching**: Cache thread context for 5 minutes to avoid refetching
4. **Background processing**: Consider moving thread re-evaluation to a job queue for large threads

## Success Criteria

- ✓ PRD updated with thread-aware requirements
- ✓ Database schema supports thread tracking
- ✓ Labels update automatically when thread context changes
- ✓ Manual labels are preserved during re-evaluation
- ✓ System handles threads with 10+ messages
- ✓ Re-evaluation completes within 10 seconds
- ✓ All tests pass
