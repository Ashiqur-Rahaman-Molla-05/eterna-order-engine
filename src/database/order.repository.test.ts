import { OrderRepository } from '../database/order.repository';
import { OrderSubmission } from '../types/order.types';
import { database } from '../database';

// Mock database
jest.mock('../database', () => ({
  database: {
    query: jest.fn(),
  },
}));

describe('OrderRepository', () => {
  let repository: OrderRepository;
  const mockQuery = database.query as jest.MockedFunction<typeof database.query>;

  beforeEach(() => {
    repository = new OrderRepository();
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order and return mapped Order object', async () => {
      const submission: OrderSubmission & { id: string } = {
        id: 'ORD-123',
        userId: 'user1',
        orderType: 'market',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 100,
        slippage: 0.01,
      };

      const mockRow = {
        id: submission.id,
        user_id: submission.userId,
        order_type: submission.orderType,
        token_in: submission.tokenIn,
        token_out: submission.tokenOut,
        amount_in: submission.amountIn,
        slippage: submission.slippage,
        status: 'pending',
        dex_used: null,
        executed_price: null,
        amount_out: null,
        tx_hash: null,
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: null,
      };

      mockQuery.mockResolvedValueOnce([mockRow]);

      const order = await repository.createOrder(submission);

      expect(order).toHaveProperty('id', submission.id);
      expect(order).toHaveProperty('userId', submission.userId);
      expect(order).toHaveProperty('orderType', submission.orderType);
      expect(order).toHaveProperty('status', 'pending');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status and additional data', async () => {
      const orderId = 'ORD-123';
      const status = 'confirmed';
      const additionalData = {
        dexUsed: 'raydium',
        executedPrice: 0.00015,
        amountOut: 15,
        txHash: 'abc123',
      };

      const mockRow = {
        id: orderId,
        user_id: 'user1',
        order_type: 'market',
        token_in: 'SOL',
        token_out: 'USDC',
        amount_in: 100,
        slippage: 0.01,
        status,
        dex_used: additionalData.dexUsed,
        executed_price: additionalData.executedPrice,
        amount_out: additionalData.amountOut,
        tx_hash: additionalData.txHash,
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: new Date(),
      };

      // Mock both the update query and the status history insert
      mockQuery.mockResolvedValueOnce([mockRow]); // Update query
      mockQuery.mockResolvedValueOnce([]); // Status history insert

      const order = await repository.updateOrderStatus(orderId, status, additionalData);

      expect(order).toHaveProperty('status', status);
      expect(order).toHaveProperty('dexUsed', additionalData.dexUsed);
      expect(order).toHaveProperty('executedPrice', additionalData.executedPrice);
      expect(order).toHaveProperty('txHash', additionalData.txHash);
      expect(mockQuery).toHaveBeenCalledTimes(2); // Update + history
    });
  });

  describe('getOrder', () => {
    it('should return order when found', async () => {
      const orderId = 'ORD-123';
      const mockRow = {
        id: orderId,
        user_id: 'user1',
        order_type: 'market',
        token_in: 'SOL',
        token_out: 'USDC',
        amount_in: 100,
        slippage: 0.01,
        status: 'pending',
        dex_used: null,
        executed_price: null,
        amount_out: null,
        tx_hash: null,
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: null,
      };

      mockQuery.mockResolvedValueOnce([mockRow]);

      const order = await repository.getOrder(orderId);

      expect(order).not.toBeNull();
      expect(order?.id).toBe(orderId);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [orderId]);
    });

    it('should return null when order not found', async () => {
      mockQuery.mockResolvedValueOnce([]);

      const order = await repository.getOrder('nonexistent');

      expect(order).toBeNull();
    });
  });

  describe('getOrdersByUser', () => {
    it('should return array of orders for user', async () => {
      const userId = 'user1';
      const mockRows = [
        {
          id: 'ORD-1',
          user_id: userId,
          order_type: 'market',
          token_in: 'SOL',
          token_out: 'USDC',
          amount_in: 100,
          slippage: 0.01,
          status: 'confirmed',
          dex_used: 'raydium',
          executed_price: 0.00015,
          amount_out: 15,
          tx_hash: 'abc123',
          error_message: null,
          created_at: new Date(),
          updated_at: new Date(),
          completed_at: new Date(),
        },
        {
          id: 'ORD-2',
          user_id: userId,
          order_type: 'market',
          token_in: 'SOL',
          token_out: 'USDC',
          amount_in: 50,
          slippage: 0.01,
          status: 'pending',
          dex_used: null,
          executed_price: null,
          amount_out: null,
          tx_hash: null,
          error_message: null,
          created_at: new Date(),
          updated_at: new Date(),
          completed_at: null,
        },
      ];

      mockQuery.mockResolvedValueOnce(mockRows);

      const orders = await repository.getOrdersByUser(userId);

      expect(orders).toHaveLength(2);
      expect(orders[0].userId).toBe(userId);
      expect(orders[1].userId).toBe(userId);
    });

    it('should respect limit parameter', async () => {
      const userId = 'user1';
      mockQuery.mockResolvedValueOnce([]);

      await repository.getOrdersByUser(userId, 10);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [userId, 10]);
    });
  });
});
