/**
 * Gmail Service
 * Functions for interacting with Gmail API
 */

const { getGmailClient } = require('../config/gmail');
const { decrypt } = require('../utils/encryption');
const db = require('../config/database');

/**
 * Get Gmail client for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Gmail API client
 */
const getClientForUser = async (userId) => {
  // Get user's encrypted tokens from database
  const result = await db.query(
    'SELECT gmail_token_encrypted FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  // Decrypt tokens
  const encryptedToken = result.rows[0].gmail_token_encrypted;
  const tokens = JSON.parse(decrypt(encryptedToken));

  // Create Gmail client
  return getGmailClient(tokens);
};

/**
 * List all Gmail labels for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of label objects
 */
const listLabels = async (userId) => {
  try {
    const gmail = await getClientForUser(userId);

    const response = await gmail.users.labels.list({
      userId: 'me'
    });

    return response.data.labels || [];
  } catch (error) {
    console.error('List labels error:', error);
    throw new Error(`Failed to list Gmail labels: ${error.message}`);
  }
};

/**
 * Create a new Gmail label with color
 * @param {string} userId - User ID
 * @param {string} labelName - Name of the label to create
 * @param {string} backgroundColor - Background color (optional)
 * @param {string} textColor - Text color (optional)
 * @returns {Promise<Object>} Created label object
 */
const createLabel = async (userId, labelName, backgroundColor = null, textColor = null) => {
  try {
    const gmail = await getClientForUser(userId);

    const requestBody = {
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show'
    };

    // Add color if provided
    if (backgroundColor && textColor) {
      requestBody.color = {
        backgroundColor: backgroundColor,
        textColor: textColor
      };
    }

    const response = await gmail.users.labels.create({
      userId: 'me',
      requestBody: requestBody
    });

    return response.data;
  } catch (error) {
    console.error('Create label error:', error);

    if (error.code === 409 || (error.message && error.message.includes('already exists'))) {
      throw new Error('Label already exists');
    }

    throw new Error(`Failed to create Gmail label: ${error.message}`);
  }
};

/**
 * Get email thread by thread ID
 * @param {string} userId - User ID
 * @param {string} threadId - Gmail thread ID
 * @returns {Promise<Array>} Array of email messages in the thread
 */
const getThread = async (userId, threadId) => {
  try {
    const gmail = await getClientForUser(userId);

    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full'
    });

    const thread = response.data;
    const messages = [];

    // First pass: Extract basic message data
    for (const message of thread.messages) {
      const headers = message.payload.headers;
      const getHeader = (name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        if (!header) return '';

        // Clean up header value - remove extra quotes around display names
        let value = header.value;
        value = value.replace(/^"([^"]+)"\s+</g, '$1 <');
        return value;
      };

      // Helper to get recipient - try multiple headers
      const getRecipient = () => {
        let recipient = getHeader('To');
        if (recipient) return recipient;
        recipient = getHeader('Delivered-To');
        if (recipient) return recipient;
        return getHeader('X-Original-To');
      };

      messages.push({
        id: message.id,
        threadId: message.threadId,
        from: getHeader('From'),
        to: getRecipient(), // Use smart recipient detection
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        snippet: message.snippet,
        body: extractBody(message.payload)
      });
    }

    // Second pass: Add thread context to each message
    // Each message needs the full thread for AI context
    for (const message of messages) {
      message.thread = messages; // Include full thread context
    }

    return messages;
  } catch (error) {
    console.error('Get thread error:', error);
    throw new Error(`Failed to get thread: ${error.message}`);
  }
};

/**
 * Get email details by ID
 * @param {string} userId - User ID
 * @param {string} emailId - Gmail message ID
 * @returns {Promise<Object>} Email object with metadata and content
 */
const getEmail = async (userId, emailId) => {
  try {
    const gmail = await getClientForUser(userId);

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: emailId,
      format: 'full'
    });

    const message = response.data;

    // Extract useful information
    const headers = message.payload.headers;
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      if (!header) return '';

      // Clean up header value - remove extra quotes around display names
      let value = header.value;
      // Replace patterns like: "Display Name" <email@example.com> with: Display Name <email@example.com>
      value = value.replace(/^"([^"]+)"\s+</g, '$1 <');
      return value;
    };

    // Helper to get recipient - try multiple headers
    const getRecipient = () => {
      // Try 'To' first
      let recipient = getHeader('To');
      if (recipient) return recipient;

      // Fallback to 'Delivered-To' for emails sent to you
      recipient = getHeader('Delivered-To');
      if (recipient) return recipient;

      // Last fallback to 'X-Original-To'
      return getHeader('X-Original-To');
    };

    // Get the full thread for context
    let thread = [];
    try {
      thread = await getThread(userId, message.threadId);
    } catch (error) {
      console.error('Failed to fetch thread, continuing with single message:', error.message);
    }

    const emailData = {
      id: message.id,
      threadId: message.threadId,
      historyId: message.historyId, // Gmail history ID for change tracking
      labelIds: message.labelIds || [],
      snippet: message.snippet,
      from: getHeader('From'),
      to: getRecipient(), // Use smart recipient detection
      cc: getHeader('Cc'),
      bcc: getHeader('Bcc'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      body: extractBody(message.payload),
      thread: thread // Include full thread
    };

    console.log(`[getEmail] DEBUG - Email metadata for ${emailData.id}:`);
    console.log(`  From: "${emailData.from}"`);
    console.log(`  To: "${emailData.to}"`);
    console.log(`  CC: "${emailData.cc}"`);
    console.log(`  Subject: "${emailData.subject}"`);
    console.log(`  Thread has ${thread.length} messages`);

    // Log ALL headers for debugging
    console.log(`  All headers:`);
    const relevantHeaders = ['From', 'To', 'Delivered-To', 'X-Original-To', 'Reply-To', 'Return-Path'];
    relevantHeaders.forEach(headerName => {
      const value = getHeader(headerName);
      if (value) {
        console.log(`    ${headerName}: "${value}"`);
      }
    });

    // Debug thread messages
    if (thread.length > 0) {
      console.log(`  Thread messages:`);
      thread.forEach((msg, idx) => {
        console.log(`    [${idx + 1}] From: "${msg.from}" | To: "${msg.to}"`);
      });
    }

    return emailData;
  } catch (error) {
    console.error('Get email error:', error);
    throw new Error(`Failed to get email: ${error.message}`);
  }
};

/**
 * Extract email body from message payload
 * @param {Object} payload - Gmail message payload
 * @returns {string} Email body text
 */
const extractBody = (payload) => {
  let body = '';

  if (payload.body && payload.body.data) {
    body = Buffer.from(payload.body.data, 'base64').toString();
  } else if (payload.parts) {
    // Handle multipart messages
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        body += Buffer.from(part.body.data, 'base64').toString();
      } else if (part.mimeType === 'text/html' && !body && part.body && part.body.data) {
        // Fallback to HTML if no plain text
        body = Buffer.from(part.body.data, 'base64').toString();
      } else if (part.parts) {
        // Recursive for nested parts
        body += extractBody(part);
      }
    }
  }

  return body;
};

/**
 * Modify email labels
 * @param {string} userId - User ID
 * @param {string} emailId - Gmail message ID
 * @param {Array<string>} addLabels - Label IDs to add
 * @param {Array<string>} removeLabels - Label IDs to remove
 * @returns {Promise<Object>} Modified message object
 */
const modifyEmail = async (userId, emailId, addLabels = [], removeLabels = []) => {
  try {
    console.log(`[modifyEmail] Starting - userId: ${userId}, emailId: ${emailId}`);
    console.log(`[modifyEmail] Labels to add: ${JSON.stringify(addLabels)}`);
    console.log(`[modifyEmail] Labels to remove: ${JSON.stringify(removeLabels)}`);

    const gmail = await getClientForUser(userId);
    console.log(`[modifyEmail] Gmail client obtained successfully`);

    console.log(`[modifyEmail] Calling Gmail API to modify message...`);
    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: addLabels,
        removeLabelIds: removeLabels
      }
    });

    console.log(`[modifyEmail] ✓ Gmail API call successful`);
    console.log(`[modifyEmail] Response:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`[modifyEmail] ✗ Gmail API error:`, error.message);
    console.error(`[modifyEmail] Error status:`, error.status || error.code);
    console.error(`[modifyEmail] Error details:`, {
      userId,
      emailId,
      addLabels,
      removeLabels,
      errorType: error.constructor.name,
      errorCode: error.code,
      errorStatus: error.status,
      errorMessage: error.message,
      responseData: error.response?.data
    });

    // Check for specific permission errors
    if (error.status === 403 || error.code === 403) {
      console.error(`[modifyEmail] ⚠️  PERMISSION ERROR: Insufficient permissions to modify email`);
      console.error(`[modifyEmail] This likely means the OAuth token doesn't have gmail.modify scope`);
      console.error(`[modifyEmail] User needs to disconnect and reconnect Gmail to get updated permissions`);
    }

    throw new Error(`Failed to modify email: ${error.message}`);
  }
};

/**
 * Remove a label from an email
 * @param {string} userId - User ID
 * @param {string} emailId - Gmail message ID
 * @param {string} labelName - Name of the label to remove
 * @returns {Promise<Object>} Modified message object
 */
const removeLabel = async (userId, emailId, labelName) => {
  try {
    console.log(`[removeLabel] Starting - userId: ${userId}, emailId: ${emailId}, labelName: ${labelName}`);

    // Get all labels to find the label ID
    console.log(`[removeLabel] Fetching all Gmail labels...`);
    const labels = await listLabels(userId);
    console.log(`[removeLabel] Found ${labels.length} labels`);

    const label = labels.find(l => l.name === labelName);

    if (!label) {
      console.log(`[removeLabel] Label "${labelName}" not found, nothing to remove`);
      return null;
    }

    console.log(`[removeLabel] Found label "${labelName}" with ID: ${label.id}`);
    console.log(`[removeLabel] Removing label from email...`);
    const result = await modifyEmail(userId, emailId, [], [label.id]);
    console.log(`[removeLabel] ✓ Successfully removed label "${labelName}" from email ${emailId}`);
    return result;
  } catch (error) {
    console.error(`[removeLabel] ✗ ERROR removing label "${labelName}" from email ${emailId}:`, error.message);
    console.error(`[removeLabel] Error details:`, {
      userId,
      emailId,
      labelName,
      errorType: error.constructor.name,
      errorStatus: error.status || error.code,
      errorMessage: error.message
    });
    throw new Error(`Failed to remove label: ${error.message}`);
  }
};

/**
 * Apply a label to an email with color from rules
 * @param {string} userId - User ID
 * @param {string} emailId - Gmail message ID
 * @param {string} labelName - Name of the label to apply
 * @param {string} bgColor - Background color (optional, from rule)
 * @param {string} textColor - Text color (optional, from rule)
 * @returns {Promise<Object>} Modified message object
 */
const applyLabel = async (userId, emailId, labelName, bgColor = null, textColor = null) => {
  try {
    console.log(`[applyLabel] Starting - userId: ${userId}, emailId: ${emailId}, labelName: ${labelName}`);

    // Get all labels to find the label ID
    console.log(`[applyLabel] Fetching all Gmail labels...`);
    const labels = await listLabels(userId);
    console.log(`[applyLabel] Found ${labels.length} labels`);

    const label = labels.find(l => l.name === labelName);

    if (!label) {
      // Label doesn't exist, create it with color if provided
      console.log(`[applyLabel] Label "${labelName}" not found, creating new label...`);
      if (bgColor && textColor) {
        console.log(`[applyLabel] Creating label with colors - bg: ${bgColor}, text: ${textColor}`);
      }
      const newLabel = await createLabel(userId, labelName, bgColor, textColor);
      console.log(`[applyLabel] Created new label with ID: ${newLabel.id}`);
      console.log(`[applyLabel] Applying new label to email...`);
      const result = await modifyEmail(userId, emailId, [newLabel.id]);
      console.log(`[applyLabel] ✓ Successfully applied new label "${labelName}" to email ${emailId}`);
      return result;
    }

    console.log(`[applyLabel] Found existing label "${labelName}" with ID: ${label.id}`);
    console.log(`[applyLabel] Applying label to email...`);
    const result = await modifyEmail(userId, emailId, [label.id]);
    console.log(`[applyLabel] ✓ Successfully applied label "${labelName}" to email ${emailId}`);
    return result;
  } catch (error) {
    console.error(`[applyLabel] ✗ ERROR applying label "${labelName}" to email ${emailId}:`, error.message);
    console.error(`[applyLabel] Error details:`, {
      userId,
      emailId,
      labelName,
      errorType: error.constructor.name,
      errorStatus: error.status || error.code,
      errorMessage: error.message
    });
    throw new Error(`Failed to apply label: ${error.message}`);
  }
};

/**
 * List recent emails (for initial processing)
 * @param {string} userId - User ID
 * @param {number} maxResults - Maximum number of emails to fetch
 * @param {string} query - Gmail search query
 * @returns {Promise<Array>} Array of email IDs
 */
const listRecentEmails = async (userId, maxResults = 100, query = '') => {
  try {
    const gmail = await getClientForUser(userId);

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query
    });

    return response.data.messages || [];
  } catch (error) {
    console.error('List emails error:', error);
    throw new Error(`Failed to list emails: ${error.message}`);
  }
};

/**
 * Get recent emails with full details
 * @param {string} userId - User ID
 * @param {number} maxResults - Maximum number of emails to fetch
 * @returns {Promise<Array>} Array of email objects with full details
 */
const getRecentEmails = async (userId, maxResults = 10) => {
  try {
    // First, get list of email IDs
    const emailList = await listRecentEmails(userId, maxResults);

    // Then fetch full details for each email
    const emails = [];
    for (const emailSummary of emailList) {
      try {
        const email = await getEmail(userId, emailSummary.id);
        emails.push(email);
      } catch (error) {
        console.error(`Failed to fetch email ${emailSummary.id}:`, error.message);
        // Continue with other emails even if one fails
      }
    }

    return emails;
  } catch (error) {
    console.error('Get recent emails error:', error);
    throw new Error(`Failed to get recent emails: ${error.message}`);
  }
};

/**
 * Setup Gmail push notifications (watch mailbox)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Watch response
 */
const watchMailbox = async (userId) => {
  try {
    const gmail = await getClientForUser(userId);

    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: `projects/${process.env.GOOGLE_PROJECT_ID}/topics/${process.env.GOOGLE_PUBSUB_TOPIC}`,
        labelIds: ['INBOX'] // Only watch inbox
      }
    });

    console.log('Gmail watch setup:', response.data);
    return response.data;
  } catch (error) {
    console.error('Watch mailbox error:', error);
    throw new Error(`Failed to setup Gmail push notifications: ${error.message}`);
  }
};

/**
 * Stop Gmail push notifications
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const stopWatch = async (userId) => {
  try {
    const gmail = await getClientForUser(userId);

    await gmail.users.stop({
      userId: 'me'
    });

    console.log('Gmail watch stopped');
  } catch (error) {
    console.error('Stop watch error:', error);
    throw new Error(`Failed to stop Gmail push notifications: ${error.message}`);
  }
};

/**
 * Get user's Gmail email address
 * @param {string} userId - User ID
 * @returns {Promise<string>} User's email address
 */
const getUserEmail = async (userId) => {
  try {
    const gmail = await getClientForUser(userId);

    const response = await gmail.users.getProfile({
      userId: 'me'
    });

    return response.data.emailAddress;
  } catch (error) {
    console.error('Get user email error:', error);
    throw new Error(`Failed to get user email: ${error.message}`);
  }
};

module.exports = {
  listLabels,
  createLabel,
  getEmail,
  getThread,
  modifyEmail,
  applyLabel,
  removeLabel,
  listRecentEmails,
  getRecentEmails,
  watchMailbox,
  stopWatch,
  getUserEmail
};
