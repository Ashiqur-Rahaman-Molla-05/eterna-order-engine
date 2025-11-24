import { randomBytes } from 'crypto';

export function generateOrderId(): string {
  return `ORD-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function generateTxHash(): string {
  return randomBytes(32).toString('hex');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculatePriceImpact(
  amountIn: number,
  amountOut: number,
  marketPrice: number
): number {
  const executionPrice = amountOut / amountIn;
  return Math.abs((executionPrice - marketPrice) / marketPrice);
}

export function isWithinSlippage(
  expectedAmount: number,
  actualAmount: number,
  slippage: number
): boolean {
  const minAmount = expectedAmount * (1 - slippage);
  return actualAmount >= minAmount;
}
