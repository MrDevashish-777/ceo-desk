import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('ceodesk.db');
    initDatabase(dbInstance);
  }
  return dbInstance;
};

export const initDatabase = (db: SQLite.SQLiteDatabase) => {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS daily_checkins (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      energy INTEGER DEFAULT 3,
      sleep_hours REAL DEFAULT 7.0,
      sleep_quality TEXT DEFAULT 'good',
      mood INTEGER DEFAULT 3,
      workout_done INTEGER DEFAULT 0,
      workout_note TEXT DEFAULT '',
      win_line TEXT DEFAULT '',
      top_priority_1 TEXT DEFAULT '',
      top_priority_1_done INTEGER DEFAULT 0,
      top_priority_2 TEXT DEFAULT '',
      top_priority_2_done INTEGER DEFAULT 0,
      top_priority_3 TEXT DEFAULT '',
      top_priority_3_done INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      area TEXT NOT NULL DEFAULT 'company',
      priority TEXT NOT NULL DEFAULT 'med',
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      completed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      is_pinned INTEGER DEFAULT 0,
      checklist TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      mental TEXT DEFAULT '',
      physical TEXT DEFAULT '',
      emotional TEXT DEFAULT '',
      company TEXT DEFAULT '',
      did_text TEXT DEFAULT '',
      learned_text TEXT DEFAULT '',
      next_text TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_reviews (
      id TEXT PRIMARY KEY,
      week_start_date TEXT UNIQUE NOT NULL,
      worked_text TEXT DEFAULT '',
      didnt_work_text TEXT DEFAULT '',
      focus_next_week TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned);
    CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);
    CREATE INDEX IF NOT EXISTS idx_checkin_date ON daily_checkins(date);
  `);
};
