import { Router } from 'express';
import { getAllRooms } from '../../services/rooms.service';

export const roomsRouter = Router();

roomsRouter.get('/', (_req, res) => {
  const rooms = getAllRooms();
  res.json(rooms);
});
