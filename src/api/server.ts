import Fastify from 'fastify';
import websocketPlugin from '@fastify/websocket';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { orderExecutionService } from '../services/order-execution.service';
import { orderQueue } from '../services/order-queue.service';
import { orderRepository } from '../database/order.repository';
import { OrderSubmission } from '../types/order.types';

const fastify = Fastify({
  logger: logger as any,
  requestIdHeader: 'x-request-id',
  disableRequestLogging: false,
});

// Register WebSocket plugin
fastify.register(websocketPlugin);

// Validation schema for order submission
const orderSubmissionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  orderType: z.enum(['market', 'limit', 'sniper']),
  tokenIn: z.string().min(1, 'Token in is required'),
  tokenOut: z.string().min(1, 'Token out is required'),
  amountIn: z.number().positive('Amount must be positive'),
  slippage: z.number().min(0).max(1).optional().default(0.01),
  targetPrice: z.number().positive().optional(),
});

// Health check endpoint
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

// Get order by ID
fastify.get<{ Params: { orderId: string } }>('/api/orders/:orderId', async (request, reply) => {
  const { orderId } = request.params;

  const order = await orderRepository.getOrder(orderId);

  if (!order) {
    return reply.code(404).send({ error: 'Order not found' });
  }

  return order;
});

// Get order history for user
fastify.get<{ Querystring: { userId: string; limit?: string } }>(
  '/api/orders',
  async (request, reply) => {
    const { userId, limit } = request.query;

    if (!userId) {
      return reply.code(400).send({ error: 'userId query parameter is required' });
    }

    const orders = await orderRepository.getOrdersByUser(
      userId,
      limit ? parseInt(limit) : 50
    );

    return { orders, count: orders.length };
  }
);

// WebSocket endpoint for order execution with live updates
fastify.register(async (fastify) => {
  fastify.get(
    '/api/orders/execute',
    { websocket: true },
    (connection, _request) => {
      logger.info('WebSocket connection established');

      // Send welcome message
      connection.socket.send(
        JSON.stringify({
          type: 'connected',
          message: 'WebSocket connection established. Send order to execute.',
        })
      );

      // Handle incoming messages
      connection.socket.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());

          // Validate order submission
          const validatedData = orderSubmissionSchema.parse(data);

          // Only support market orders for now
          if (validatedData.orderType !== 'market') {
            connection.socket.send(
              JSON.stringify({
                type: 'error',
                error: 'Only market orders are supported in this implementation',
              })
            );
            return;
          }

          // Create order
          const orderId = await orderExecutionService.createOrder(
            validatedData as OrderSubmission
          );

          // Send initial response with orderId
          connection.socket.send(
            JSON.stringify({
              type: 'orderCreated',
              orderId,
              status: 'pending',
              timestamp: new Date(),
            })
          );

          // Set up listener for this order's updates
          const updateListener = (update: any) => {
            if (update.orderId === orderId) {
              connection.socket.send(JSON.stringify({
                type: 'statusUpdate',
                ...update,
              }));
            }
          };

          orderExecutionService.on('orderUpdate', updateListener);

          // Add order to queue for processing
          await orderQueue.add(`order-${orderId}`, {
            ...validatedData,
            orderId,
          });

          // Clean up listener when connection closes
          connection.socket.on('close', () => {
            orderExecutionService.removeListener('orderUpdate', updateListener);
            logger.info({ orderId }, 'WebSocket connection closed');
          });
        } catch (error: any) {
          logger.error({ error: error.message }, 'Error processing order');
          connection.socket.send(
            JSON.stringify({
              type: 'error',
              error: error.message || 'Invalid order submission',
            })
          );
        }
      });

      connection.socket.on('error', (error: Error) => {
        logger.error({ error }, 'WebSocket error');
      });
    }
  );
});

// POST endpoint for order submission (alternative to WebSocket)
fastify.post<{ Body: OrderSubmission }>('/api/orders/submit', async (request, reply) => {
  try {
    const validatedData = orderSubmissionSchema.parse(request.body);

    if (validatedData.orderType !== 'market') {
      return reply.code(400).send({
        error: 'Only market orders are supported in this implementation',
      });
    }

    const orderId = await orderExecutionService.createOrder(validatedData as OrderSubmission);

    // Add to queue
    await orderQueue.add(`order-${orderId}`, {
      ...validatedData,
      orderId,
    });

    return reply.code(202).send({
      orderId,
      status: 'pending',
      message: 'Order queued for execution',
      websocketUrl: `/api/orders/execute?orderId=${orderId}`,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error submitting order');
    return reply.code(400).send({
      error: error.message || 'Invalid order submission',
    });
  }
});

// Queue statistics endpoint
fastify.get('/api/queue/stats', async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    orderQueue.getWaitingCount(),
    orderQueue.getActiveCount(),
    orderQueue.getCompletedCount(),
    orderQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active,
  };
});

export { fastify };
