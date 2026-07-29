import { getDatabase } from '../config/database';
import {
  BOOKING_TABLE,
  CREATE_BOOKINGS_ROOM_TIME_INDEX,
  CREATE_BOOKINGS_TABLE,
} from './booking.model';
import { CREATE_ROOMS_TABLE, ROOM_TABLE } from './room.model';
import { CREATE_USERS_TABLE, USER_TABLE } from './user.model';

export * from './booking.model';
export * from './room.model';
export * from './user.model';

const SCHEMA_STATEMENTS = [
  CREATE_USERS_TABLE,
  CREATE_ROOMS_TABLE,
  CREATE_BOOKINGS_TABLE,
  CREATE_BOOKINGS_ROOM_TIME_INDEX,
];

/** Create database tables for users, rooms, and bookings if they do not exist. */
export function initializeSchema(): void {
  const db = getDatabase();

  for (const statement of SCHEMA_STATEMENTS) {
    db.exec(statement);
  }
}

export const tables = {
  users: USER_TABLE,
  rooms: ROOM_TABLE,
  bookings: BOOKING_TABLE,
} as const;
