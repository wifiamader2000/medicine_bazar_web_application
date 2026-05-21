const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  if (config.db.type !== 'mongodb') {
    console.log(`[DB] Storage engine is set to: ${config.db.type}`);
    return;
  }

  try {
    const uri = config.db.mongoUri || `mongodb://${config.db.host}:${config.db.port || 27017}/${config.db.name}`;
    await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully to ${uri}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
