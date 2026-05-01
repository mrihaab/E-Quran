const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'equran_academy',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  // MySQL JSON columns are returned as strings by default with mysql2
  // when typeCast is overridden; restore the parsed-object behaviour.
  typeCast(field, next) {
    if (field.type === 'JSON') {
      const val = field.string();
      try {
        return val ? JSON.parse(val) : null;
      } catch (_) {
        return val;
      }
    }
    return next();
  },
};

const pool = mysql.createPool(config);

let lastReportedFailure = 0;

async function ping() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch (err) {
    const now = Date.now();
    if (now - lastReportedFailure > 60_000) {
      lastReportedFailure = now;
      logger.error(
        `MySQL connection failed (${config.host}:${config.port}/${config.database}): ${err.message}`
      );
      logger.error('  Make sure the database is running and credentials in .env are correct.');
      logger.error('  Run `npm run db:migrate` from the Backend folder to bootstrap the schema.');
    }
    return false;
  }
}

// Initial connectivity probe at boot — non-blocking, just logs.
ping().then((ok) => {
  if (ok) {
    logger.info(`MySQL connected: ${config.host}:${config.port}/${config.database}`);
  }
});

module.exports = pool;
module.exports.ping = ping;
