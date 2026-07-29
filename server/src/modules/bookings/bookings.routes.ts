import { Router } from 'express';
import { createBooking, getAllBookings } from '../../services/bookings.service';

export const bookingsRouter = Router();

bookingsRouter.get('/', (_req, res) => {
  const bookings = getAllBookings();
  res.json(bookings);
});

bookingsRouter.post('/', (req, res) => {
  const { roomId, userId, title, startTime, endTime } = req.body ?? {};

  if (
    roomId === undefined ||
    userId === undefined ||
    title === undefined ||
    startTime === undefined ||
    endTime === undefined
  ) {
    res.status(400).json({
      message: 'roomId, userId, title, startTime, and endTime are required',
    });
    return;
  }

  if (
    typeof roomId !== 'number' ||
    typeof userId !== 'number' ||
    typeof title !== 'string' ||
    typeof startTime !== 'string' ||
    typeof endTime !== 'string'
  ) {
    res.status(400).json({ message: 'Invalid booking payload' });
    return;
  }

  if (endTime <= startTime) {
    res.status(400).json({ message: 'endTime must be after startTime' });
    return;
  }

  try {
    const booking = createBooking({ roomId, userId, title, startTime, endTime });
    res.status(201).json(booking);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    res.status(400).json({ message });
  }
});
