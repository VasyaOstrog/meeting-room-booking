import { Router } from 'express';
import { bookingsRouter } from './bookings/bookings.routes';
import { healthRouter } from './health/health.routes';
import { roomsRouter } from './rooms/rooms.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/rooms', roomsRouter);
apiRouter.use('/bookings', bookingsRouter);
