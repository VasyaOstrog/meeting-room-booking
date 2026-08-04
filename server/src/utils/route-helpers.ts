import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  BookingValidationError,
  BookingConflictError,
  BookingNotFoundError,
} from '../errors/booking.errors';

/**
 * Validate and parse a positive integer ID from request params.
 * Sends 400 response if invalid and returns null.
 */
export function validateIdParam(
  paramValue: string | string[],
  paramName: string,
  res: Response,
): number | null {
  const value = Array.isArray(paramValue) ? paramValue[0] : paramValue;
  const id = Number(value);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ message: `Invalid ${paramName}` });
    return null;
  }

  return id;
}

/**
 * Extract authenticated user from request.
 * Sends 401 response if not authenticated and returns null.
 */
export function requireAuthenticatedUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return null;
  }

  return req.user;
}

/**
 * Handle common booking errors with appropriate HTTP responses.
 * Returns true if error was handled, false otherwise.
 */
export function handleBookingError(error: unknown, res: Response): boolean {
  if (error instanceof BookingValidationError) {
    res.status(400).json({ message: error.message });
    return true;
  }

  if (error instanceof BookingNotFoundError) {
    res.status(404).json({ message: error.message });
    return true;
  }

  if (error instanceof BookingConflictError) {
    res.status(409).json({ message: error.message });
    return true;
  }

  return false;
}

/**
 * Send a generic 500 error response and log the error.
 */
export function sendInternalError(error: unknown, res: Response, message: string): void {
  console.error(error);
  res.status(500).json({ message });
}
