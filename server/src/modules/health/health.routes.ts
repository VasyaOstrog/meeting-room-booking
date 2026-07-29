import { Router } from 'express';
import { verifyDatabaseConnection } from '../../config/database';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const databaseConnected = verifyDatabaseConnection();

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'degraded',
    service: 'meeting-room-booking-api',
    database: databaseConnected ? 'connected' : 'disconnected',
  });
});
