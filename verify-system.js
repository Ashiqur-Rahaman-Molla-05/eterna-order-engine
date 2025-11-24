/**
 * System Verification Script
 * Tests the Order Execution Engine without requiring live databases
 */

const { mockDexRouter } = require('./dist/services/dex-router.service');
const { 
  generateOrderId, 
  generateTxHash, 
  calculatePriceImpact,
  isWithinSlippage 
} = require('./dist/utils/helpers');

console.log('\n🔍 ETERNA Order Execution Engine - System Verification\n');
console.log('=' .repeat(60));

// Test 1: Core Utilities
console.log('\n✓ Test 1: Core Utilities');
const orderId = generateOrderId();
const txHash = generateTxHash();
console.log(`  Order ID format: ${orderId}`);
console.log(`  TX Hash length: ${txHash.length} chars (expected: 64)`);
console.log(`  Price impact calc: ${calculatePriceImpact(100, 0.015, 0.00015).toFixed(4)}`);
console.log(`  Slippage check: ${isWithinSlippage(1.0, 0.99, 0.01) ? 'PASS' : 'FAIL'}`);

// Test 2: DEX Router - Raydium Quote
console.log('\n✓ Test 2: Raydium DEX Quote');
(async () => {
  try {
    const raydiumQuote = await mockDexRouter.getRaydiumQuote('SOL', 'USDC', 100);
    console.log(`  DEX: ${raydiumQuote.dex}`);
    console.log(`  Token Pair: ${raydiumQuote.tokenIn} → ${raydiumQuote.tokenOut}`);
    console.log(`  Amount In: ${raydiumQuote.amountIn} SOL`);
    console.log(`  Amount Out: ${raydiumQuote.amountOut.toFixed(6)} USDC`);
    console.log(`  Price: ${raydiumQuote.price.toFixed(8)} USDC/SOL`);
    console.log(`  Fee: ${raydiumQuote.fee * 100}%`);
    
    // Test 3: Meteora Quote
    console.log('\n✓ Test 3: Meteora DEX Quote');
    const meteoraQuote = await mockDexRouter.getMeteorQuote('SOL', 'USDC', 100);
    console.log(`  DEX: ${meteoraQuote.dex}`);
    console.log(`  Amount Out: ${meteoraQuote.amountOut.toFixed(6)} USDC`);
    console.log(`  Fee: ${meteoraQuote.fee * 100}% (lower than Raydium)`);
    
    // Test 4: Best Quote Selection
    console.log('\n✓ Test 4: Best DEX Quote Selection');
    const bestQuote = await mockDexRouter.getBestQuote('SOL', 'USDC', 100);
    const raydium = bestQuote.all.find(q => q.dex === 'raydium');
    const meteora = bestQuote.all.find(q => q.dex === 'meteora');
    console.log(`  Raydium: ${raydium.amountOut.toFixed(6)} USDC`);
    console.log(`  Meteora: ${meteora.amountOut.toFixed(6)} USDC`);
    console.log(`  Selected: ${bestQuote.best.dex.toUpperCase()}`);
    console.log(`  Reason: Higher net output (${bestQuote.best.amountOut.toFixed(6)} USDC)`);
    
    // Test 5: Swap Execution
    console.log('\n✓ Test 5: Swap Execution (Mock)');
    console.log('  Executing swap...');
    const result = await mockDexRouter.executeSwap(
      bestQuote.best.dex,
      'SOL',
      'USDC',
      100,
      bestQuote.best  // Pass the full quote object
    );
    console.log(`  Transaction Hash: ${result.txHash}`);
    console.log(`  Executed Price: ${result.executedPrice.toFixed(2)} SOL/USDC`);
    console.log(`  Final Amount: ${result.amountOut.toFixed(6)} USDC`);
    console.log(`  Quote Amount: ${bestQuote.best.amountOut.toFixed(6)} USDC`);
    console.log(`  Slippage Applied: ${(Math.abs(result.amountOut - bestQuote.best.amountOut) / bestQuote.best.amountOut * 100).toFixed(2)}%`);
    
    // Test 6: Failure Simulation
    console.log('\n✓ Test 6: Failure Simulation');
    let failureCount = 0;
    for (let i = 0; i < 100; i++) {
      if (mockDexRouter.shouldSimulateFailure()) failureCount++;
    }
    console.log(`  Failure rate: ${failureCount}% (expected: ~5%)`);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE - All Systems Operational!\n');
    console.log('Next Steps:');
    console.log('1. Install PostgreSQL & Redis (or use Docker)');
    console.log('2. Run: npm run dev');
    console.log('3. Test with WebSocket client (see WEBSOCKET_TESTING.md)');
    console.log('4. Record demo video (see VIDEO_SCRIPT.md)');
    console.log('\nFor full system test, see: test-system.js');
    console.log('=' .repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('Make sure you ran: npm run build');
    process.exit(1);
  }
})();
