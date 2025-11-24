import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { OrderSubmission } from '../types/order.types';
import { logger } from '../utils/logger';
import { orderExecutionService } from './order-execution.service';

// Redis connection for BullMQ
const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

// Create order queue
export const orderQueue = new Queue<OrderSubmission & { orderId: string }>('order-execution', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // Start with 1 second, then 2s, 4s
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 5000, // Keep last 5000 failed jobs for debugging
    },
  },
});

// Queue events for monitoring
const queueEvents = new QueueEvents('order-execution', { connection });

queueEvents.on('completed', ({ jobId }) => {
  logger.info({ jobId }, 'Job completed');
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error({ jobId, failedReason }, 'Job failed');
});

// Worker to process orders
export const orderWorker = new Worker<OrderSubmission & { orderId: string }>(
  'order-execution',
  async (job: Job<OrderSubmission & { orderId: string }>) => {
    logger.info(
      {
        jobId: job.id,
        orderId: job.data.orderId,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
      },
      'Processing order'
    );

    try {
      await orderExecutionService.executeOrder(job.data.orderId, job.data);
      return { success: true };
    } catch (error: any) {
      logger.error(
        {
          jobId: job.id,
          orderId: job.data.orderId,
          error: error.message,
          attempt: job.attemptsMade + 1,
        },
        'Order execution failed'
      );

      // If max attempts reached, mark as permanently failed
      if (job.attemptsMade + 1 >= (job.opts.attempts || 3)) {
        await orderExecutionService.handleFinalFailure(
          job.data.orderId,
          `Failed after ${job.opts.attempts} attempts: ${error.message}`
        );
      }

      throw error; // Re-throw to trigger retry
    }
  },
  {
    connection,
    concurrency: config.queue.maxConcurrent, // Process up to 10 orders concurrently
    limiter: {
      max: config.queue.ordersPerMinute, // 100 orders per minute
      duration: 60000, // 1 minute
    },
  }
);

// Worker events
orderWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, orderId: job.data.orderId }, 'Worker completed job');
});

orderWorker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, orderId: job?.data.orderId, error: err.message },
    'Worker failed job'
  );
});

orderWorker.on('error', (err) => {
  logger.error({ error: err.message }, 'Worker error');
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down order queue and worker...');
  await orderWorker.close();
  await orderQueue.close();
  await queueEvents.close();
  await connection.quit();
  logger.info('Order queue and worker shut down successfully');
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { connection };
