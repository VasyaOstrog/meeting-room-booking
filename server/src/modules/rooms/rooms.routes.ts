import { Router } from 'express';
import { createRoom, getAllRooms } from '../../services/rooms.service';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { RoomValidationError } from '../../errors/room.errors';

export const roomsRouter = Router();

roomsRouter.get('/', (_req, res) => {
  try {
    const rooms = getAllRooms();
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load rooms' });
  }
});

roomsRouter.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const room = createRoom(req.body);
    res.status(201).json(room);
  } catch (error) {
    if (error instanceof RoomValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error(error);
    res.status(500).json({ message: 'Failed to create room' });
  }
});
