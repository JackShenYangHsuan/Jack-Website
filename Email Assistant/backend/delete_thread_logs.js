/**
 * Quick script to delete tagging logs for a thread to force re-evaluation
 */

const db = require('./config/database');

const threadId = '19a7bdef55325661';

(async () => {
  try {
    console.log(`Deleting tagging logs for thread ${threadId}...`);

    const result = await db.query(
      'DELETE FROM tagging_logs WHERE thread_id = $1',
      [threadId]
    );

    console.log(`✓ Deleted ${result.rowCount} log entries for thread ${threadId}`);
    console.log('Thread will be re-evaluated on next poll');

    process.exit(0);
  } catch (error) {
    console.error('Error deleting logs:', error);
    process.exit(1);
  }
})();
