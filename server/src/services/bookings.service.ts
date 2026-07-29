import { getDatabase } from '../config/database';
import { Booking, BOOKING_TABLE, NewBooking } from '../models';

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

export function createBooking(input: NewBooking): Booking {
  const db = getDatabase();
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
}
