import { Router } from 'express';
import { getAllRooms } from '../../services/rooms.service';

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
