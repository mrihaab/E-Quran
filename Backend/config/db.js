const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'equran_academy',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Enable JSON parsing
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const val = field.string();
      return val ? JSON.parse(val) : null;
    }
    return next();
  }
});

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info(`MySQL connected to database: ${process.env.DB_NAME || 'equran_academy'}`);
    connection.release();
  } catch (error) {
    logger.error(`MySQL connection failed: ${error.message}`);
    logger.error('Ensure MySQL is running and the database/credentials are correct.');
  }
}

testConnection();

module.exports = pool;
