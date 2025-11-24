import { DexQuote } from '../types/order.types';
import { config } from '../config';
import { sleep, generateTxHash } from '../utils/helpers';
import { logger } from '../utils/logger';

export class MockDexRouter {
  private basePrice = 0.00015; // Base price for token pair (e.g., SOL/USDC)

  /**
   * Get quote from Raydium DEX
   * Simulates network delay and price variance
   */
  async getRaydiumQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: number
  ): Promise<DexQuote> {
    // Simulate network delay (150-250ms)
    await sleep(150 + Math.random() * 100);

    // Price variance: 0.98 to 1.02 of base price (±2%)
    const priceVariance = 0.98 + Math.random() * 0.04;
    const price = this.basePrice * priceVariance;
    const amountOut = amountIn * price;

    // Raydium typically has 0.25% fee
    const fee = 0.0025;
    const amountOutAfterFee = amountOut * (1 - fee);

    logger.debug({
      dex: 'raydium',
      tokenIn,
      tokenOut,
      amountIn,
      price,
      amountOut: amountOutAfterFee,
      fee,
    }, 'Raydium quote fetched');

    return {
      dex: 'raydium',
      price,
      amountOut: amountOutAfterFee,
      fee,
      estimatedGas: 0.00001, // ~0.00001 SOL
    };
  }

  /**
   * Get quote from Meteora DEX
   * Simulates network delay and different price variance
   */
  async getMeteorQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: number
  ): Promise<DexQuote> {
    // Simulate network delay (150-250ms)
    await sleep(150 + Math.random() * 100);

    // Price variance: 0.97 to 1.03 of base price (±3%, wider than Raydium)
    const priceVariance = 0.97 + Math.random() * 0.06;
    const price = this.basePrice * priceVariance;
    const amountOut = amountIn * price;

    // Meteora typically has 0.2% fee (lower than Raydium)
    const fee = 0.002;
    const amountOutAfterFee = amountOut * (1 - fee);

    logger.debug({
      dex: 'meteora',
      tokenIn,
      tokenOut,
      amountIn,
      price,
      amountOut: amountOutAfterFee,
      fee,
    }, 'Meteora quote fetched');

    return {
      dex: 'meteora',
      price,
      amountOut: amountOutAfterFee,
      fee,
      estimatedGas: 0.000008, // Slightly lower gas
    };
  }

  /**
   * Get quotes from both DEXs and return the best one
   */
  async getBestQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: number
  ): Promise<{ best: DexQuote; all: DexQuote[] }> {
    // Fetch quotes from both DEXs in parallel
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amountIn),
      this.getMeteorQuote(tokenIn, tokenOut, amountIn),
    ]);

    const all = [raydiumQuote, meteoraQuote];

    // Select best quote based on net amount out (after fees and gas)
    const best =
      raydiumQuote.amountOut - raydiumQuote.estimatedGas >
      meteoraQuote.amountOut - meteoraQuote.estimatedGas
        ? raydiumQuote
        : meteoraQuote;

    logger.info({
      raydiumPrice: raydiumQuote.price,
      raydiumAmountOut: raydiumQuote.amountOut,
      meteoraPrice: meteoraQuote.price,
      meteoraAmountOut: meteoraQuote.amountOut,
      selectedDex: best.dex,
    }, 'DEX routing completed');

    return { best, all };
  }

  /**
   * Execute swap on selected DEX
   * Simulates transaction execution time (2-3 seconds)
   */
  async executeSwap(
    dex: string,
    _tokenIn: string,
    _tokenOut: string,
    amountIn: number,
    quote: DexQuote
  ): Promise<{
    txHash: string;
    executedPrice: number;
    amountOut: number;
    timestamp: Date;
  }> {
    // Simulate execution time from config
    const executionTime =
      config.dex.minExecutionDelay +
      Math.random() * (config.dex.maxExecutionDelay - config.dex.minExecutionDelay);

    logger.debug({ dex, executionTime }, 'Starting swap execution');

    await sleep(executionTime);

    // Simulate potential slippage during execution (±0.5%)
    const slippageVariance = 0.995 + Math.random() * 0.01;
    const finalAmountOut = quote.amountOut * slippageVariance;
    const finalPrice = amountIn / finalAmountOut;

    const txHash = generateTxHash();

    logger.info({
      dex,
      txHash,
      executedPrice: finalPrice,
      amountOut: finalAmountOut,
    }, 'Swap executed successfully');

    return {
      txHash,
      executedPrice: finalPrice,
      amountOut: finalAmountOut,
      timestamp: new Date(),
    };
  }

  /**
   * Simulate transaction failure (for testing retry logic)
   * Returns true if transaction should fail (5% chance)
   */
  shouldSimulateFailure(): boolean {
    return Math.random() < 0.05;
  }
}

export const mockDexRouter = new MockDexRouter();
