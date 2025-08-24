import Database from 'better-sqlite3';
import path from 'path';

let db = null;

export function initDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'monkeys.db');
    db = new Database(dbPath);
    
    // Create monkeys table
    db.exec(`
      CREATE TABLE IF NOT EXISTS monkeys (
        monkey_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        species TEXT NOT NULL,
        age_years INTEGER NOT NULL,
        favourite_fruit TEXT NOT NULL,
        last_checkup_at TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    
    console.log('SQLite database initialized');
  }
  return db;
}

export function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}