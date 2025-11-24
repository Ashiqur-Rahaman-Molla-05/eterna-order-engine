export interface Order {
  id: string;
  userId: string;
  orderType: 'market' | 'limit' | 'sniper';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  slippage: number;
  status: OrderStatus;
  dexUsed?: string;
  executedPrice?: number;
  amountOut?: number;
  txHash?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type OrderStatus =
  | 'pending'
  | 'routing'
  | 'building'
  | 'submitted'
  | 'confirmed'
  | 'failed';

export interface OrderSubmission {
  userId: string;
  orderType: 'market' | 'limit' | 'sniper';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  slippage?: number;
  targetPrice?: number; // For limit orders
}

export interface DexQuote {
  dex: 'raydium' | 'meteora';
  price: number;
  amountOut: number;
  fee: number;
  estimatedGas: number;
}

export interface ExecutionResult {
  txHash: string;
  executedPrice: number;
  amountOut: number;
  dex: string;
  timestamp: Date;
}

export interface WebSocketMessage {
  orderId: string;
  status: OrderStatus;
  timestamp: Date;
  data?: {
    dexUsed?: string;
    executedPrice?: number;
    amountOut?: number;
    txHash?: string;
    error?: string;
    quotes?: DexQuote[];
  };
}
