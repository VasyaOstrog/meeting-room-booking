import { getDatabase } from '../config/database';
import {
  BookingConflictError,
  BookingNotFoundError,
  BookingValidationError,
} from '../errors/booking.errors';
import { Booking, NewBooking } from '../models';
import { validateCreateBookingInput } from '../utils/booking-validation';
import { QUERIES } from './bookings.queries';

interface BookingRow {
  id: number;
  room_id: number;
  user_id: number;
  title: string;
  start_time: string;
  end_time: string;
  user_name?: string;
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
    createdBy: row.user_name,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
  };
}

function assertRoomExists(roomId: number): void {
  const db = getDatabase();
  const row = db.prepare(QUERIES.CHECK_ROOM_EXISTS).get(roomId);

  if (!row) {
    throw new BookingNotFoundError(`Room with id ${roomId} was not found`);
  }
}

function assertUserExists(userId: number): void {
  const db = getDatabase();
  const row = db.prepare(QUERIES.CHECK_USER_EXISTS).get(userId);

  if (!row) {
    throw new BookingNotFoundError(`User with id ${userId} was not found`);
  }
}

function assertNoTimeConflict(roomId: number, startTime: string, endTime: string): void {
  const db = getDatabase();
  const conflict = db
    .prepare(QUERIES.FIND_TIME_CONFLICT)
    .get(roomId, endTime, startTime) as { id: number } | undefined;

  if (conflict) {
    throw new BookingConflictError('This room is already booked for the selected time');
  }
}

export function getAllBookings(): Booking[] {
  const db = getDatabase();
  const rows = db.prepare(QUERIES.SELECT_ALL_BOOKINGS).all() as BookingRow[];
  return rows.map(mapBooking);
}

export function getBookingsByUser(userId: number): Booking[] {
  const db = getDatabase();
  const rows = db.prepare(QUERIES.SELECT_BOOKINGS_BY_USER).all(userId) as BookingRow[];
  return rows.map(mapBooking);
}

export function getBookingById(bookingId: number): Booking {
  const db = getDatabase();
  const row = db.prepare(QUERIES.SELECT_BOOKING_BY_ID).get(bookingId) as BookingRow | undefined;

  if (!row) {
    throw new BookingNotFoundError(`Booking with id ${bookingId} was not found`);
  }

  return mapBooking(row);
}

const MIN_CANCEL_HOURS = 2;
const MS_PER_HOUR = 1000 * 60 * 60;

export function cancelBooking(bookingId: number, userId: number, reason?: string): Booking {
  const db = getDatabase();
  const booking = db.prepare(QUERIES.SELECT_BOOKING_SIMPLE).get(bookingId) as BookingRow | undefined;

  if (!booking) {
    throw new BookingNotFoundError(`Booking with id ${bookingId} was not found`);
  }

  if (booking.user_id !== userId) {
    throw new BookingNotFoundError(`Booking with id ${bookingId} was not found`);
  }

  if (booking.cancelled_at) {
    throw new BookingValidationError('Booking is already cancelled');
  }

  const bookingStart = new Date(booking.start_time);
  const now = new Date();
  const hoursDiff = (bookingStart.getTime() - now.getTime()) / MS_PER_HOUR;

  if (hoursDiff < MIN_CANCEL_HOURS && hoursDiff > 0) {
    throw new BookingValidationError('Cannot cancel booking less than 2 hours before start time');
  }

  db.prepare(QUERIES.CANCEL_BOOKING).run(bookingId);

  const row = db.prepare(QUERIES.SELECT_BOOKING_BY_ID).get(bookingId) as BookingRow;
  return mapBooking(row);
}

export function updateBooking(bookingId: number, userId: number, body: unknown): Booking {
  const input = validateCreateBookingInput(body);
  const db = getDatabase();

  const existing = db.prepare(QUERIES.SELECT_BOOKING_SIMPLE).get(bookingId) as BookingRow | undefined;

  if (!existing) {
    throw new BookingNotFoundError(`Booking with id ${bookingId} was not found`);
  }

  if (existing.user_id !== userId) {
    throw new BookingNotFoundError(`Booking with id ${bookingId} was not found`);
  }

  if (existing.cancelled_at) {
    throw new BookingValidationError('Cannot update a cancelled booking');
  }

  const conflict = db
    .prepare(QUERIES.FIND_TIME_CONFLICT_EXCLUDING)
    .get(input.roomId, bookingId, input.endTime, input.startTime) as { id: number } | undefined;

  if (conflict) {
    throw new BookingConflictError('This room is already booked for the selected time');
  }

  assertRoomExists(input.roomId);

  db.prepare(QUERIES.UPDATE_BOOKING).run(input.roomId, input.title, input.startTime, input.endTime, bookingId);

  return getBookingById(bookingId);
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
    const result = db.prepare(QUERIES.INSERT_BOOKING).run(input);
    const row = db.prepare(QUERIES.SELECT_BOOKING_SIMPLE).get(result.lastInsertRowid) as BookingRow;
    return mapBooking(row);
  } catch (error) {
    if (error instanceof BookingValidationError) {
      throw error;
    }

    throw new BookingValidationError('Failed to create booking');
  }
}
