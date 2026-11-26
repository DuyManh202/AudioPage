import { query } from './db.js';

async function rollback() {
  await query(`DROP TABLE IF EXISTS ai_switch_logs;`);
  await query(`DROP TABLE IF EXISTS ai_message_logs;`);
  await query(`
    ALTER TABLE facebook_care_customers 
    DROP COLUMN IF EXISTS ai_enabled,
    DROP COLUMN IF EXISTS ai_draft_reply;
  `);
  await query(`
    DELETE FROM system_settings 
    WHERE key IN ('ai_draft_mode', 'ai_human_quiet_window_minutes', 'ai_post_phone_mode');
  `);
  console.log('Rollback migration_r1_r9 completed.');
  process.exit(0);
}

rollback().catch(err => {
  console.error(err);
  process.exit(1);
});
