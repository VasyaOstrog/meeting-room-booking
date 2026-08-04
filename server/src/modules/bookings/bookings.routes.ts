import { Router } from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingsByUser,
  getBookingById,
  cancelBooking,
  updateBooking,
} from '../../services/bookings.service';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import {
  validateIdParam,
  requireAuthenticatedUser,
  handleBookingError,
  sendInternalError,
} from '../../utils/route-helpers';

export const bookingsRouter = Router();

bookingsRouter.get('/', (_req, res) => {
  try {
    const bookings = getAllBookings();
    res.json(bookings);
  } catch (error) {
    sendInternalError(error, res, 'Failed to load bookings');
  }
});

bookingsRouter.get('/my', requireAuth, (req, res) => {
  try {
    const user = requireAuthenticatedUser(req as AuthRequest, res);
    if (!user) return;

    const bookings = getBookingsByUser(user.userId);
    res.json(bookings);
  } catch (error) {
    sendInternalError(error, res, 'Failed to load your bookings');
  }
});

bookingsRouter.get('/:id', requireAuth, (req, res) => {
  try {
    const bookingId = validateIdParam(req.params.id, 'booking ID', res);
    if (!bookingId) return;

    const booking = getBookingById(bookingId);
    res.json(booking);
  } catch (error) {
    if (handleBookingError(error, res)) return;
    sendInternalError(error, res, 'Failed to load booking');
  }
});

bookingsRouter.post('/', (req, res) => {
  try {
    const booking = createBooking(req.body);
    res.status(201).json(booking);
  } catch (error) {
    if (handleBookingError(error, res)) return;
    sendInternalError(error, res, 'Failed to create booking');
  }
});

bookingsRouter.put('/:id', requireAuth, (req, res) => {
  try {
    const user = requireAuthenticatedUser(req as AuthRequest, res);
    if (!user) return;

    const bookingId = validateIdParam(req.params.id, 'booking ID', res);
    if (!bookingId) return;

    const payload = {
      ...req.body,
      userId: user.userId,
    };

    const booking = updateBooking(bookingId, user.userId, payload);
    res.json(booking);
  } catch (error) {
    if (handleBookingError(error, res)) return;
    sendInternalError(error, res, 'Failed to update booking');
  }
});

bookingsRouter.post('/:id/cancel', requireAuth, (req, res) => {
  try {
    const user = requireAuthenticatedUser(req as AuthRequest, res);
    if (!user) return;

    const bookingId = validateIdParam(req.params.id, 'booking ID', res);
    if (!bookingId) return;

    const reason = req.body.reason;
    const booking = cancelBooking(bookingId, user.userId, reason);
    res.json(booking);
  } catch (error) {
    if (handleBookingError(error, res)) return;
    sendInternalError(error, res, 'Failed to cancel booking');
  }
});
