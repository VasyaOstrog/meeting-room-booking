/** Meeting room available for reservation. */
export interface Room {
  /** Unique identifier. */
  id: number;
  /** Room label, e.g. "Conference A". */
  name: string;
  /** Building floor number. */
  floor: number;
  /** Maximum number of people the room holds. */
  capacity: number;
  /** Record creation timestamp in UTC (ISO 8601). */
  createdAt: string;
}

/** Fields required to create a meeting room. */
export interface NewRoom {
  name: string;
  floor: number;
  capacity: number;
}

export const ROOM_TABLE = 'rooms';

export const CREATE_ROOMS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${ROOM_TABLE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    floor INTEGER NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`;
