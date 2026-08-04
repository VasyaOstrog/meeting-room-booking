import { BOOKING_TABLE } from '../models/booking.model';
import { ROOM_TABLE } from '../models/room.model';
import { USER_TABLE } from '../models/user.model';

/**
 * SQL queries for booking operations.
 * Centralizes query strings to reduce duplication and improve maintainability.
 */

export const QUERIES = {
  /** Check if a room exists by ID */
  CHECK_ROOM_EXISTS: `SELECT id FROM ${ROOM_TABLE} WHERE id = ?`,

  /** Check if a user exists by ID */
  CHECK_USER_EXISTS: `SELECT id FROM ${USER_TABLE} WHERE id = ?`,

  /** Find conflicting bookings for a room in a time range */
  FIND_TIME_CONFLICT: `
    SELECT id
    FROM ${BOOKING_TABLE}
    WHERE room_id = ?
      AND cancelled_at IS NULL
      AND start_time < ?
      AND end_time > ?
  `,

  /** Find conflicting bookings excluding a specific booking ID */
  FIND_TIME_CONFLICT_EXCLUDING: `
    SELECT id
    FROM ${BOOKING_TABLE}
    WHERE room_id = ?
      AND id != ?
      AND cancelled_at IS NULL
      AND start_time < ?
      AND end_time > ?
  `,

  /** Select all bookings with user information */
  SELECT_ALL_BOOKINGS: `
    SELECT
      b.id, b.room_id, b.user_id, b.title,
      b.start_time, b.end_time, b.created_at, b.cancelled_at,
      u.name AS user_name
    FROM ${BOOKING_TABLE} b
    JOIN ${USER_TABLE} u ON u.id = b.user_id
    ORDER BY b.start_time ASC
  `,

  /** Select bookings by user ID */
  SELECT_BOOKINGS_BY_USER: `
    SELECT
      b.id, b.room_id, b.user_id, b.title,
      b.start_time, b.end_time, b.created_at, b.cancelled_at,
      u.name AS user_name
    FROM ${BOOKING_TABLE} b
    JOIN ${USER_TABLE} u ON u.id = b.user_id
    WHERE b.user_id = ?
    ORDER BY b.start_time ASC
  `,

  /** Select a single booking by ID with user information */
  SELECT_BOOKING_BY_ID: `
    SELECT
      b.id, b.room_id, b.user_id, b.title,
      b.start_time, b.end_time, b.created_at, b.cancelled_at,
      u.name AS user_name
    FROM ${BOOKING_TABLE} b
    JOIN ${USER_TABLE} u ON u.id = b.user_id
    WHERE b.id = ?
  `,

  /** Select a booking by ID without joins */
  SELECT_BOOKING_SIMPLE: `
    SELECT id, room_id, user_id, title, start_time, end_time, created_at, cancelled_at
    FROM ${BOOKING_TABLE}
    WHERE id = ?
  `,

  /** Insert a new booking */
  INSERT_BOOKING: `
    INSERT INTO ${BOOKING_TABLE} (room_id, user_id, title, start_time, end_time)
    VALUES (@roomId, @userId, @title, @startTime, @endTime)
  `,

  /** Update a booking */
  UPDATE_BOOKING: `
    UPDATE ${BOOKING_TABLE}
    SET room_id = ?, title = ?, start_time = ?, end_time = ?
    WHERE id = ?
  `,

  /** Cancel a booking by setting cancelled_at timestamp */
  CANCEL_BOOKING: `
    UPDATE ${BOOKING_TABLE}
    SET cancelled_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `,
} as const;
