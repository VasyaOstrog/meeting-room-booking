import { Router } from 'express';
import { authRouter } from './auth/auth.routes';
import { bookingsRouter } from './bookings/bookings.routes';
import { healthRouter } from './health/health.routes';
import { roomsRouter } from './rooms/rooms.routes';
import { profileRouter } from './profile/profile.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/rooms', roomsRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/profile', profileRouter);
