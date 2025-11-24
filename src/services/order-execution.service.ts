import { OrderSubmission, OrderStatus, WebSocketMessage } from '../types/order.types';
import { orderRepository } from '../database/order.repository';
import { mockDexRouter } from './dex-router.service';
import { logger } from '../utils/logger';
import { generateOrderId, isWithinSlippage } from '../utils/helpers';
import { EventEmitter } from 'events';

class OrderExecutionService extends EventEmitter {
  /**
   * Execute a market order with DEX routing
   */
  async executeOrder(orderId: string, submission: OrderSubmission): Promise<void> {
    try {
      // Step 1: Update status to "routing"
      await this.updateStatus(orderId, 'routing');

      // Step 2: Fetch quotes from both DEXs
      const { best, all } = await mockDexRouter.getBestQuote(
        submission.tokenIn,
        submission.tokenOut,
        submission.amountIn
      );

      this.emitWebSocketUpdate(orderId, 'routing', {
        quotes: all,
      });

      logger.info(
        {
          orderId,
          selectedDex: best.dex,
          price: best.price,
          amountOut: best.amountOut,
        },
        'Best DEX selected'
      );

      // Step 3: Update status to "building"
      await this.updateStatus(orderId, 'building', {
        dexUsed: best.dex,
      });

      // Simulate transaction building (small delay)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 4: Update status to "submitted"
      await this.updateStatus(orderId, 'submitted', {
        dexUsed: best.dex,
      });

      // Check if we should simulate failure (for testing)
      if (mockDexRouter.shouldSimulateFailure()) {
        throw new Error('Simulated transaction failure');
      }

      // Step 5: Execute swap on selected DEX
      const result = await mockDexRouter.executeSwap(
        best.dex,
        submission.tokenIn,
        submission.tokenOut,
        submission.amountIn,
        best
      );

      // Step 6: Verify slippage tolerance
      if (!isWithinSlippage(best.amountOut, result.amountOut, submission.slippage || 0.01)) {
        throw new Error(
          `Slippage exceeded: expected ${best.amountOut}, got ${result.amountOut}`
        );
      }

      // Step 7: Update status to "confirmed"
      await this.updateStatus(orderId, 'confirmed', {
        dexUsed: best.dex,
        executedPrice: result.executedPrice,
        amountOut: result.amountOut,
        txHash: result.txHash,
      });

      this.emitWebSocketUpdate(orderId, 'confirmed', {
        dexUsed: best.dex,
        executedPrice: result.executedPrice,
        amountOut: result.amountOut,
        txHash: result.txHash,
      });

      logger.info(
        {
          orderId,
          txHash: result.txHash,
          dex: best.dex,
          executedPrice: result.executedPrice,
          amountOut: result.amountOut,
        },
        'Order executed successfully'
      );
    } catch (error: any) {
      logger.error({ orderId, error: error.message }, 'Order execution failed');
      throw error; // Re-throw for retry logic
    }
  }

  /**
   * Handle final failure after all retries
   */
  async handleFinalFailure(orderId: string, errorMessage: string): Promise<void> {
    await this.updateStatus(orderId, 'failed', {
      errorMessage,
    });

    this.emitWebSocketUpdate(orderId, 'failed', {
      error: errorMessage,
    });

    logger.error({ orderId, errorMessage }, 'Order permanently failed');
  }

  /**
   * Update order status in database
   */
  private async updateStatus(
    orderId: string,
    status: OrderStatus,
    additionalData?: any
  ): Promise<void> {
    await orderRepository.updateOrderStatus(orderId, status, additionalData);
    this.emitWebSocketUpdate(orderId, status, additionalData);
  }

  /**
   * Emit WebSocket update
   */
  private emitWebSocketUpdate(
    orderId: string,
    status: OrderStatus,
    data?: any
  ): void {
    const message: WebSocketMessage = {
      orderId,
      status,
      timestamp: new Date(),
      data,
    };

    // Emit event that WebSocket handler will listen to
    this.emit('orderUpdate', message);

    logger.debug({ orderId, status }, 'WebSocket update emitted');
  }

  /**
   * Create and queue a new order
   */
  async createOrder(submission: OrderSubmission): Promise<string> {
    const orderId = generateOrderId();

    // Create order in database
    await orderRepository.createOrder({
      ...submission,
      id: orderId,
    });

    logger.info({ orderId, submission }, 'Order created');

    return orderId;
  }
}

export const orderExecutionService = new OrderExecutionService();
