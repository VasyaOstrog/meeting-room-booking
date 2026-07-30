import cors from 'cors';
import express from 'express';
import { errorHandler, jsonParseErrorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRouter } from './modules';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(jsonParseErrorHandler);
  app.use(errorHandler);

  return app;
}
