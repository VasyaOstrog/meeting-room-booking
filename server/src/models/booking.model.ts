/** Reservation of a meeting room for a time interval. */
export interface Booking {
  /** Unique identifier. */
  id: number;
  /** Room being booked. */
  roomId: number;
  /** User who created the booking. */
  userId: number;
  /** Short description (1–100 characters; validated at API layer). */
  title: string;
  /** Interval start in UTC (ISO 8601). */
  startTime: string;
  /** Interval end in UTC (ISO 8601); must be after startTime. */
  endTime: string;
  /** User name of the booking creator. */
  createdBy?: string;
  /** When the booking was created in UTC (ISO 8601). */
  createdAt: string;
  /** When the booking was cancelled, or null if still active. */
  cancelledAt: string | null;
}

/** Fields required to create a booking. */
export interface NewBooking {
  roomId: number;
  userId: number;
  title: string;
  startTime: string;
  endTime: string;
}

export const BOOKING_TABLE = 'bookings';

export const CREATE_BOOKINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${BOOKING_TABLE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    cancelled_at TEXT,
    CHECK (end_time > start_time)
  )
`;

export const CREATE_BOOKINGS_ROOM_TIME_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_bookings_room_time
  ON ${BOOKING_TABLE}(room_id, start_time, end_time)
  WHERE cancelled_at IS NULL
`;
