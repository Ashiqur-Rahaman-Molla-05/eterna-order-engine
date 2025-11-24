# WebSocket Testing Guide

This guide helps you test the WebSocket functionality of the Order Execution Engine.

## Testing Tools

### 1. Using wscat (CLI)

```bash
# Install wscat globally
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3000/api/orders/execute

# After connection, send order
{"userId":"testuser","orderType":"market","tokenIn":"SOL","tokenOut":"USDC","amountIn":100,"slippage":0.01}
```

### 2. Using Browser Console

```javascript
// Open browser console (F12)
const ws = new WebSocket('ws://localhost:3000/api/orders/execute');

ws.onopen = () => {
  console.log('Connected!');
  
  // Send order
  ws.send(JSON.stringify({
    userId: 'browserUser',
    orderType: 'market',
    tokenIn: 'SOL',
    tokenOut: 'USDC',
    amountIn: 100,
    slippage: 0.01
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Connection closed');
};
```

### 3. Using Postman

1. Create new WebSocket Request
2. URL: `ws://localhost:3000/api/orders/execute`
3. Click "Connect"
4. Send message:
   ```json
   {
     "userId": "postmanUser",
     "orderType": "market",
     "tokenIn": "SOL",
     "tokenOut": "USDC",
     "amountIn": 100,
     "slippage": 0.01
   }
   ```

### 4. Using Python

```python
import websocket
import json
import time

def on_message(ws, message):
    data = json.loads(message)
    print(f"Received: {data}")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Connection closed")

def on_open(ws):
    print("Connected!")
    
    # Send order
    order = {
        "userId": "pythonUser",
        "orderType": "market",
        "tokenIn": "SOL",
        "tokenOut": "USDC",
        "amountIn": 100,
        "slippage": 0.01
    }
    ws.send(json.dumps(order))

# Connect
ws = websocket.WebSocketApp(
    "ws://localhost:3000/api/orders/execute",
    on_message=on_message,
    on_error=on_error,
    on_close=on_close
)
ws.on_open = on_open
ws.run_forever()
```

## Expected WebSocket Flow

### 1. Connection Established

```json
{
  "type": "connected",
  "message": "WebSocket connection established. Send order to execute."
}
```

### 2. Order Created

```json
{
  "type": "orderCreated",
  "orderId": "ORD-1705318200000-A1B2C3D4",
  "status": "pending",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Status: Routing

```json
{
  "type": "statusUpdate",
  "orderId": "ORD-1705318200000-A1B2C3D4",
  "status": "routing",
  "timestamp": "2024-01-15T10:30:00.500Z",
  "data": {
    "quotes": [
      {
        "dex": "raydium",
        "price": 0.00015,
        "amountOut": 14.96,
        "fee": 0.0025,
        "estimatedGas": 0.00001
      },
      {
        "dex": "meteora",
        "price": 0.000152,
        "amountOut": 15.12,
        "fee": 0.002,
        "estimatedGas": 0.000008
      }
    ]
  }
}
```

### 4. Status: Building

```json
{
  "type": "statusUpdate",
  "orderId": "ORD-1705318200000-A1B2C3D4",
  "status": "building",
  "timestamp": "2024-01-15T10:30:01.000Z",
  "data": {
    "dexUsed": "meteora"
  }
}
```

### 5. Status: Submitted

```json
{
  "type": "statusUpdate",
  "orderId": "ORD-1705318200000-A1B2C3D4",
  "status": "submitted",
  "timestamp": "2024-01-15T10:30:01.500Z",
  "data": {
    "dexUsed": "meteora"
  }
}
```

### 6. Status: Confirmed

```json
{
  "type": "statusUpdate",
  "orderId": "ORD-1705318200000-A1B2C3D4",
  "status": "confirmed",
  "timestamp": "2024-01-15T10:30:04.000Z",
  "data": {
    "dexUsed": "meteora",
    "executedPrice": 0.000151,
    "amountOut": 15.05,
    "txHash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
  }
}
```

## Testing Scenarios

### Scenario 1: Single Order

```bash
# Connect
wscat -c ws://localhost:3000/api/orders/execute

# Send order
{"userId":"user1","orderType":"market","tokenIn":"SOL","tokenOut":"USDC","amountIn":100,"slippage":0.01}

# Watch status updates (6 messages expected)
# Connection → Created → Routing → Building → Submitted → Confirmed
```

### Scenario 2: Multiple Concurrent Orders

Open 5 terminals and connect simultaneously:

```bash
# Terminal 1
wscat -c ws://localhost:3000/api/orders/execute
{"userId":"user1","orderType":"market","tokenIn":"SOL","tokenOut":"USDC","amountIn":50,"slippage":0.01}

# Terminal 2
wscat -c ws://localhost:3000/api/orders/execute
{"userId":"user2","orderType":"market","tokenIn":"SOL","tokenOut":"USDC","amountIn":75,"slippage":0.01}

# Terminal 3-5: Similar
```

All orders should process concurrently (max 10 at once).

### Scenario 3: Invalid Order

```bash
# Connect
wscat -c ws://localhost:3000/api/orders/execute

# Send invalid order (missing required field)
{"userId":"user1","orderType":"market","tokenIn":"SOL"}

# Expected error response
{
  "type": "error",
  "error": "Validation error: amountIn is required"
}
```

### Scenario 4: Unsupported Order Type

```bash
# Send limit order (not implemented)
{"userId":"user1","orderType":"limit","tokenIn":"SOL","tokenOut":"USDC","amountIn":100,"targetPrice":0.00015}

# Expected error response
{
  "type": "error",
  "error": "Only market orders are supported in this implementation"
}
```

## Load Testing WebSocket

### Using k6

```javascript
// websocket-load-test.js
import ws from 'k6/ws';
import { check } from 'k6';

export let options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const url = 'ws://localhost:3000/api/orders/execute';
  const params = { tags: { my_tag: 'hello' } };

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', () => {
      console.log('Connected');
      
      // Send order
      socket.send(JSON.stringify({
        userId: `loadtest-${__VU}`,
        orderType: 'market',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: Math.floor(Math.random() * 100) + 50,
        slippage: 0.01,
      }));
    });

    socket.on('message', (data) => {
      const msg = JSON.parse(data);
      console.log('Message:', msg.type);
    });

    socket.on('close', () => {
      console.log('Disconnected');
    });

    socket.setTimeout(function () {
      socket.close();
    }, 10000);
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
```

Run:
```bash
k6 run websocket-load-test.js
```

## Monitoring WebSocket Connections

### Check Active Connections

```bash
# Get queue stats
curl http://localhost:3000/api/queue/stats

# Expected response
{
  "waiting": 5,
  "active": 10,
  "completed": 150,
  "failed": 2,
  "total": 15
}
```

### View Server Logs

```bash
# Development mode (with pretty logs)
npm run dev

# Look for WebSocket messages
# "WebSocket connection established"
# "Order created"
# "DEX routing completed"
# "Order executed successfully"
```

## Debugging WebSocket Issues

### Connection Refused

**Issue**: Cannot connect to WebSocket

**Solution**:
```bash
# Check if server is running
curl http://localhost:3000/health

# Check if port is correct
# Default: ws://localhost:3000
```

### No Messages Received

**Issue**: Connected but no status updates

**Solution**:
```bash
# Check order format
# Ensure all required fields present
# Check server logs for errors
```

### Connection Drops

**Issue**: WebSocket closes unexpectedly

**Solution**:
```bash
# Check network stability
# Increase timeout if needed
# Monitor server resources (CPU/RAM)
```

## Production WebSocket Testing

### Update URL for Deployed App

```javascript
// For Render
const ws = new WebSocket('wss://your-app.onrender.com/api/orders/execute');

// For Railway
const ws = new WebSocket('wss://your-app.up.railway.app/api/orders/execute');

// Note: Use wss:// (secure) for HTTPS deployments
```

### Test from Different Locations

Use online WebSocket testers:
- [WebSocket.org Echo Test](https://www.websocket.org/echo.html)
- [Postman](https://www.postman.com/)
- [wscat](https://www.npmjs.com/package/wscat)

## Video Demo Tips

For your 1-2 minute demo video:

1. **Open Terminal**: Show wscat connection
2. **Connect**: `wscat -c ws://localhost:3000/api/orders/execute`
3. **Send Order**: Paste order JSON
4. **Show Updates**: Let all status messages appear
5. **Check Database**: Query final order state
6. **Show Logs**: Display server logs with DEX routing

Example narration:
> "Here I'm connecting to the WebSocket endpoint. When I send a market order, you can see it goes through the lifecycle: pending, routing where it compares Raydium and Meteora prices, building the transaction, submitted to the blockchain, and finally confirmed with the transaction hash. The system automatically routed to Meteora because it offered a better price."

---

Happy Testing! 🚀
