const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = require('../backend/config');
const knex = require('../backend/config/db');

// Ensure DB_DRIVER is not json when running this migration script explicitly
if (config.db.type === 'json') {
  console.error('\n❌ [MIGRATION ERROR] DB_DRIVER is set to "json".');
  console.error('Please configure your .env file with a database driver (e.g. "postgres" or "mysql") before running this migration.\n');
  process.exit(1);
}

const storesToMigrate = [
  { storeName: 'users', fileName: 'mb_users.json' },
  { storeName: 'products', fileName: 'mb_products.json' },
  { storeName: 'categories', fileName: 'mb_categories.json' },
  { storeName: 'brands', fileName: 'mb_brands.json' },
  { storeName: 'orders', fileName: 'mb_orders.json' },
  { storeName: 'payments', fileName: 'mb_payments.json' },
  { storeName: 'prescriptions', fileName: 'mb_prescriptions.json' },
  { storeName: 'posSales', fileName: 'mb_pos_sales.json' },
  { storeName: 'settings', fileName: 'mb_settings.json' },
  { storeName: 'media', fileName: 'mb_media.json' },
  { storeName: 'auditLogs', fileName: 'mb_audit_logs.json' },
  { storeName: 'blogs', fileName: 'mb_blogs.json' },
  { storeName: 'refunds', fileName: 'mb_refunds.json' },
  { storeName: 'labTests', fileName: 'mb_lab_tests.json' },
  { storeName: 'posSessions', fileName: 'mb_pos_sessions.json' }
];

async function ensureTable(tableName) {
  const exists = await knex.schema.hasTable(tableName);
  if (!exists) {
    console.log(`[DB] Creating table '${tableName}'...`);
    await knex.schema.createTable(tableName, (table) => {
      table.string('id', 255).primary();
      if (knex.client.config.client === 'pg') {
        table.jsonb('data');
      } else {
        table.json('data');
      }
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
    console.log(`[DB] Table '${tableName}' created successfully.`);
  }
}

async function runMigration() {
  console.log(`\n🚀 Starting database migration from JSON to ${config.db.type.toUpperCase()}...`);
  console.log(`   Target Host: ${config.db.host}:${config.db.port}`);
  console.log(`   Target DB:   ${config.db.name}\n`);

  try {
    // 1. Verify DB Connection
    await knex.raw('SELECT 1');
    console.log('✅ Connected to database successfully.');

    // 2. Perform Migration for each store
    for (const { storeName, fileName } of storesToMigrate) {
      const tableName = fileName.replace('.json', '');
      const filePath = path.join(config.paths.database, fileName);

      console.log(`\n----------------------------------------`);
      console.log(`📦 Migrating store: ${storeName} (table: ${tableName})`);

      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Source file not found: ${filePath}. Skipping...`);
        continue;
      }

      // Ensure the table exists
      await ensureTable(tableName);

      // Read JSON contents
      const rawData = fs.readFileSync(filePath, 'utf8');
      const items = JSON.parse(rawData || '[]');

      if (items.length === 0) {
        console.log(`ℹ️  No records to migrate for ${storeName}.`);
        continue;
      }

      // Truncate previous entries to prevent duplicate key constraint violations
      console.log(`🧹 Truncating existing entries in table '${tableName}'...`);
      await knex(tableName).delete();

      // Batch payloads
      const payloads = items.map(item => ({
        id: item.id || require('crypto').randomUUID(),
        data: JSON.stringify(item),
        created_at: new Date(item.createdAt || new Date()),
        updated_at: new Date(item.updatedAt || new Date())
      }));

      // Chunk inserts (max 200 rows per batch)
      const chunkSize = 200;
      let migratedCount = 0;

      for (let i = 0; i < payloads.length; i += chunkSize) {
        const chunk = payloads.slice(i, i + chunkSize);
        await knex(tableName).insert(chunk);
        migratedCount += chunk.length;
        process.stdout.write(`   Migrated ${migratedCount}/${payloads.length} records...\r`);
      }
      process.stdout.write('\n');
      console.log(`🎉 Successfully migrated ${migratedCount} records for ${storeName}.`);
    }

    console.log(`\n========================================`);
    console.log('🚀 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('========================================\n');

  } catch (err) {
    console.error('\n❌ [MIGRATION FATAL ERROR]:', err);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

runMigration();
