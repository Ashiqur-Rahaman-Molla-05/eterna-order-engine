#!/usr/bin/env node

/**
 * Quick Test Script
 * Run this to test all core functionality
 */

const http = require('http');
const { spawn } = require('child_process');

console.log('🚀 Order Execution Engine - Quick Test\n');
console.log('This script will test core functionality.\n');

const baseURL = 'http://localhost:3000';
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  return fn()
    .then(() => {
      console.log(`✅ ${name}`);
      testsPassed++;
    })
    .catch((err) => {
      console.log(`❌ ${name}: ${err.message}`);
      testsFailed++;
    });
}

function httpRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseURL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: data ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      } : {}
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('Starting tests...\n');

  // Test 1: Health Check
  await test('Health check', async () => {
    const res = await httpRequest('/health');
    if (res.status !== 'ok') throw new Error('Health check failed');
  });

  // Test 2: Submit Order
  let orderId;
  await test('Submit order via API', async () => {
    const order = {
      userId: 'test-user',
      orderType: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 100,
      slippage: 0.01
    };
    const res = await httpRequest('/api/orders/submit', 'POST', JSON.stringify(order));
    if (!res.orderId) throw new Error('No orderId returned');
    orderId = res.orderId;
    console.log(`   Order ID: ${orderId}`);
  });

  // Wait for order to process
  console.log('\n⏳ Waiting 5 seconds for order to process...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 3: Get Order Status
  await test('Get order by ID', async () => {
    const res = await httpRequest(`/api/orders/${orderId}`);
    if (res.id !== orderId) throw new Error('Order ID mismatch');
    console.log(`   Status: ${res.status}`);
    if (res.status === 'confirmed') {
      console.log(`   DEX: ${res.dexUsed}`);
      console.log(`   Price: ${res.executedPrice}`);
      console.log(`   Tx: ${res.txHash?.substring(0, 16)}...`);
    }
  });

  // Test 4: Get User Orders
  await test('Get user orders', async () => {
    const res = await httpRequest('/api/orders?userId=test-user');
    if (!res.orders || !Array.isArray(res.orders)) {
      throw new Error('Invalid orders response');
    }
    console.log(`   Found ${res.count} orders`);
  });

  // Test 5: Queue Statistics
  await test('Get queue statistics', async () => {
    const res = await httpRequest('/api/queue/stats');
    if (typeof res.completed !== 'number') {
      throw new Error('Invalid stats response');
    }
    console.log(`   Active: ${res.active}, Completed: ${res.completed}, Failed: ${res.failed}`);
  });

  // Test 6: Submit Multiple Orders
  console.log('\n📊 Submitting 3 concurrent orders...\n');
  const orderPromises = [];
  for (let i = 0; i < 3; i++) {
    const order = {
      userId: `concurrent-user-${i}`,
      orderType: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 50 + i * 25,
      slippage: 0.01
    };
    orderPromises.push(
      httpRequest('/api/orders/submit', 'POST', JSON.stringify(order))
        .then(res => {
          console.log(`   ✓ Order ${i + 1} submitted: ${res.orderId}`);
          return res.orderId;
        })
    );
  }

  const concurrentOrderIds = await Promise.all(orderPromises);
  testsPassed++; // Count as one test

  // Wait for concurrent orders
  console.log('\n⏳ Waiting 8 seconds for concurrent orders to process...\n');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Check concurrent orders
  for (const id of concurrentOrderIds) {
    await test(`Concurrent order ${id.substring(0, 16)}...`, async () => {
      const res = await httpRequest(`/api/orders/${id}`);
      if (!['confirmed', 'failed', 'submitted'].includes(res.status)) {
        throw new Error(`Unexpected status: ${res.status}`);
      }
    });
  }

  // Final stats
  console.log('\n' + '='.repeat(50));
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('='.repeat(50));

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! System is working correctly.\n');
    console.log('Next steps:');
    console.log('1. Test WebSocket: wscat -c ws://localhost:3000/api/orders/execute');
    console.log('2. Import Postman collection: postman_collection.json');
    console.log('3. Record demo video following VIDEO_SCRIPT.md');
    console.log('4. Deploy to Render/Railway');
    console.log('5. Submit your deliverables!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

// Check if server is running
console.log('Checking if server is running...\n');

httpRequest('/health')
  .then(() => {
    console.log('✅ Server is running\n');
    return runTests();
  })
  .catch((err) => {
    console.log('❌ Server is not running or not accessible');
    console.log(`   Error: ${err.message}\n`);
    console.log('Please start the server first:');
    console.log('   npm run dev\n');
    process.exit(1);
  });
