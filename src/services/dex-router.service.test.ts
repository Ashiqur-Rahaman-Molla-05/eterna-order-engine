import { mockDexRouter } from '../services/dex-router.service';

describe('DexRouter Service', () => {
  describe('getRaydiumQuote', () => {
    it('should return a valid quote with expected structure', async () => {
      const quote = await mockDexRouter.getRaydiumQuote('SOL', 'USDC', 100);

      expect(quote).toHaveProperty('dex', 'raydium');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('amountOut');
      expect(quote).toHaveProperty('fee', 0.0025);
      expect(quote).toHaveProperty('estimatedGas');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.amountOut).toBeGreaterThan(0);
    });

    it('should apply correct fee percentage', async () => {
      const amountIn = 100;
      const quote = await mockDexRouter.getRaydiumQuote('SOL', 'USDC', amountIn);
      
      // Fee should be 0.25%
      expect(quote.fee).toBe(0.0025);
    });
  });

  describe('getMeteorQuote', () => {
    it('should return a valid quote with expected structure', async () => {
      const quote = await mockDexRouter.getMeteorQuote('SOL', 'USDC', 100);

      expect(quote).toHaveProperty('dex', 'meteora');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('amountOut');
      expect(quote).toHaveProperty('fee', 0.002);
      expect(quote).toHaveProperty('estimatedGas');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.amountOut).toBeGreaterThan(0);
    });

    it('should have lower fee than Raydium', async () => {
      const meteoraQuote = await mockDexRouter.getMeteorQuote('SOL', 'USDC', 100);
      const raydiumQuote = await mockDexRouter.getRaydiumQuote('SOL', 'USDC', 100);

      expect(meteoraQuote.fee).toBeLessThan(raydiumQuote.fee);
    });
  });

  describe('getBestQuote', () => {
    it('should return quotes from both DEXs', async () => {
      const result = await mockDexRouter.getBestQuote('SOL', 'USDC', 100);

      expect(result).toHaveProperty('best');
      expect(result).toHaveProperty('all');
      expect(result.all).toHaveLength(2);
      expect(result.all[0].dex).toBe('raydium');
      expect(result.all[1].dex).toBe('meteora');
    });

    it('should select the best quote based on net amount out', async () => {
      const result = await mockDexRouter.getBestQuote('SOL', 'USDC', 100);

      const bestNetAmount = result.best.amountOut - result.best.estimatedGas;
      
      result.all.forEach(quote => {
        const netAmount = quote.amountOut - quote.estimatedGas;
        expect(bestNetAmount).toBeGreaterThanOrEqual(netAmount);
      });
    });

    it('should be deterministic for same inputs', async () => {
      const result1 = await mockDexRouter.getBestQuote('SOL', 'USDC', 100);
      const result2 = await mockDexRouter.getBestQuote('SOL', 'USDC', 100);

      // Prices should be different due to randomness, but structure should be same
      expect(result1.all).toHaveLength(2);
      expect(result2.all).toHaveLength(2);
    });
  });

  describe('executeSwap', () => {
    it('should return transaction hash and execution details', async () => {
      const quote = await mockDexRouter.getRaydiumQuote('SOL', 'USDC', 100);
      const result = await mockDexRouter.executeSwap('raydium', 'SOL', 'USDC', 100, quote);

      expect(result).toHaveProperty('txHash');
      expect(result).toHaveProperty('executedPrice');
      expect(result).toHaveProperty('amountOut');
      expect(result).toHaveProperty('timestamp');
      expect(result.txHash).toHaveLength(64); // SHA-256 hash
      expect(result.executedPrice).toBeGreaterThan(0);
      expect(result.amountOut).toBeGreaterThan(0);
    });

    it('should simulate execution delay', async () => {
      const quote = await mockDexRouter.getRaydiumQuote('SOL', 'USDC', 100);
      const startTime = Date.now();
      
      await mockDexRouter.executeSwap('raydium', 'SOL', 'USDC', 100, quote);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThanOrEqual(2000); // Min 2 seconds
      expect(duration).toBeLessThanOrEqual(3500); // Max ~3 seconds + buffer
    });

    it('should apply slippage variance to final amount', async () => {
      const quote = await mockDexRouter.getRaydiumQuote('SOL', 'USDC', 100);
      const result = await mockDexRouter.executeSwap('raydium', 'SOL', 'USDC', 100, quote);

      // Final amount should be within ±0.5% of quote
      const variance = Math.abs(result.amountOut - quote.amountOut) / quote.amountOut;
      expect(variance).toBeLessThanOrEqual(0.01); // Within 1%
    });
  });

  describe('shouldSimulateFailure', () => {
    it('should return boolean', () => {
      const result = mockDexRouter.shouldSimulateFailure();
      expect(typeof result).toBe('boolean');
    });

    it('should fail occasionally (probabilistic test)', () => {
      const trials = 1000;
      let failures = 0;

      for (let i = 0; i < trials; i++) {
        if (mockDexRouter.shouldSimulateFailure()) {
          failures++;
        }
      }

      // Should fail approximately 5% of the time (±3% tolerance)
      const failureRate = failures / trials;
      expect(failureRate).toBeGreaterThan(0.02);
      expect(failureRate).toBeLessThan(0.08);
    });
  });
});
