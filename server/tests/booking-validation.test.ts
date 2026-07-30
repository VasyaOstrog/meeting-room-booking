import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BookingValidationError } from '../src/errors/booking.errors';
import {
  intervalsOverlap,
  validateCreateBookingInput,
} from '../src/utils/booking-validation';
import { getValidBookingPayload } from './helpers/test-db';

describe('booking validation', () => {
  describe('intervalsOverlap', () => {
    it('returns true when intervals overlap', () => {
      assert.equal(
        intervalsOverlap(
          '2030-06-15T06:00:00.000Z',
          '2030-06-15T07:00:00.000Z',
          '2030-06-15T06:30:00.000Z',
          '2030-06-15T07:30:00.000Z',
        ),
        true,
      );
    });

    it('returns false when intervals are adjacent', () => {
      assert.equal(
        intervalsOverlap(
          '2030-06-15T06:00:00.000Z',
          '2030-06-15T06:30:00.000Z',
          '2030-06-15T06:30:00.000Z',
          '2030-06-15T07:00:00.000Z',
        ),
        false,
      );
    });

    it('returns false when intervals do not overlap', () => {
      assert.equal(
        intervalsOverlap(
          '2030-06-15T06:00:00.000Z',
          '2030-06-15T06:30:00.000Z',
          '2030-06-15T07:00:00.000Z',
          '2030-06-15T07:30:00.000Z',
        ),
        false,
      );
    });
  });

  describe('validateCreateBookingInput', () => {
    it('accepts a valid booking payload', () => {
      const result = validateCreateBookingInput(getValidBookingPayload());

      assert.equal(result.roomId, 1);
      assert.equal(result.userId, 1);
      assert.equal(result.title, 'Team standup');
      assert.equal(result.startTime, '2030-06-15T06:00:00.000Z');
      assert.equal(result.endTime, '2030-06-15T06:30:00.000Z');
    });

    it('rejects missing required fields', () => {
      assert.throws(
        () => validateCreateBookingInput({ roomId: 1 }),
        (error: unknown) => {
          assert.ok(error instanceof BookingValidationError);
          assert.match(error.message, /userId/);
          return true;
        },
      );
    });

    it('rejects empty title', () => {
      assert.throws(
        () => validateCreateBookingInput(getValidBookingPayload({ title: '   ' })),
        (error: unknown) => {
          assert.ok(error instanceof BookingValidationError);
          assert.match(error.message, /title/);
          return true;
        },
      );
    });

    it('rejects times that are not aligned to 30-minute slots', () => {
      assert.throws(
        () =>
          validateCreateBookingInput(
            getValidBookingPayload({
              startTime: '2030-06-15T06:15:00.000Z',
              endTime: '2030-06-15T06:45:00.000Z',
            }),
          ),
        BookingValidationError,
      );
    });

    it('rejects bookings in the past', () => {
      assert.throws(
        () =>
          validateCreateBookingInput(
            getValidBookingPayload({
              startTime: '2020-06-15T06:00:00.000Z',
              endTime: '2020-06-15T06:30:00.000Z',
            }),
          ),
        (error: unknown) => {
          assert.ok(error instanceof BookingValidationError);
          assert.match(error.message, /future/);
          return true;
        },
      );
    });
  });
});
