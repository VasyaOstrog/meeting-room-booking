import cors from 'cors';
import express from 'express';
import { apiRouter } from './modules';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  return app;
}
