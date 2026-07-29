import { getDatabase } from '../config/database';
import { Room, ROOM_TABLE } from '../models';

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
