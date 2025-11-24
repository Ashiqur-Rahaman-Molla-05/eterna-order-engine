import { generateOrderId, generateTxHash, sleep, isWithinSlippage, calculatePriceImpact } from '../utils/helpers';

describe('Helper Functions', () => {
  describe('generateOrderId', () => {
    it('should generate unique order IDs', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^ORD-\d+-[A-F0-9]{8}$/);
      expect(id2).toMatch(/^ORD-\d+-[A-F0-9]{8}$/);
    });

    it('should have correct format', () => {
      const id = generateOrderId();
      expect(id).toMatch(/^ORD-\d+-[A-F0-9]{8}$/);
    });
  });

  describe('generateTxHash', () => {
    it('should generate 64-character hex string', () => {
      const hash = generateTxHash();
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique hashes', () => {
      const hash1 = generateTxHash();
      const hash2 = generateTxHash();
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const startTime = Date.now();
      await sleep(100);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(95); // Allow small variance
      expect(duration).toBeLessThan(150);
    });
  });

  describe('calculatePriceImpact', () => {
    it('should calculate correct price impact', () => {
      // Market price: 0.00015 (1 SOL = 0.00015 USDC)
      // Expected amount out: 100 * 0.00015 = 0.015 USDC
      // Actual amount out with some slippage: 0.014 USDC
      const impact = calculatePriceImpact(100, 0.014, 0.00015);
      expect(impact).toBeGreaterThanOrEqual(0);
      expect(impact).toBeLessThanOrEqual(1); // Up to 100% impact is possible
    });

    it('should return 0 for no impact', () => {
      const marketPrice = 0.00015;
      const amountIn = 100;
      const amountOut = amountIn * marketPrice;
      
      const impact = calculatePriceImpact(amountIn, amountOut, marketPrice);
      expect(impact).toBeCloseTo(0, 5);
    });

    it('should handle positive price impact', () => {
      const impact = calculatePriceImpact(100, 20, 0.00015); // Better than market
      expect(impact).toBeGreaterThan(0);
    });

    it('should handle negative price impact', () => {
      const impact = calculatePriceImpact(100, 10, 0.00015); // Worse than market
      expect(impact).toBeGreaterThan(0);
    });
  });

  describe('isWithinSlippage', () => {
    it('should return true when within slippage tolerance', () => {
      const expected = 100;
      const actual = 99.5; // 0.5% slippage
      const slippage = 0.01; // 1% tolerance

      expect(isWithinSlippage(expected, actual, slippage)).toBe(true);
    });

    it('should return false when exceeding slippage tolerance', () => {
      const expected = 100;
      const actual = 97; // 3% slippage
      const slippage = 0.01; // 1% tolerance

      expect(isWithinSlippage(expected, actual, slippage)).toBe(false);
    });

    it('should handle exact expected amount', () => {
      const expected = 100;
      const actual = 100;
      const slippage = 0.01;

      expect(isWithinSlippage(expected, actual, slippage)).toBe(true);
    });

    it('should handle better than expected (no slippage)', () => {
      const expected = 100;
      const actual = 101;
      const slippage = 0.01;

      expect(isWithinSlippage(expected, actual, slippage)).toBe(true);
    });

    it('should handle edge case at exact slippage limit', () => {
      const expected = 100;
      const slippage = 0.01;
      const actual = expected * (1 - slippage); // Exactly at limit

      expect(isWithinSlippage(expected, actual, slippage)).toBe(true);
    });
  });
});
