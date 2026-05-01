const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'equran_academy',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 20,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const val = field.string();
      return val ? JSON.parse(val) : null;
    }
    return next();
  }
});

async function testConnection(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await pool.getConnection();
      logger.info(`MySQL connected to ${process.env.DB_NAME || 'equran_academy'} (attempt ${attempt})`);
      connection.release();
      return true;
    } catch (error) {
      logger.error(`MySQL connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  logger.error('All MySQL connection attempts failed. Check your database configuration.');
  return false;
}

async function healthCheck() {
  try {
    const [rows] = await pool.query('SELECT 1 as ok');
    return rows[0].ok === 1;
  } catch {
    return false;
  }
}

testConnection();

setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    logger.warn('Database keepalive ping failed:', error.message);
  }
}, 30000);

module.exports = pool;
module.exports.testConnection = testConnection;
module.exports.healthCheck = healthCheck;
