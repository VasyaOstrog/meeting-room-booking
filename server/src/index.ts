import { createApp } from './app';
import { closeDatabase, connectDatabase, verifyDatabaseConnection } from './config/database';
import { env } from './config/env';
import { initializeSchema } from './models';

connectDatabase();
initializeSchema();

if (!verifyDatabaseConnection()) {
  console.error('Failed to connect to the database');
  process.exit(1);
}

console.log('Database connection established');

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});

function shutdown() {
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
