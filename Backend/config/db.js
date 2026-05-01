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
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const val = field.string();
      return val ? JSON.parse(val) : null;
    }
    return next();
  }
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info(`MySQL connected to ${process.env.DB_NAME || 'equran_academy'} at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    connection.release();
  } catch (error) {
    logger.error(`MySQL connection failed: ${error.message}`);
    logger.error('Ensure your database server is running and db_setup.sql has been executed.');
  }
}

testConnection();

module.exports = pool;
