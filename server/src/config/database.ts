import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { env } from './env';

let db: Database.Database | null = null;

function resolveDatabasePath(): string {
  const configuredPath = env.databasePath;
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

export function connectDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const databasePath = resolveDatabasePath();
  const directory = path.dirname(databasePath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database is not connected. Call connectDatabase() first.');
  }

  return db;
}

export function verifyDatabaseConnection(): boolean {
  const connection = connectDatabase();
  const result = connection.prepare('SELECT 1 AS ok').get() as { ok: number };
  return result.ok === 1;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
