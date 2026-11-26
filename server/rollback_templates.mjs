import { query } from './db.js';

async function rollback() {
  await query(`DROP TABLE IF EXISTS ai_templates;`);
  console.log('Rollback ai_templates completed.');
  process.exit(0);
}

rollback().catch(err => {
  console.error(err);
  process.exit(1);
});
