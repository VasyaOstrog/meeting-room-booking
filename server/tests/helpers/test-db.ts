import fs from 'fs';
import path from 'path';
import { closeDatabase, connectDatabase } from '../../src/config/database';
import { initializeSchema } from '../../src/models';
import { BOOKING_TABLE } from '../../src/models/booking.model';
import { ROOM_TABLE } from '../../src/models/room.model';
import { USER_TABLE } from '../../src/models/user.model';

const TEST_DB_DIR = path.join(__dirname, '..', 'tmp');

export function setupTestDatabase(name: string): string {
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  }

  const databasePath = path.join(TEST_DB_DIR, `${name}.sqlite`);

  closeDatabase();

  for (const suffix of ['', '-wal', '-shm']) {
    const filePath = `${databasePath}${suffix}`;

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  process.env.DATABASE_PATH = databasePath;
  process.env.NODE_ENV = 'test';

  connectDatabase();
  initializeSchema();
  seedTestData();

  return databasePath;
}

export function teardownTestDatabase(): void {
  closeDatabase();
}

function seedTestData(): void {
  const db = connectDatabase();

  db.prepare(`DELETE FROM ${BOOKING_TABLE}`).run();
  db.prepare(`DELETE FROM ${ROOM_TABLE}`).run();
  db.prepare(`DELETE FROM ${USER_TABLE}`).run();

  db.prepare(
    `INSERT INTO ${ROOM_TABLE} (id, name, floor, capacity) VALUES (1, 'Conference A', 1, 8)`,
  ).run();

  db.prepare(
    `INSERT INTO ${USER_TABLE} (id, name, email, password_hash) VALUES (1, 'Test User', 'test@example.com', 'hash')`,
  ).run();
}

export function getValidBookingPayload(overrides: Record<string, unknown> = {}) {
  return {
    roomId: 1,
    userId: 1,
    title: 'Team standup',
    startTime: '2030-06-15T06:00:00.000Z',
    endTime: '2030-06-15T06:30:00.000Z',
    ...overrides,
  };
}
