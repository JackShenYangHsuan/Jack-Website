/**
 * Email Processor Service
 * Main orchestrator for processing emails and applying tags based on AI-matched rules
 */

const gmailService = require('./gmailService');
const aiMatcher = require('./aiMatcher');
const db = require('../config/database');

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const BACKOFF_MULTIPLIER = 2; // Exponential backoff

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Process a single email and apply appropriate label
 * @param {string} userId - User ID
 * @param {string} emailId - Gmail message ID
 * @param {string} openaiApiKey - User's OpenAI API key
 * @returns {Promise<Object>} Processing result
 */
const processNewEmail = async (userId, emailId, openaiApiKey) => {
  console.log(`Processing email ${emailId} for user ${userId}`);

  try {
    // Step 1: Fetch email details from Gmail
    const email = await gmailService.getEmail(userId, emailId);
    console.log(`Fetched email: "${email.subject}" from ${email.from}`);

    // Step 1.5: Get user's email address
    const userEmail = await gmailService.getUserEmail(userId);
    console.log(`[DEBUG processNewEmail] Retrieved userEmail: "${userEmail}"`);

    // Step 2: Determine if this is a sent or received email
    const isSentEmail = email.from && email.from.toLowerCase().includes(userEmail.toLowerCase());
    const emailDirection = isSentEmail ? 'sent' : 'received';
    console.log(`[processNewEmail] Email direction: ${emailDirection} (from: ${email.from})`);

    // Step 3: Retrieve active rules based on email direction
    const rulesResult = await db.query(
      `SELECT id, label_name, rule_description, priority, label_bg_color, label_text_color, rule_type
       FROM rules
       WHERE user_id = $1 AND is_active = true AND rule_type = $2
       ORDER BY priority DESC`,
      [userId, emailDirection]
    );

    const rules = rulesResult.rows;

    if (rules.length === 0) {
      console.log(`No active ${emailDirection} rules found for user. Skipping email processing.`);
      return {
        success: true,
        message: `No active ${emailDirection} rules to apply`,
        emailId
      };
    }

    console.log(`Found ${rules.length} active ${emailDirection} rules to evaluate`);

    // Step 4: Validate OpenAI API key
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required but not provided');
    }

    // Step 5: Classify email based on direction
    let matchResult;

    if (isSentEmail) {
      // For sent emails, use binary classification
      console.log('[processNewEmail] Using sent email classification');
      const sentResult = await aiMatcher.evaluateSentEmail(openaiApiKey, email, userEmail);

      // Find the rule that matches the category
      const matchingRule = rules.find(r => r.label_name === sentResult.category);

      if (matchingRule) {
        matchResult = {
          ruleId: matchingRule.id,
          labelName: matchingRule.label_name,
          priority: matchingRule.priority,
          matches: true,
          confidence: sentResult.confidence,
          reasoning: sentResult.reasoning
        };
      } else {
        console.log(`[processNewEmail] No rule found for category: ${sentResult.category}`);
        matchResult = null;
      }
    } else {
      // For received emails, use standard rule matching
      console.log('[processNewEmail] Using received email classification');
      matchResult = await aiMatcher.findBestMatch(openaiApiKey, email, rules, userEmail);
    }

    if (!matchResult) {
      console.log('No matching rules for this email');
      return {
        success: true,
        message: 'No matching rules found',
        emailId
      };
    }

    // Step 5: Get currently applied auto-labels and remove them
    const currentAutoLabels = await getAutoAppliedLabels(userId, emailId);
    console.log(`[processNewEmail] Current auto-labels: ${currentAutoLabels.join(', ') || 'none'}`);

    // Check if the email already has the correct label
    if (currentAutoLabels.includes(matchResult.labelName)) {
      console.log(`[processNewEmail] Label "${matchResult.labelName}" already applied, no changes needed`);
      return {
        success: true,
        message: 'Email already has the correct label',
        emailId,
        appliedLabel: matchResult.labelName,
        confidence: matchResult.confidence,
        reasoning: matchResult.reasoning
      };
    }

    // Remove old auto-applied labels (ensuring only one label at a time)
    for (const oldLabel of currentAutoLabels) {
      console.log(`[processNewEmail] Removing old auto-label "${oldLabel}" from email ${emailId}`);
      try {
        await gmailService.removeLabel(userId, emailId, oldLabel);

        // Mark as removed in database
        await db.query(
          `UPDATE tagging_logs
           SET removed_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND email_id = $2 AND applied_label = $3 AND is_auto_applied = true AND removed_at IS NULL`,
          [userId, emailId, oldLabel]
        );

        console.log(`[processNewEmail] ✓ Removed old label "${oldLabel}"`);
      } catch (error) {
        console.error(`[processNewEmail] Failed to remove label "${oldLabel}":`, error.message);
      }
    }

    // Step 6: Apply the new label to the email with color information
    const matchedRule = rules.find(r => r.id === matchResult.ruleId);
    console.log(`[emailProcessor] Applying label "${matchResult.labelName}" to email ${emailId}`);
    try {
      await gmailService.applyLabel(
        userId,
        emailId,
        matchResult.labelName,
        matchedRule?.label_bg_color,
        matchedRule?.label_text_color
      );
      console.log(`[emailProcessor] ✓ Label applied successfully`);
    } catch (labelError) {
      console.error(`[emailProcessor] ✗ Failed to apply label:`, labelError.message);
      throw labelError;
    }

    // Step 7: Log the tagging action (with thread tracking)
    await db.query(
      `INSERT INTO tagging_logs (user_id, email_id, thread_id, applied_label, matched_rule_id, confidence_score, is_auto_applied)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [userId, emailId, email.threadId, matchResult.labelName, matchResult.ruleId, matchResult.confidence]
    );

    console.log(`Successfully tagged email with "${matchResult.labelName}" (confidence: ${matchResult.confidence})`);

    return {
      success: true,
      message: 'Email tagged successfully',
      emailId,
      appliedLabel: matchResult.labelName,
      confidence: matchResult.confidence,
      reasoning: matchResult.reasoning
    };

  } catch (error) {
    console.error(`Error processing email ${emailId}:`, error);
    throw error;
  }
};

/**
 * Process email with retry logic and exponential backoff
 * @param {string} userId - User ID
 * @param {string} emailId - Gmail message ID
 * @param {string} openaiApiKey - User's OpenAI API key
 * @param {number} attempt - Current attempt number (default 1)
 * @returns {Promise<Object>} Processing result
 */
const processEmailWithRetry = async (userId, emailId, openaiApiKey, attempt = 1) => {
  try {
    return await processNewEmail(userId, emailId, openaiApiKey);

  } catch (error) {
    // Don't retry on certain errors
    const nonRetryableErrors = [
      'Invalid OpenAI API key',
      'OpenAI account has insufficient credits',
      'User not found'
    ];

    const isNonRetryable = nonRetryableErrors.some(msg =>
      error.message && error.message.includes(msg)
    );

    if (isNonRetryable || attempt >= MAX_RETRIES) {
      console.error(`Failed to process email after ${attempt} attempts:`, error.message);

      // Log the failure
      await db.query(
        `INSERT INTO tagging_logs (user_id, email_id, applied_label, confidence_score)
         VALUES ($1, $2, $3, $4)`,
        [userId, emailId, 'ERROR: ' + error.message, 0.0]
      );

      return {
        success: false,
        message: error.message,
        emailId,
        attempts: attempt
      };
    }

    // Calculate retry delay with exponential backoff
    const delay = RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
    console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms...`);

    await sleep(delay);
    return processEmailWithRetry(userId, emailId, openaiApiKey, attempt + 1);
  }
};

/**
 * Process initial batch of emails for new users (last 30 days)
 * @param {string} userId - User ID
 * @param {string} openaiApiKey - User's OpenAI API key
 * @param {number} maxEmails - Maximum number of emails to process (default 100)
 * @returns {Promise<Object>} Batch processing result
 */
const processInitialEmails = async (userId, openaiApiKey, maxEmails = 100) => {
  console.log(`Starting initial email processing for user ${userId}`);

  try {
    // Get emails from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const afterDate = thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '/');

    const query = `after:${afterDate}`;
    console.log(`Fetching emails with query: ${query}`);

    const emails = await gmailService.listRecentEmails(userId, maxEmails, query);

    if (!emails || emails.length === 0) {
      console.log('No emails found in the last 30 days');
      return {
        success: true,
        message: 'No emails to process',
        processed: 0,
        failed: 0
      };
    }

    console.log(`Found ${emails.length} emails to process`);

    const results = {
      total: emails.length,
      processed: 0,
      failed: 0,
      errors: []
    };

    // Process emails one at a time (to avoid rate limits)
    for (const email of emails) {
      try {
        await processEmailWithRetry(userId, email.id, openaiApiKey);
        results.processed++;

        // Add a small delay between emails to respect API rate limits
        await sleep(500); // 500ms delay

      } catch (error) {
        console.error(`Failed to process email ${email.id}:`, error.message);
        results.failed++;
        results.errors.push({
          emailId: email.id,
          error: error.message
        });
      }
    }

    console.log(`Initial processing complete. Processed: ${results.processed}, Failed: ${results.failed}`);

    return {
      success: true,
      message: 'Initial email processing complete',
      ...results
    };

  } catch (error) {
    console.error('Error in initial email processing:', error);
    throw error;
  }
};

/**
 * Process emails in batch (for manual triggers or scheduled jobs)
 * @param {string} userId - User ID
 * @param {Array<string>} emailIds - Array of Gmail message IDs
 * @param {string} openaiApiKey - User's OpenAI API key
 * @returns {Promise<Object>} Batch processing result
 */
const processBatch = async (userId, emailIds, openaiApiKey) => {
  console.log(`Processing batch of ${emailIds.length} emails`);

  const results = {
    total: emailIds.length,
    processed: 0,
    failed: 0,
    results: []
  };

  for (const emailId of emailIds) {
    try {
      const result = await processEmailWithRetry(userId, emailId, openaiApiKey);
      results.processed++;
      results.results.push(result);

      // Small delay to avoid rate limits
      await sleep(300);

    } catch (error) {
      results.failed++;
      results.results.push({
        success: false,
        emailId,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Get tagging statistics for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back (default 30)
 * @returns {Promise<Object>} Tagging statistics
 */
const getTaggingStats = async (userId, days = 30) => {
  try {
    const result = await db.query(
      `SELECT
        COUNT(*) as total_tagged,
        COUNT(DISTINCT applied_label) as unique_labels,
        AVG(confidence_score) as avg_confidence,
        applied_label,
        COUNT(*) as count
       FROM tagging_logs
       WHERE user_id = $1
         AND timestamp > NOW() - INTERVAL '${days} days'
         AND confidence_score > 0
       GROUP BY applied_label
       ORDER BY count DESC`,
      [userId]
    );

    return {
      totalTagged: parseInt(result.rows[0]?.total_tagged || 0),
      uniqueLabels: parseInt(result.rows[0]?.unique_labels || 0),
      avgConfidence: parseFloat(result.rows[0]?.avg_confidence || 0),
      labelBreakdown: result.rows.map(row => ({
        label: row.applied_label,
        count: parseInt(row.count)
      }))
    };

  } catch (error) {
    console.error('Error fetching tagging stats:', error);
    throw error;
  }
};

/**
 * Test rules against recent emails (dry-run - doesn't apply labels)
 * @param {string} userId - User ID
 * @param {string} openaiApiKey - User's OpenAI API key
 * @param {number} maxEmails - Maximum number of emails to test
 * @returns {Promise<Object>} Test results with AI reasoning
 */
const testRules = async (userId, openaiApiKey, maxEmails = 10) => {
  console.log(`Testing rules for user ${userId} with ${maxEmails} recent emails`);

  try {
    // Step 1: Get user's Gmail tokens
    const userResult = await db.query(
      'SELECT gmail_token_encrypted FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    // Step 2: Get active rules
    const rulesResult = await db.query(
      `SELECT id, label_name, rule_description, priority
       FROM rules
       WHERE user_id = $1 AND is_active = true
       ORDER BY priority DESC`,
      [userId]
    );

    const rules = rulesResult.rows;

    if (rules.length === 0) {
      return {
        success: true,
        message: 'No active rules to test',
        results: []
      };
    }

    console.log(`Found ${rules.length} active rules to test`);

    // Step 3: Fetch recent emails
    const emails = await gmailService.getRecentEmails(userId, maxEmails);
    console.log(`Fetched ${emails.length} recent emails`);

    // Step 4: Test each email against all rules
    const testResults = [];

    for (const email of emails) {
      console.log(`Testing email: "${email.subject}" from ${email.from}`);

      const emailResult = {
        email: {
          id: email.id,
          from: email.from,
          subject: email.subject,
          snippet: email.snippet,
          date: email.date
        },
        ruleMatches: []
      };

      // Test against each rule
      for (const rule of rules) {
        try {
          const matchResult = await aiMatcher.evaluateRule(
            openaiApiKey,
            email,
            rule.rule_description
          );

          emailResult.ruleMatches.push({
            ruleId: rule.id,
            ruleDescription: rule.rule_description,
            labelName: rule.label_name,
            matches: matchResult.matches,
            confidence: matchResult.confidence,
            reasoning: matchResult.reasoning
          });

          console.log(`  Rule "${rule.rule_description}": ${matchResult.matches ? 'MATCH' : 'NO MATCH'} (confidence: ${matchResult.confidence})`);
        } catch (error) {
          console.error(`Error evaluating rule ${rule.id}:`, error.message);
          emailResult.ruleMatches.push({
            ruleId: rule.id,
            ruleDescription: rule.rule_description,
            labelName: rule.label_name,
            error: error.message
          });
        }

        // Small delay to avoid rate limits
        await sleep(200);
      }

      // Find best match (if any)
      const bestMatch = emailResult.ruleMatches
        .filter(m => m.matches && m.confidence)
        .sort((a, b) => b.confidence - a.confidence)[0];

      emailResult.bestMatch = bestMatch || null;
      emailResult.wouldApplyLabel = bestMatch ? bestMatch.labelName : null;

      testResults.push(emailResult);
    }

    return {
      success: true,
      message: `Tested ${emails.length} emails against ${rules.length} rules`,
      totalEmails: emails.length,
      totalRules: rules.length,
      results: testResults
    };

  } catch (error) {
    console.error('Error testing rules:', error);
    throw error;
  }
};

/**
 * Get auto-applied labels for an email that are still active
 * @param {string} userId - User ID
 * @param {string} emailId - Gmail message ID
 * @returns {Promise<Array>} List of auto-applied label names
 */
const getAutoAppliedLabels = async (userId, emailId) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT applied_label
       FROM tagging_logs
       WHERE user_id = $1 AND email_id = $2 AND is_auto_applied = true AND removed_at IS NULL`,
      [userId, emailId]
    );

    return result.rows.map(row => row.applied_label);
  } catch (error) {
    console.error('Error fetching auto-applied labels:', error);
    return [];
  }
};

/**
 * Process an entire email thread and re-evaluate labels
 * @param {string} userId - User ID
 * @param {string} threadId - Gmail thread ID
 * @param {string} openaiApiKey - User's OpenAI API key
 * @returns {Promise<Object>} Processing result
 */
const processThread = async (userId, threadId, openaiApiKey) => {
  console.log(`[processThread] Starting thread re-evaluation for thread ${threadId}`);

  try {
    // Step 1: Fetch all emails in the thread
    const thread = await gmailService.getThread(userId, threadId);
    console.log(`[processThread] Found ${thread.length} emails in thread`);

    // Step 2: Get user's email address
    const userEmail = await gmailService.getUserEmail(userId);
    console.log(`[DEBUG processThread] Retrieved userEmail: "${userEmail}"`);

    // Step 3: Get all active rules for user (both sent and received)
    const rulesResult = await db.query(
      `SELECT id, label_name, rule_description, priority, label_bg_color, label_text_color, rule_type
       FROM rules
       WHERE user_id = $1 AND is_active = true
       ORDER BY priority DESC`,
      [userId]
    );

    const allRules = rulesResult.rows;

    if (allRules.length === 0) {
      console.log('[processThread] No active rules found');
      return {
        success: true,
        message: 'No active rules to apply',
        threadId,
        emailsProcessed: 0
      };
    }

    console.log(`[processThread] Found ${allRules.length} total active rules to evaluate`);

    let emailsUpdated = 0;
    let labelsRemoved = 0;
    let labelsApplied = 0;

    // Step 4: Find the most recent email in the thread (this determines the thread's label)
    const sortedThread = [...thread].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA; // Most recent first
    });

    const mostRecentEmail = sortedThread[0];
    console.log(`[processThread] Most recent email: ${mostRecentEmail.id} from ${mostRecentEmail.from}`);

    // Step 5: Classify the most recent email to determine the thread's label
    const isSentEmail = mostRecentEmail.from && mostRecentEmail.from.toLowerCase().includes(userEmail.toLowerCase());
    const emailDirection = isSentEmail ? 'sent' : 'received';
    console.log(`[processThread] Thread direction (based on most recent): ${emailDirection}`);

    // Filter rules by direction
    const rules = allRules.filter(r => r.rule_type === emailDirection);

    if (rules.length === 0) {
      console.log(`[processThread] No ${emailDirection} rules found`);
      // Remove all labels from all emails in thread since no rules apply
      for (const email of thread) {
        const currentAutoLabels = await getAutoAppliedLabels(userId, email.id);
        for (const oldLabel of currentAutoLabels) {
          console.log(`[processThread] Removing label "${oldLabel}" from email ${email.id} (no rules)`);
          try {
            await gmailService.removeLabel(userId, email.id, oldLabel);
            await db.query(
              `UPDATE tagging_logs SET removed_at = CURRENT_TIMESTAMP
               WHERE user_id = $1 AND email_id = $2 AND applied_label = $3 AND is_auto_applied = true AND removed_at IS NULL`,
              [userId, email.id, oldLabel]
            );
            labelsRemoved++;
          } catch (error) {
            console.error(`[processThread] Failed to remove label:`, error.message);
          }
        }
      }
      return {
        success: true,
        message: `No active ${emailDirection} rules to apply`,
        threadId,
        emailsProcessed: thread.length,
        emailsUpdated,
        labelsRemoved,
        labelsApplied
      };
    }

    // Classify the most recent email
    let threadLabel = null;

    if (isSentEmail) {
      console.log(`[processThread] Using sent email classification for most recent email`);
      try {
        const sentResult = await aiMatcher.evaluateSentEmail(openaiApiKey, mostRecentEmail, userEmail);
        const matchingRule = rules.find(r => r.label_name === sentResult.category);

        if (matchingRule) {
          threadLabel = {
            ruleId: matchingRule.id,
            labelName: matchingRule.label_name,
            priority: matchingRule.priority,
            confidence: sentResult.confidence,
            reasoning: sentResult.reasoning,
            bgColor: matchingRule.label_bg_color,
            textColor: matchingRule.label_text_color
          };
          console.log(`[processThread] Thread label: "${threadLabel.labelName}" (confidence: ${threadLabel.confidence})`);
        }
      } catch (error) {
        console.error(`[processThread] Error classifying thread:`, error.message);
      }
    } else {
      console.log(`[processThread] Using received email classification for most recent email`);
      try {
        const matchResult = await aiMatcher.findBestMatch(openaiApiKey, mostRecentEmail, rules, userEmail);
        if (matchResult) {
          const matchingRule = rules.find(r => r.id === matchResult.ruleId);
          threadLabel = {
            ruleId: matchResult.ruleId,
            labelName: matchResult.labelName,
            priority: matchResult.priority,
            confidence: matchResult.confidence,
            reasoning: matchResult.reasoning,
            bgColor: matchingRule?.label_bg_color,
            textColor: matchingRule?.label_text_color
          };
          console.log(`[processThread] Thread label: "${threadLabel.labelName}" (confidence: ${threadLabel.confidence})`);
        }
      } catch (error) {
        console.error(`[processThread] Error classifying thread:`, error.message);
      }
    }

    if (!threadLabel) {
      console.log(`[processThread] No label determined for thread`);
      // Remove all labels from all emails in thread
      for (const email of thread) {
        const currentAutoLabels = await getAutoAppliedLabels(userId, email.id);
        for (const oldLabel of currentAutoLabels) {
          console.log(`[processThread] Removing label "${oldLabel}" from email ${email.id} (no match)`);
          try {
            await gmailService.removeLabel(userId, email.id, oldLabel);
            await db.query(
              `UPDATE tagging_logs SET removed_at = CURRENT_TIMESTAMP
               WHERE user_id = $1 AND email_id = $2 AND applied_label = $3 AND is_auto_applied = true AND removed_at IS NULL`,
              [userId, email.id, oldLabel]
            );
            labelsRemoved++;
          } catch (error) {
            console.error(`[processThread] Failed to remove label:`, error.message);
          }
        }
      }
      return {
        success: true,
        message: 'No matching label for thread',
        threadId,
        emailsProcessed: thread.length,
        emailsUpdated,
        labelsRemoved,
        labelsApplied
      };
    }

    // Step 6: Apply thread label to ALL emails, removing old labels
    console.log(`[processThread] Applying thread label "${threadLabel.labelName}" to all emails in thread`);

    for (const email of thread) {
      console.log(`[processThread] Processing email ${email.id}`);

      // Get currently applied auto-labels for this email
      const currentAutoLabels = await getAutoAppliedLabels(userId, email.id);
      console.log(`[processThread] Current auto-labels: ${currentAutoLabels.join(', ') || 'none'}`);

      // Check if this email already has the correct label
      if (currentAutoLabels.length === 1 && currentAutoLabels[0] === threadLabel.labelName) {
        console.log(`[processThread] Email ${email.id} already has correct label "${threadLabel.labelName}", skipping`);
        continue;
      }

      // Remove old auto-applied labels (if different from thread label)
      for (const oldLabel of currentAutoLabels) {
        if (oldLabel !== threadLabel.labelName) {
          console.log(`[processThread] Removing old label "${oldLabel}" from email ${email.id}`);
          try {
            await gmailService.removeLabel(userId, email.id, oldLabel);

            // Mark as removed in database
            await db.query(
              `UPDATE tagging_logs
               SET removed_at = CURRENT_TIMESTAMP
               WHERE user_id = $1 AND email_id = $2 AND applied_label = $3 AND is_auto_applied = true AND removed_at IS NULL`,
              [userId, email.id, oldLabel]
            );

            labelsRemoved++;
          } catch (error) {
            console.error(`[processThread] Failed to remove label "${oldLabel}":`, error.message);
          }
        }
      }

      // Apply thread label if not already present
      if (!currentAutoLabels.includes(threadLabel.labelName)) {
        console.log(`[processThread] Applying thread label "${threadLabel.labelName}" to email ${email.id}`);
        try {
          await gmailService.applyLabel(
            userId,
            email.id,
            threadLabel.labelName,
            threadLabel.bgColor,
            threadLabel.textColor
          );

          // Log the new label application
          await db.query(
            `INSERT INTO tagging_logs (user_id, email_id, thread_id, applied_label, matched_rule_id, confidence_score, is_auto_applied)
             VALUES ($1, $2, $3, $4, $5, $6, true)`,
            [userId, email.id, threadId, threadLabel.labelName, threadLabel.ruleId, threadLabel.confidence]
          );

          labelsApplied++;
          emailsUpdated++;
        } catch (error) {
          console.error(`[processThread] Failed to apply label "${threadLabel.labelName}":`, error.message);
        }
      }

      // Small delay to respect API rate limits
      await sleep(300);
    }

    console.log(`[processThread] Thread re-evaluation complete: ${emailsUpdated} emails updated, ${labelsRemoved} labels removed, ${labelsApplied} labels applied`);

    return {
      success: true,
      message: 'Thread processed successfully',
      threadId,
      emailsProcessed: thread.length,
      emailsUpdated,
      labelsRemoved,
      labelsApplied
    };

  } catch (error) {
    console.error(`[processThread] Error processing thread ${threadId}:`, error);
    throw error;
  }
};

module.exports = {
  processNewEmail,
  processEmailWithRetry,
  processInitialEmails,
  processThread,
  testRules,
  processBatch,
  getTaggingStats,
  getAutoAppliedLabels
};
