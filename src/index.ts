import { fastify } from './api/server';
import { database } from './database';
import { config } from './config';
import { logger } from './utils/logger';

async function start() {
  try {
    // Initialize database
    await database.initialize();
    logger.info('Database initialized');

    // Start Fastify server
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(`Server listening on ${config.server.host}:${config.server.port}`);
    logger.info(`WebSocket endpoint: ws://${config.server.host}:${config.server.port}/api/orders/execute`);
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down server...');
  await fastify.close();
  await database.close();
  logger.info('Server shut down successfully');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
start();
