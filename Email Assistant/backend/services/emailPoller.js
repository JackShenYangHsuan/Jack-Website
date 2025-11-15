/**
 * Email Poller Service
 * Polls Gmail for new emails and processes them automatically
 */

const gmailService = require('./gmailService');
const emailProcessor = require('./emailProcessor');
const db = require('../config/database');

// Polling interval in milliseconds (default: 10 seconds)
const POLLING_INTERVAL = 10 * 1000;

// Store active pollers
const activePollers = new Map();

/**
 * Start polling for a user
 * @param {string} userId - User ID
 * @param {string} openaiApiKey - User's OpenAI API key
 * @returns {string} Poller ID
 */
const startPolling = (userId, openaiApiKey) => {
  // Don't start if already polling
  if (activePollers.has(userId)) {
    console.log(`[emailPoller] Already polling for user ${userId}`);
    return userId;
  }

  console.log(`[emailPoller] Starting email polling for user ${userId}`);

  // Store the last processed history ID to track new emails
  let lastHistoryId = null;

  const pollEmails = async () => {
    try {
      console.log(`[emailPoller] Checking for new emails for user ${userId}...`);

      // Get the current history ID
      const emails = await gmailService.listRecentEmails(userId, 1);

      if (emails.length === 0) {
        console.log(`[emailPoller] No emails found for user ${userId}`);
        return;
      }

      // Get full email details to get history ID
      const latestEmail = await gmailService.getEmail(userId, emails[0].id);
      const currentHistoryId = latestEmail.historyId;

      // First run - just store the history ID
      if (lastHistoryId === null) {
        lastHistoryId = currentHistoryId;
        console.log(`[emailPoller] Initial history ID set to ${lastHistoryId}`);
        return;
      }

      // Check if there are new emails (history ID changed)
      if (currentHistoryId === lastHistoryId) {
        console.log(`[emailPoller] No new emails (history ID unchanged)`);
        return;
      }

      console.log(`[emailPoller] New emails detected! History ID changed from ${lastHistoryId} to ${currentHistoryId}`);

      // Get new emails (emails received since last check)
      // We'll process the last 5 emails to catch any new ones
      const recentEmails = await gmailService.listRecentEmails(userId, 5);

      console.log(`[emailPoller] Found ${recentEmails.length} recent emails to check`);

      let processedCount = 0;
      const processedThreads = new Set(); // Track which threads we've already re-evaluated
      const newThreadsInBatch = new Set(); // Track threads that are new in THIS batch

      for (const emailSummary of recentEmails) {
        try {
          // First, get full email details to access threadId
          const fullEmail = await gmailService.getEmail(userId, emailSummary.id);
          const threadId = fullEmail.threadId;

          // Check if we already processed this email
          const alreadyProcessed = await db.query(
            'SELECT id FROM tagging_logs WHERE user_id = $1 AND email_id = $2',
            [userId, emailSummary.id]
          );

          if (alreadyProcessed.rows.length > 0) {
            console.log(`[emailPoller] Email ${emailSummary.id} already processed, skipping`);
            continue;
          }

          // Check if this thread has been processed before (in database OR in current batch)
          const threadHistory = await db.query(
            'SELECT DISTINCT thread_id FROM tagging_logs WHERE user_id = $1 AND thread_id = $2',
            [userId, threadId]
          );

          const threadExistsInDB = threadHistory.rows.length > 0;
          const threadExistsInBatch = newThreadsInBatch.has(threadId);
          const threadAlreadyReEvaluated = processedThreads.has(threadId);

          if ((threadExistsInDB || threadExistsInBatch) && !threadAlreadyReEvaluated) {
            // Thread exists (either in DB or was just created in this batch) - re-evaluate entire thread
            console.log(`[emailPoller] Thread ${threadId} exists, re-evaluating entire thread...`);
            await emailProcessor.processThread(userId, threadId, openaiApiKey);
            processedThreads.add(threadId); // Mark this thread as re-evaluated
            processedCount++;
          } else if (!threadExistsInDB && !threadExistsInBatch && !threadAlreadyReEvaluated) {
            // New thread - process single email and mark thread as new in this batch
            console.log(`[emailPoller] New thread ${threadId}, processing single email ${emailSummary.id}`);
            await emailProcessor.processEmailWithRetry(userId, emailSummary.id, openaiApiKey);
            newThreadsInBatch.add(threadId); // Track that this thread is new in current batch
            processedCount++;
          } else {
            console.log(`[emailPoller] Thread ${threadId} already re-evaluated in this batch, skipping`);
          }

          // Small delay between emails
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`[emailPoller] Error processing email ${emailSummary.id}:`, error.message);
          // Continue with other emails
        }
      }

      console.log(`[emailPoller] Processed ${processedCount} new emails`);

      // Update last history ID
      lastHistoryId = currentHistoryId;

    } catch (error) {
      console.error(`[emailPoller] Error during polling for user ${userId}:`, error.message);
    }
  };

  // Do initial poll immediately
  pollEmails();

  // Set up interval for regular polling
  const intervalId = setInterval(pollEmails, POLLING_INTERVAL);

  // Store the interval ID so we can stop it later
  activePollers.set(userId, {
    intervalId,
    openaiApiKey,
    startedAt: new Date()
  });

  console.log(`[emailPoller] Email polling started for user ${userId} (interval: ${POLLING_INTERVAL / 1000}s)`);

  return userId;
};

/**
 * Stop polling for a user
 * @param {string} userId - User ID
 */
const stopPolling = (userId) => {
  const poller = activePollers.get(userId);

  if (!poller) {
    console.log(`[emailPoller] No active poller found for user ${userId}`);
    return;
  }

  clearInterval(poller.intervalId);
  activePollers.delete(userId);

  console.log(`[emailPoller] Stopped email polling for user ${userId}`);
};

/**
 * Check if polling is active for a user
 * @param {string} userId - User ID
 * @returns {boolean}
 */
const isPolling = (userId) => {
  return activePollers.has(userId);
};

/**
 * Get polling status for a user
 * @param {string} userId - User ID
 * @returns {Object|null}
 */
const getPollingStatus = (userId) => {
  const poller = activePollers.get(userId);

  if (!poller) {
    return null;
  }

  return {
    isActive: true,
    startedAt: poller.startedAt,
    intervalSeconds: POLLING_INTERVAL / 1000
  };
};

/**
 * Get all active pollers
 * @returns {Array}
 */
const getAllActivePollers = () => {
  return Array.from(activePollers.keys());
};

module.exports = {
  startPolling,
  stopPolling,
  isPolling,
  getPollingStatus,
  getAllActivePollers,
  POLLING_INTERVAL
};
