import { NewBooking } from '../models';
import { BookingValidationError } from '../errors/booking.errors';

export const OFFICE_TIMEZONE = 'Europe/Kyiv';
export const OFFICE_OPEN_MINUTES = 9 * 60;
export const OFFICE_CLOSE_MINUTES = 19 * 60;
export const MIN_BOOKING_DURATION_MS = 30 * 60 * 1000;
export const MAX_BOOKING_DURATION_MS = 4 * 60 * 60 * 1000;
export const MIN_TITLE_LENGTH = 1;
export const MAX_TITLE_LENGTH = 100;

interface OfficeDateTime {
  dateKey: string;
  totalMinutes: number;
  second: number;
}

function parsePositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new BookingValidationError(`${fieldName} must be a positive integer`);
  }

  return value;
}

function parseIsoDate(value: unknown, fieldName: string): Date {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BookingValidationError(`${fieldName} must be a valid ISO 8601 date/time string`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BookingValidationError(`${fieldName} must be a valid ISO 8601 date/time string`);
  }

  return date;
}

function toOfficeDateTime(date: Date): OfficeDateTime {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: OFFICE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour') % 24;
  const minute = get('minute');
  const second = get('second');

  return {
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    totalMinutes: hour * 60 + minute,
    second,
  };
}

/** Returns true when two half-open intervals overlap; adjacent slots are allowed. */
export function intervalsOverlap(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date,
): boolean {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart < bEnd && bStart < aEnd;
}

function assertSlotAligned(officeDateTime: OfficeDateTime, fieldName: string): void {
  if (officeDateTime.second !== 0 || officeDateTime.totalMinutes % 30 !== 0) {
    throw new BookingValidationError(`${fieldName} must align to 30-minute office-time slots`);
  }
}

function assertWithinOfficeHours(start: OfficeDateTime, end: OfficeDateTime): void {
  if (start.dateKey !== end.dateKey) {
    throw new BookingValidationError('Bookings must start and end on the same office day');
  }

  if (start.totalMinutes < OFFICE_OPEN_MINUTES) {
    throw new BookingValidationError(
      'Bookings must be within office hours (09:00–19:00 Europe/Kyiv)',
    );
  }

  if (end.totalMinutes > OFFICE_CLOSE_MINUTES) {
    throw new BookingValidationError(
      'Bookings must be within office hours (09:00–19:00 Europe/Kyiv)',
    );
  }
}

function assertFutureBooking(startTime: Date): void {
  if (startTime.getTime() <= Date.now()) {
    throw new BookingValidationError('Bookings must be scheduled in the future');
  }
}

function assertDuration(startTime: Date, endTime: Date): void {
  const durationMs = endTime.getTime() - startTime.getTime();

  if (durationMs < MIN_BOOKING_DURATION_MS) {
    throw new BookingValidationError('Booking duration must be at least 30 minutes');
  }

  if (durationMs > MAX_BOOKING_DURATION_MS) {
    throw new BookingValidationError('Booking duration must not exceed 4 hours');
  }
}

function parseTitle(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BookingValidationError('title must be a string');
  }

  const title = value.trim();

  if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
    throw new BookingValidationError('title must be between 1 and 100 characters');
  }

  return title;
}

export function validateCreateBookingInput(body: unknown): NewBooking {
  if (body === null || typeof body !== 'object') {
    throw new BookingValidationError('Request body must be a JSON object');
  }

  const payload = body as Record<string, unknown>;
  const roomId = parsePositiveInteger(payload.roomId, 'roomId');
  const userId = parsePositiveInteger(payload.userId, 'userId');
  const title = parseTitle(payload.title);
  const startTimeDate = parseIsoDate(payload.startTime, 'startTime');
  const endTimeDate = parseIsoDate(payload.endTime, 'endTime');

  if (endTimeDate.getTime() <= startTimeDate.getTime()) {
    throw new BookingValidationError('endTime must be after startTime');
  }

  assertDuration(startTimeDate, endTimeDate);
  assertFutureBooking(startTimeDate);

  const officeStart = toOfficeDateTime(startTimeDate);
  const officeEnd = toOfficeDateTime(endTimeDate);

  assertSlotAligned(officeStart, 'startTime');
  assertSlotAligned(officeEnd, 'endTime');
  assertWithinOfficeHours(officeStart, officeEnd);

  return {
    roomId,
    userId,
    title,
    startTime: startTimeDate.toISOString(),
    endTime: endTimeDate.toISOString(),
  };
}
