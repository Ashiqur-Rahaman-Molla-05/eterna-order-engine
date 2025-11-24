import { database } from './index';
import { Order, OrderStatus, OrderSubmission } from '../types/order.types';

export class OrderRepository {
  async createOrder(submission: OrderSubmission & { id: string }): Promise<Order> {
    const query = `
      INSERT INTO orders (
        id, user_id, order_type, token_in, token_out, 
        amount_in, slippage, status, target_price, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *;
    `;

    const values = [
      submission.id,
      submission.userId,
      submission.orderType,
      submission.tokenIn,
      submission.tokenOut,
      submission.amountIn,
      submission.slippage || 0.01,
      'pending',
      submission.targetPrice || null,
    ];

    const rows = await database.query<any>(query, values);
    return this.mapRowToOrder(rows[0]);
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    additionalData?: Partial<Order>
  ): Promise<Order> {
    const updates: string[] = ['status = $2', 'updated_at = NOW()'];
    const values: any[] = [orderId, status];
    let paramIndex = 3;

    if (additionalData?.dexUsed) {
      updates.push(`dex_used = $${paramIndex}`);
      values.push(additionalData.dexUsed);
      paramIndex++;
    }

    if (additionalData?.executedPrice) {
      updates.push(`executed_price = $${paramIndex}`);
      values.push(additionalData.executedPrice);
      paramIndex++;
    }

    if (additionalData?.amountOut) {
      updates.push(`amount_out = $${paramIndex}`);
      values.push(additionalData.amountOut);
      paramIndex++;
    }

    if (additionalData?.txHash) {
      updates.push(`tx_hash = $${paramIndex}`);
      values.push(additionalData.txHash);
      paramIndex++;
    }

    if (additionalData?.errorMessage) {
      updates.push(`error_message = $${paramIndex}`);
      values.push(additionalData.errorMessage);
      paramIndex++;
    }

    if (status === 'confirmed' || status === 'failed') {
      updates.push(`completed_at = NOW()`);
    }

    const query = `
      UPDATE orders 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;

    const rows = await database.query<any>(query, values);
    
    // Log status history
    await this.addStatusHistory(orderId, status, additionalData);
    
    return this.mapRowToOrder(rows[0]);
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const query = 'SELECT * FROM orders WHERE id = $1';
    const rows = await database.query<any>(query, [orderId]);
    return rows.length > 0 ? this.mapRowToOrder(rows[0]) : null;
  }

  async getOrdersByUser(userId: string, limit = 50): Promise<Order[]> {
    const query = `
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const rows = await database.query<any>(query, [userId, limit]);
    return rows.map(this.mapRowToOrder);
  }

  async getOrderStatusHistory(orderId: string): Promise<any[]> {
    const query = `
      SELECT * FROM order_status_history 
      WHERE order_id = $1 
      ORDER BY created_at ASC
    `;
    return await database.query(query, [orderId]);
  }

  private async addStatusHistory(
    orderId: string,
    status: OrderStatus,
    data?: any
  ): Promise<void> {
    const query = `
      INSERT INTO order_status_history (order_id, status, data, created_at)
      VALUES ($1, $2, $3, NOW())
    `;
    await database.query(query, [orderId, status, JSON.stringify(data || {})]);
  }

  private mapRowToOrder(row: any): Order {
    return {
      id: row.id,
      userId: row.user_id,
      orderType: row.order_type,
      tokenIn: row.token_in,
      tokenOut: row.token_out,
      amountIn: parseFloat(row.amount_in),
      slippage: parseFloat(row.slippage),
      status: row.status,
      dexUsed: row.dex_used,
      executedPrice: row.executed_price ? parseFloat(row.executed_price) : undefined,
      amountOut: row.amount_out ? parseFloat(row.amount_out) : undefined,
      txHash: row.tx_hash,
      errorMessage: row.error_message,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
  }
}

export const orderRepository = new OrderRepository();
