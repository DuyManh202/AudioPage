import { query } from './db.js';

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS ai_switch_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      switch_name VARCHAR(100) NOT NULL,
      old_value BOOLEAN,
      new_value BOOLEAN NOT NULL,
      changed_by VARCHAR(100) DEFAULT 'admin',
      reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  await query(`
    ALTER TABLE facebook_care_customers 
    ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS ai_draft_reply TEXT;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS ai_message_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id VARCHAR(100),
      channel VARCHAR(50) NOT NULL,
      incoming_text TEXT,
      intent VARCHAR(100),
      reply_text TEXT,
      finish_reason VARCHAR(50),
      latency_ms INTEGER,
      guardrail_result JSONB,
      sent_status VARCHAR(50),
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Thêm cấu hình chế độ nháp và thời gian im lặng
  await query(`
    INSERT INTO system_settings (key, value)
    VALUES 
      ('ai_draft_mode', 'false'::jsonb),
      ('ai_human_quiet_window_minutes', '30'::jsonb),
      ('ai_post_phone_mode', '"one_followup"'::jsonb)
    ON CONFLICT (key) DO NOTHING;
  `);

  console.log('Migration R1 & R9 applied successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
