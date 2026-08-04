import { getDatabase } from '../config/database';
import { Room, ROOM_TABLE, NewRoom } from '../models';
import { RoomValidationError } from '../errors/room.errors';

interface RoomRow {
  id: number;
  name: string;
  floor: number;
  capacity: number;
  created_at: string;
}

function mapRoom(row: RoomRow): Room {
  return {
    id: row.id,
    name: row.name,
    floor: row.floor,
    capacity: row.capacity,
    createdAt: row.created_at,
  };
}

function validateNewRoom(input: unknown): NewRoom {
  if (input === null || typeof input !== 'object') {
    throw new RoomValidationError('Request body must be a JSON object');
  }

  const payload = input as Record<string, unknown>;
  const name = String(payload.name ?? '').trim();
  const floor = Number(payload.floor);
  const capacity = Number(payload.capacity);

  if (!name) {
    throw new RoomValidationError('Room name is required');
  }

  if (!Number.isInteger(floor) || floor < 0) {
    throw new RoomValidationError('Floor must be a non-negative integer');
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new RoomValidationError('Capacity must be a positive integer');
  }

  return { name, floor, capacity };
}

export function getAllRooms(): Room[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, name, floor, capacity, created_at
       FROM ${ROOM_TABLE}
       ORDER BY floor ASC, name ASC`,
    )
    .all() as RoomRow[];

  return rows.map(mapRoom);
}

export function createRoom(body: unknown): Room {
  const input = validateNewRoom(body);
  const db = getDatabase();

  const result = db
    .prepare(
      `INSERT INTO ${ROOM_TABLE} (name, floor, capacity)
       VALUES (@name, @floor, @capacity)`,
    )
    .run(input);

  const row = db
    .prepare(
      `SELECT id, name, floor, capacity, created_at
       FROM ${ROOM_TABLE}
       WHERE id = ?`,
    )
    .get(result.lastInsertRowid) as RoomRow;

  return mapRoom(row);
}
