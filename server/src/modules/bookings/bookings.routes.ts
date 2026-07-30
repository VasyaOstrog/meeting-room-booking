import { Router } from 'express';
import {
  BookingConflictError,
  BookingNotFoundError,
  BookingValidationError,
} from '../../errors/booking.errors';
import { createBooking, getAllBookings } from '../../services/bookings.service';

export const bookingsRouter = Router();

bookingsRouter.get('/', (_req, res) => {
  try {
    const bookings = getAllBookings();
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load bookings' });
  }
});

bookingsRouter.post('/', (req, res) => {
  try {
    const booking = createBooking(req.body);
    res.status(201).json(booking);
  } catch (error) {
    if (error instanceof BookingValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    if (error instanceof BookingNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }

    if (error instanceof BookingConflictError) {
      res.status(409).json({ message: error.message });
      return;
    }

    console.error(error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});
