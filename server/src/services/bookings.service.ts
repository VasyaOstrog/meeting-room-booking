import { getDatabase } from '../config/database';
import {
  BookingConflictError,
  BookingNotFoundError,
  BookingValidationError,
} from '../errors/booking.errors';
import { Booking, BOOKING_TABLE, NewBooking } from '../models';
import { ROOM_TABLE } from '../models/room.model';
import { USER_TABLE } from '../models/user.model';
import { validateCreateBookingInput } from '../utils/booking-validation';

interface BookingRow {
  id: number;
  room_id: number;
  user_id: number;
  title: string;
  start_time: string;
  end_time: string;
  created_at: string;
  cancelled_at: string | null;
}

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
  };
}

function assertRoomExists(roomId: number): void {
  const db = getDatabase();
  const row = db.prepare(`SELECT id FROM ${ROOM_TABLE} WHERE id = ?`).get(roomId);

  if (!row) {
    throw new BookingNotFoundError(`Room with id ${roomId} was not found`);
  }
}

function assertUserExists(userId: number): void {
  const db = getDatabase();
  const row = db.prepare(`SELECT id FROM ${USER_TABLE} WHERE id = ?`).get(userId);

  if (!row) {
    throw new BookingNotFoundError(`User with id ${userId} was not found`);
  }
}

function assertNoTimeConflict(roomId: number, startTime: string, endTime: string): void {
  const db = getDatabase();
  const conflict = db
    .prepare(
      `SELECT id
       FROM ${BOOKING_TABLE}
       WHERE room_id = ?
         AND cancelled_at IS NULL
         AND start_time < ?
         AND end_time > ?`,
    )
    .get(roomId, endTime, startTime) as { id: number } | undefined;

  if (conflict) {
    throw new BookingConflictError('This room is already booked for the selected time');
  }
}

export function getAllBookings(): Booking[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, room_id, user_id, title, start_time, end_time, created_at, cancelled_at
       FROM ${BOOKING_TABLE}
       ORDER BY start_time ASC`,
    )
    .all() as BookingRow[];

  return rows.map(mapBooking);
}

export function createBooking(body: unknown): Booking {
  const input = validateCreateBookingInput(body);

  assertRoomExists(input.roomId);
  assertUserExists(input.userId);
  assertNoTimeConflict(input.roomId, input.startTime, input.endTime);

  return insertBooking(input);
}

function insertBooking(input: NewBooking): Booking {
  const db = getDatabase();

  try {
    const result = db
      .prepare(
        `INSERT INTO ${BOOKING_TABLE} (room_id, user_id, title, start_time, end_time)
         VALUES (@roomId, @userId, @title, @startTime, @endTime)`,
      )
      .run(input);

    const row = db
      .prepare(
        `SELECT id, room_id, user_id, title, start_time, end_time, created_at, cancelled_at
         FROM ${BOOKING_TABLE}
         WHERE id = ?`,
      )
      .get(result.lastInsertRowid) as BookingRow;

    return mapBooking(row);
  } catch (error) {
    if (error instanceof BookingValidationError) {
      throw error;
    }

    throw new BookingValidationError('Failed to create booking');
  }
}
