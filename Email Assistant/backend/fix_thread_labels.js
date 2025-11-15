/**
 * Script to fix thread labels - remove old labels and keep only the most recent one
 * This will process a specific thread and ensure only the latest email's label is applied
 */

const db = require('./config/database');
const gmailService = require('./services/gmailService');

const threadId = '19a7c1615e49576d'; // Thread ID from the screenshot
const userId = '3c5b21bf-631c-4997-86f9-f1a98e0cb3d1'; // Your user ID

(async () => {
  try {
    console.log(`Processing thread ${threadId}...`);

    // Get all emails in the thread
    const thread = await gmailService.getThread(userId, threadId);
    console.log(`Found ${thread.length} emails in thread`);

    // Sort by date to find the most recent email
    const sortedEmails = thread.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA; // Most recent first
    });

    console.log('\nEmails in thread (most recent first):');
    sortedEmails.forEach((email, index) => {
      console.log(`  ${index + 1}. ${email.from} → ${email.to} (${email.date})`);
      console.log(`     Subject: ${email.subject}`);
      console.log(`     Labels: ${email.labelIds?.join(', ') || 'none'}`);
    });

    // The most recent email's label should be kept, all others removed
    const mostRecentEmail = sortedEmails[0];
    console.log(`\nMost recent email: ${mostRecentEmail.id}`);

    // Get all labels that should be removed from all emails in the thread
    const labelsToRemove = ['To respond', 'Actioned', 'Awaiting reply', 'FYI', 'Meeting update', 'Notification', 'Others'];

    // Process each email in the thread
    for (const email of thread) {
      console.log(`\n--- Processing email ${email.id} ---`);

      // Get auto-applied labels from database
      const result = await db.query(
        `SELECT DISTINCT applied_label
         FROM tagging_logs
         WHERE user_id = $1 AND email_id = $2 AND is_auto_applied = true AND removed_at IS NULL`,
        [userId, email.id]
      );

      const autoLabels = result.rows.map(r => r.applied_label);
      console.log(`Auto-labels in DB: ${autoLabels.join(', ') || 'none'}`);

      // If this is NOT the most recent email, remove all auto-applied labels
      if (email.id !== mostRecentEmail.id) {
        for (const label of autoLabels) {
          console.log(`  Removing label "${label}" from older email ${email.id}`);
          try {
            await gmailService.removeLabel(userId, email.id, label);

            // Mark as removed in database
            await db.query(
              `UPDATE tagging_logs
               SET removed_at = CURRENT_TIMESTAMP
               WHERE user_id = $1 AND email_id = $2 AND applied_label = $3 AND is_auto_applied = true AND removed_at IS NULL`,
              [userId, email.id, label]
            );
            console.log(`  ✓ Removed "${label}"`);
          } catch (error) {
            console.error(`  ✗ Failed to remove "${label}":`, error.message);
          }
        }
      } else {
        console.log(`  This is the most recent email, keeping its label`);
      }
    }

    console.log('\n✓ Thread labels fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
