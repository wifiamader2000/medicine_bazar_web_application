const knex = require('knex');
const config = require('./index');

let db = null;

if (config.db.type !== 'json') {
  console.log(`[DB] Initializing SQL connection pool for driver: ${config.db.type}...`);
  
  const knexConfig = {
    client: config.db.type === 'postgres' ? 'pg' : 'mysql2',
    connection: config.db.connectionString || {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
    },
    pool: {
      min: 2,
      max: 10,
    },
  };

  try {
    db = knex(knexConfig);
    
    // Test the database connection immediately (synchronously trigger, handle rejection gracefully)
    db.raw('SELECT 1').then(() => {
      console.log(`[DB] Successfully connected to ${config.db.type} database.`);
    }).catch((err) => {
      console.error(`\n❌ [DB ERROR] Failed to connect to database in ${config.env} mode:`, err.message);
      if (config.isProduction()) {
        console.error('⚠️ [CRITICAL] Running in PRODUCTION mode! Silent JSON fallback is disabled. Exiting...\n');
        process.exit(1);
      }
    });

  } catch (err) {
    console.error(`\n❌ [DB ERROR] Error initializing Knex for ${config.db.type}:`, err.message);
    if (config.isProduction()) {
      console.error('⚠️ [CRITICAL] Running in PRODUCTION mode! Silent JSON fallback is disabled. Exiting...\n');
      process.exit(1);
    }
  }
}

module.exports = db;
