#!/usr/bin/env node
/**
 * Simple SQL migration runner for E-Quran Academy.
 *
 * - Reads every `*.sql` file from `Backend/migrations/` in lexical order
 *   and executes each statement against the configured MySQL database.
 * - Tracks which files have been applied in the `_migrations` table so
 *   it is safe to re-run.
 *
 * Usage:
 *   node Backend/scripts/migrate.js              # apply pending migrations
 *   node Backend/scripts/migrate.js --seed       # also apply 002_seed_data.sql
 *   node Backend/scripts/migrate.js --reset      # drop & recreate the database (DANGER)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const args = new Set(process.argv.slice(2));
const APPLY_SEED = args.has('--seed');
const RESET = args.has('--reset');

const DB_NAME = process.env.DB_NAME || 'equran_academy';

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    if (RESET) {
      console.log(`⚠  Dropping database \`${DB_NAME}\`…`);
      await connection.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    }

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${DB_NAME}\``);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    const dir = path.resolve(__dirname, '../migrations');
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const [appliedRows] = await connection.query('SELECT filename FROM _migrations');
    const applied = new Set(appliedRows.map((r) => r.filename));

    for (const file of files) {
      if (file === '002_seed_data.sql' && !APPLY_SEED) {
        console.log(`↷  Skipping ${file} (pass --seed to apply)`);
        continue;
      }
      if (applied.has(file)) {
        console.log(`✓  Already applied: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      console.log(`→  Applying ${file}…`);
      try {
        await connection.query(sql);
        await connection.query('INSERT INTO _migrations (filename) VALUES (?)', [file]);
        console.log(`✓  Applied: ${file}`);
      } catch (err) {
        console.error(`✕  Failed on ${file}:`, err.sqlMessage || err.message);
        process.exit(1);
      }
    }

    console.log('All migrations complete.');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Migration runner crashed:', err);
  process.exit(1);
});
