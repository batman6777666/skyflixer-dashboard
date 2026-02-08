import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'video_rename.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✅ Database connected');
    initializeDatabase();
  }
});

// Initialize database schema
function initializeDatabase() {
  db.serialize(() => {
    // Create renames table
    db.run(`
      CREATE TABLE IF NOT EXISTS renames (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        new_filename TEXT NOT NULL,
        platforms TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT
      )
    `);

    // Create daily_stats table
    db.run(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        total_count INTEGER DEFAULT 0,
        successful_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0
      )
    `);

    // Create indexes for performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_renames_timestamp ON renames(timestamp)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date)`);

    console.log('✅ Database initialized successfully');
  });
}

export default db;
