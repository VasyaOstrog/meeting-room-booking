import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  authTokenSecret: process.env.AUTH_TOKEN_SECRET || 'dev-secret-change-me',
  get databasePath() {
    return process.env.DATABASE_PATH || './data/meeting-room-booking.sqlite';
  },
};
