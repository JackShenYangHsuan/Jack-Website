/**
 * AI Matcher Service
 * Uses OpenAI to interpret natural language rules and match them against emails
 */

const OpenAI = require('openai');

// In-memory cache for rule evaluations
const evaluationCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 1000;

/**
 * Clean old cache entries
 */
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of evaluationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      evaluationCache.delete(key);
    }
  }

  // If cache is still too large, remove oldest entries
  if (evaluationCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(evaluationCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => evaluationCache.delete(key));
  }
};

/**
 * Generate cache key for an email + rule combination
 * @param {Object} email - Email object
 * @param {string} ruleDescription - Rule description
 * @returns {string} Cache key
 */
const getCacheKey = (email, ruleDescription) => {
  // Create a simple hash based on email subject, from, and rule
  const emailSignature = `${email.from}|${email.subject}|${email.snippet}`;
  return `${emailSignature}|${ruleDescription}`;
};

/**
 * Extract email address from a string like "Display Name <email@example.com>" or just "email@example.com"
 * @param {string} emailString - Email string with optional display name
 * @returns {string} Extracted email address
 */
const extractEmailAddress = (emailString) => {
  if (!emailString) return '';

  // Match email in angle brackets: "Name <email@example.com>"
  const angleMatch = emailString.match(/<([^>]+)>/);
  if (angleMatch) {
    return angleMatch[1].toLowerCase().trim();
  }

  // Match standalone email: "email@example.com"
  const emailMatch = emailString.match(/([^\s<>]+@[^\s<>]+)/);
  if (emailMatch) {
    return emailMatch[1].toLowerCase().trim();
  }

  return emailString.toLowerCase().trim();
};

/**
 * Check if email is self-sent (same From and To addresses)
 * @param {string} from - From header
 * @param {string} to - To header
 * @returns {boolean} True if self-sent
 */
const isSelfSent = (from, to) => {
  const fromEmail = extractEmailAddress(from);
  const toEmail = extractEmailAddress(to);

  console.log(`[isSelfSent] Comparing: "${fromEmail}" vs "${toEmail}" => ${fromEmail === toEmail}`);

  return fromEmail === toEmail;
};

/**
 * Design the prompt template for rule evaluation
 * @param {Object} email - Email object with metadata and content
 * @param {string} ruleDescription - Natural language rule description
 * @param {string} userEmail - The authenticated user's email address
 * @returns {string} Formatted prompt
 */
const buildPrompt = (email, ruleDescription, userEmail) => {
  console.log(`[DEBUG buildPrompt] Received userEmail parameter: "${userEmail}"`);

  // Extract email addresses for analysis
  const fromEmail = extractEmailAddress(email.from);
  const toEmail = extractEmailAddress(email.to);
  const selfSent = isSelfSent(email.from, email.to);

  // Build thread history if available
  let threadContext = '';
  let lastMessageSender = '';
  let lastMessageIsFromUser = false;

  if (email.thread && email.thread.length > 0) {
    // Get the last message in the thread
    const lastMessage = email.thread[email.thread.length - 1];
    const lastFrom = extractEmailAddress(lastMessage.from);

    // Check if last message is from the user
    // Assuming any message TO someone else is FROM the user
    lastMessageSender = lastFrom;
    lastMessageIsFromUser = lastMessage.to && extractEmailAddress(lastMessage.to) !== lastFrom;

    threadContext = '\n\nEMAIL THREAD HISTORY (chronological order, oldest first):';
    email.thread.forEach((msg, index) => {
      threadContext += `\n${index + 1}. From: ${msg.from || 'Unknown'} | Subject: ${msg.subject || 'No subject'} | Date: ${msg.date || 'Unknown'}`;
      threadContext += `\n   Preview: ${msg.snippet || 'No preview'}`;
    });
    threadContext += `\n\nNOTE: The thread has ${email.thread.length} message(s). Message #1 is the FIRST email sent in this conversation.`;
    threadContext += `\nIMPORTANT: Message #${email.thread.length} (the LAST message in the thread) is from: ${lastMessageSender}`;
    threadContext += `\nLast message sender email: ${lastMessageSender}`;
  }

  return `You are an email classification assistant. Your job is to determine if an email matches a given tagging rule.

CURRENT EMAIL INFORMATION:
- From: ${email.from || 'Unknown'}
- To: ${email.to || 'Unknown'}
- CC: ${email.cc || 'None'}
- Subject: ${email.subject || 'No subject'}
- Date: ${email.date || 'Unknown'}
- Preview: ${email.snippet || 'No preview'}
- Body (first 500 chars): ${(email.body || '').substring(0, 500)}

EXTRACTED EMAIL ADDRESSES (for verification):
- From email address: ${fromEmail}
- To email address: ${toEmail}
- Is self-sent: ${selfSent ? 'YES - same sender and recipient' : 'NO - different sender and recipient'}${threadContext}

TAGGING RULE:
"${ruleDescription}"

TASK:
Determine if this email matches the tagging rule. Consider:
- The extracted email addresses above (${fromEmail} and ${toEmail})
- Subject line, email content, and metadata
- Self-sent status: ${selfSent ? 'This IS a self-sent email' : 'This is NOT a self-sent email'}
- The FULL email thread history (if provided above)
- ${lastMessageSender ? `The LAST message in the thread is from: ${lastMessageSender}` : ''}
- For rules about "who sent the first email" or "email chains I started", check message #1 in the thread history
- The overall context and conversation flow

CRITICAL RULES FOR "AWAITING REPLY" OR "TO RESPOND":
- "Awaiting reply" = I (${userEmail}) sent the LAST message in the thread, waiting for someone else to reply
- "To respond" = Someone ELSE sent the LAST message in the thread, and I need to respond
- Check the "Last message sender email" field above to determine who sent the last message
- If last message is from ${userEmail} → label as "Awaiting reply"
- If last message is from anyone else → label as "To respond" (if it needs a response)
- Self-sent emails (where From and To addresses are the SAME) should NEVER match either rule
- IMPORTANT: If the email body contains quoted text like "On ... <${userEmail}> wrote:" or similar reply indicators, this means it's a REPLY to my message, so someone else sent the LAST message → label as "To respond"
- IMPORTANT: If From field is NOT ${userEmail}, this is someone else's message → should be "To respond" (if it needs a response)

Respond in the following JSON format ONLY (no markdown formatting):
{
  "matches": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why it matches or doesn't match"
}

Examples:
- If rule is "Promotional emails from online stores" and email is from "deals@amazon.com" with subject "50% Off Sale!", respond: {"matches": true, "confidence": 0.95, "reasoning": "Email is from a major retailer with promotional language"}
- If rule is "Urgent messages from my manager" and email is from a random sender with casual content, respond: {"matches": false, "confidence": 0.9, "reasoning": "Email is not from a manager and has no urgent indicators"}
- If rule is "email chains where I was the first sender" and thread history shows message #1 from user's email address, respond: {"matches": true, "confidence": 0.95, "reasoning": "Thread history shows the user initiated this conversation"}
- If rule is "Emails where I'm awaiting a reply" and From: "jack@example.com", To: "jack@example.com", respond: {"matches": false, "confidence": 0.95, "reasoning": "This is a self-sent email (same sender and recipient address), so there's no one to reply"}
- If rule is "Emails where I'm awaiting a reply" and From: "jack@example.com", To: "sarah@example.com", respond: {"matches": true, "confidence": 0.9, "reasoning": "Email sent from jack to sarah, awaiting sarah's reply"}

Your response:`;
};

/**
 * Call OpenAI API to evaluate if an email matches a rule
 * @param {string} apiKey - User's OpenAI API key
 * @param {Object} email - Email object
 * @param {string} ruleDescription - Natural language rule description
 * @param {string} userEmail - The authenticated user's email address
 * @returns {Promise<Object>} Match result with confidence score
 */
const evaluateRule = async (apiKey, email, ruleDescription, userEmail) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey(email, ruleDescription);
    const cached = evaluationCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log('Cache hit for rule evaluation');
      return cached.result;
    }

    // Validate API key
    if (!apiKey || !apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    // Initialize OpenAI client with user's API key
    const openai = new OpenAI({
      apiKey: apiKey
    });

    // Build the prompt
    const prompt = buildPrompt(email, ruleDescription, userEmail);

    console.log('Calling OpenAI API for rule evaluation...');
    console.log(`[DEBUG] Email metadata: From="${email.from}", To="${email.to}", Subject="${email.subject}"`);
    console.log(`[DEBUG] Full prompt being sent to OpenAI:`);
    console.log(`---PROMPT START (first 800 chars)---`);
    console.log(prompt.substring(0, 800));
    console.log(`---CRITICAL RULES SECTION---`);
    const criticalRulesStart = prompt.indexOf('CRITICAL RULES FOR');
    if (criticalRulesStart !== -1) {
      console.log(prompt.substring(criticalRulesStart, criticalRulesStart + 800));
    }
    console.log(`---PROMPT END---`);
    const startTime = Date.now();

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
      messages: [
        {
          role: 'system',
          content: 'You are a helpful email classification assistant that evaluates whether emails match tagging rules. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 200,
      response_format: { type: "json_object" } // Ensure JSON response
    });

    const duration = Date.now() - startTime;
    console.log(`OpenAI API call completed in ${duration}ms`);

    // Parse the response
    const result = parseResponse(response);

    // Cache the result
    evaluationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Clean cache periodically
    if (Math.random() < 0.1) { // 10% chance to clean on each call
      cleanCache();
    }

    return result;

  } catch (error) {
    console.error('AI evaluation error:', error);

    // Handle specific OpenAI errors
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key');
    } else if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    } else if (error.status === 402) {
      throw new Error('OpenAI account has insufficient credits');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to OpenAI API. Check your internet connection.');
    }

    throw new Error(`AI evaluation failed: ${error.message}`);
  }
};

/**
 * Parse OpenAI response and extract match decision and confidence
 * @param {Object} response - OpenAI API response
 * @returns {Object} Parsed result with matches, confidence, and reasoning
 */
const parseResponse = (response) => {
  try {
    const content = response.choices[0].message.content;

    // Parse JSON response
    const parsed = JSON.parse(content);

    // Validate response structure
    if (typeof parsed.matches !== 'boolean') {
      throw new Error('Invalid response: missing or invalid "matches" field');
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('Invalid response: "confidence" must be a number between 0 and 1');
    }

    return {
      matches: parsed.matches,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning || 'No reasoning provided'
    };

  } catch (error) {
    console.error('Response parsing error:', error);
    console.error('Raw response:', response.choices[0].message.content);

    // Fallback: return conservative result
    return {
      matches: false,
      confidence: 0.0,
      reasoning: `Failed to parse AI response: ${error.message}`
    };
  }
};

/**
 * Build simplified prompt for sent email classification
 * @param {Object} email - Email object with metadata and content
 * @param {string} userEmail - The authenticated user's email address
 * @returns {string} Formatted prompt
 */
const buildSentEmailPrompt = (email, userEmail) => {
  return `You are an email classification assistant. This is an email that ${userEmail} (the user) SENT.

EMAIL INFORMATION:
- From: ${email.from || 'Unknown'}
- To: ${email.to || 'Unknown'}
- CC: ${email.cc || 'None'}
- Subject: ${email.subject || 'No subject'}
- Date: ${email.date || 'Unknown'}
- Preview: ${email.snippet || 'No preview'}
- Body (first 500 chars): ${(email.body || '').substring(0, 500)}

TASK:
Classify this sent email into ONE of these categories:

1. "Awaiting reply" - The user is expecting a response. This includes:
   - Asking questions
   - Requesting information or action
   - Starting a conversation that needs follow-up
   - Any email where you'd naturally wait for someone to reply

2. "Actioned" - The user is NOT expecting a response. This includes:
   - Sharing final information (FYI)
   - Confirming receipt ("Got it, thanks!")
   - Completing a task ("Done!")
   - Providing updates with no action needed
   - Polite closings that don't require response

IMPORTANT: Focus on the user's INTENT when sending this email. Did they expect a reply?

Respond in the following JSON format ONLY (no markdown formatting):
{
  "category": "Awaiting reply" or "Actioned",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why it matches this category"
}

Examples:
- "Can we meet at 2pm tomorrow?" → {"category": "Awaiting reply", "confidence": 0.95, "reasoning": "Asking a question that requires confirmation"}
- "Thanks for your help!" → {"category": "Actioned", "confidence": 0.9, "reasoning": "Simple acknowledgment with no action needed"}
- "Here's the report you requested" → {"category": "Actioned", "confidence": 0.85, "reasoning": "Providing requested information, no further action expected"}
- "What do you think about this approach?" → {"category": "Awaiting reply", "confidence": 0.95, "reasoning": "Requesting feedback or opinion"}

Your response:`;
};

/**
 * Evaluate a sent email to classify as "Awaiting reply" or "Actioned"
 * @param {string} apiKey - User's OpenAI API key
 * @param {Object} email - Email object
 * @param {string} userEmail - The authenticated user's email address
 * @returns {Promise<Object>} Classification result with category, confidence, and reasoning
 */
const evaluateSentEmail = async (apiKey, email, userEmail) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey(email, 'sent_email_classification');
    const cached = evaluationCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log('[evaluateSentEmail] Cache hit for sent email classification');
      return cached.result;
    }

    // Validate API key
    if (!apiKey || !apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    // Initialize OpenAI client with user's API key
    const openai = new OpenAI({
      apiKey: apiKey
    });

    // Build the simplified sent email prompt
    const prompt = buildSentEmailPrompt(email, userEmail);

    console.log('[evaluateSentEmail] Calling OpenAI API for sent email classification...');
    console.log(`[evaluateSentEmail] Email: From="${email.from}", To="${email.to}", Subject="${email.subject}"`);
    const startTime = Date.now();

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful email classification assistant that categorizes sent emails. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 150,
      response_format: { type: "json_object" } // Ensure JSON response
    });

    const duration = Date.now() - startTime;
    console.log(`[evaluateSentEmail] OpenAI API call completed in ${duration}ms`);

    // Parse the response
    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Validate response structure
    if (!parsed.category || !['Awaiting reply', 'Actioned'].includes(parsed.category)) {
      throw new Error('Invalid category in response');
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('Invalid confidence score');
    }

    const result = {
      category: parsed.category,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning || 'No reasoning provided'
    };

    console.log(`[evaluateSentEmail] Result: ${result.category} (confidence: ${result.confidence})`);

    // Cache the result
    evaluationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Clean cache periodically
    if (Math.random() < 0.1) {
      cleanCache();
    }

    return result;

  } catch (error) {
    console.error('[evaluateSentEmail] Error:', error);

    // Handle specific OpenAI errors
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key');
    } else if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    } else if (error.status === 402) {
      throw new Error('OpenAI account has insufficient credits');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to OpenAI API. Check your internet connection.');
    }

    throw new Error(`Sent email evaluation failed: ${error.message}`);
  }
};

/**
 * Evaluate multiple rules and return the highest priority match
 * @param {string} apiKey - User's OpenAI API key
 * @param {Object} email - Email object
 * @param {Array<Object>} rules - Array of rule objects (with id, description, priority)
 * @param {string} userEmail - The authenticated user's email address
 * @returns {Promise<Object|null>} Matching rule with confidence, or null if no match
 */
const findBestMatch = async (apiKey, email, rules, userEmail) => {
  try {
    // Sort rules by priority (highest first)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    const evaluations = [];

    // Evaluate each rule
    for (const rule of sortedRules) {
      try {
        const result = await evaluateRule(apiKey, email, rule.rule_description, userEmail);

        evaluations.push({
          ruleId: rule.id,
          labelName: rule.label_name,
          priority: rule.priority,
          matches: result.matches,
          confidence: result.confidence,
          reasoning: result.reasoning
        });

        // If we find a high-confidence match from a high-priority rule, we can stop early
        if (result.matches && result.confidence >= 0.8) {
          console.log(`High-confidence match found for rule "${rule.label_name}" (priority ${rule.priority})`);
          break;
        }

      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error.message);
        // Continue with other rules even if one fails
      }
    }

    // Log all evaluations
    console.log('Rule evaluations:', JSON.stringify(evaluations, null, 2));

    // Find the best match:
    // 1. Filter only matches
    // 2. Sort by priority (highest first), then confidence (highest first)
    const matches = evaluations.filter(e => e.matches);

    if (matches.length === 0) {
      console.log('No matching rules found for this email');
      return null;
    }

    matches.sort((a, b) => {
      // First compare by priority
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // If priorities are equal, compare by confidence
      return b.confidence - a.confidence;
    });

    const bestMatch = matches[0];
    console.log(`Best match: "${bestMatch.labelName}" (priority ${bestMatch.priority}, confidence ${bestMatch.confidence})`);

    return bestMatch;

  } catch (error) {
    console.error('Error finding best match:', error);
    throw error;
  }
};

/**
 * Clear the evaluation cache (useful for testing or memory management)
 */
const clearCache = () => {
  evaluationCache.clear();
  console.log('Evaluation cache cleared');
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
const getCacheStats = () => {
  return {
    size: evaluationCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL
  };
};

module.exports = {
  evaluateRule,
  evaluateSentEmail,
  findBestMatch,
  clearCache,
  getCacheStats
};
