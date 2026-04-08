const mysql = require('mysql2/promise');
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
    console.log('✓ MySQL connected successfully to', process.env.DB_NAME || 'equran_academy');
    connection.release();
  } catch (error) {
    console.error('✕ MySQL connection failed:', error.message);
    console.error('  Make sure XAMPP MySQL is running and the database exists.');
    console.error('  Run db_setup.sql in phpMyAdmin first.');
  }
}

testConnection();

module.exports = pool;
