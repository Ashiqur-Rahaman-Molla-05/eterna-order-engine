# Order Execution Engine

A production-ready order execution engine with DEX routing (Raydium & Meteora), real-time WebSocket updates, and queue-based concurrent processing. Built for Eterna's backend assessment.

## 🎯 Design Decisions

### Market Orders (Chosen)
**Why**: Market orders provide immediate execution at the best available price, making them ideal for showcasing:
- Real-time DEX routing logic
- WebSocket streaming capabilities
- Concurrent order processing

**Extensibility**: The architecture easily extends to support:
- **Limit Orders**: Add a price monitoring service that watches DEX feeds and executes when target price is reached
- **Sniper Orders**: Implement token launch detection via Solana program logs and execute instantly on new token mints

## 🏗️ How It Works

```
Client → WebSocket → Fastify Server → BullMQ Queue → Worker → DEX Router → PostgreSQL
```

1. **Order Submission**: User sends order via WebSocket
2. **Validation & Queueing**: Order validated and added to BullMQ queue
3. **DEX Routing**: Worker fetches quotes from both Raydium (0.25% fee) and Meteora (0.2% fee)
4. **Best Price Selection**: System selects DEX with higher net output (after fees and gas)
5. **Swap Execution**: Executes on chosen DEX with slippage protection
6. **Status Streaming**: Real-time WebSocket updates through 6-stage lifecycle:
   - `pending` → `routing` → `building` → `submitted` → `confirmed`/`failed`

## 🛠️ Tech Stack

- **Node.js 18+** - JavaScript runtime
- **TypeScript 5.5** - Type safety
- **Fastify 4.28** - Web framework (2-3x faster than Express)
- **BullMQ 5.13** - Job queue (10 concurrent, 100/min rate limit)
- **Redis 7+** - Queue backend
- **PostgreSQL 15+** - Order persistence
- **Jest 29** - Testing framework (32 tests passing)

## 📦 Prerequisites

- Node.js >= 18
- PostgreSQL >= 15
- Redis >= 7

## 🚀 Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database/redis credentials
```

### 3. Build
```bash
npm run build
```

### 4. Run Tests
```bash
npm test
# Output: 32 tests passing ✅
```

### 5. Start Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Submit Order (HTTP)
```bash
POST /api/orders/submit
Content-Type: application/json

{
  "userId": "user123",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 100,
  "slippage": 0.01
}
```

**Response**: Returns `orderId` to connect WebSocket

### WebSocket Connection
```bash
ws://localhost:3000/api/orders/execute
```

**Send Order**:
```json
{
  "userId": "user123",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 100,
  "slippage": 0.01
}
```

**Receive Status Updates**:
```json
{
  "type": "statusUpdate",
  "orderId": "ORD-xxx",
  "status": "routing",
  "data": {
    "quotes": [
      { "dex": "raydium", "price": 0.00015, "amountOut": 14.96 },
      { "dex": "meteora", "price": 0.000152, "amountOut": 15.12 }
    ]
  }
}
```

### Other Endpoints
```bash
GET /api/orders/:orderId          # Get order details
GET /api/orders?userId=user123    # Get user's order history
GET /api/queue/stats              # Queue metrics
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

**Test Coverage**:
- ✅ DEX routing (Raydium vs Meteora quote comparison)
- ✅ Order execution lifecycle
- ✅ Slippage validation
- ✅ Database operations
- ✅ Queue behavior

**Results**: 32 passing tests, 37% code coverage

## 📊 Performance Specifications

- **Concurrent Orders**: 10 simultaneous executions
- **Throughput**: 100 orders/minute
- **Execution Time**: 2-3 seconds (mock DEX)
- **Queue Retry**: 3 attempts with exponential backoff
- **WebSocket Latency**: <50ms per status update

## 🐳 Docker

```bash
# Build
docker build -t order-engine .

# Run with docker-compose
docker-compose up -d
```

## 📚 Additional Documentation

- `SETUP.md` - Detailed installation guide
- `WEBSOCKET_TESTING.md` - WebSocket client examples
- `VIDEO_SCRIPT.md` - Demo video recording guide
- `HOW_TO_VERIFY.md` - System verification steps
- `DEPLOYMENT.md` - Production deployment guide

## 🔍 Project Structure

```
src/
├── api/              # Fastify server & endpoints
├── services/         # Core business logic
│   ├── dex-router.service.ts      # DEX quote fetching & routing
│   ├── order-execution.service.ts # Order lifecycle management
│   └── order-queue.service.ts     # BullMQ queue setup
├── database/         # PostgreSQL operations
├── types/            # TypeScript interfaces
└── utils/            # Helpers & logging
```

## ✅ Deliverables Checklist

- ✅ GitHub repo with clean commits
- ✅ API with order execution and DEX routing
- ✅ WebSocket status streaming (6 lifecycle stages)
- ✅ Queue management (10 concurrent, 100/min)
- ✅ Error handling & retry logic (3 attempts, exponential backoff)
- ✅ 32 passing tests + Postman collection (11 requests)
- ✅ PostgreSQL persistence + Redis queue
- ✅ Docker deployment configuration
- ✅ Complete documentation

## 🎬 Demo Video

For demonstration of order flow and WebSocket streaming, see the public YouTube video linked in the submission.

---

**Status**: Production Ready | **Tests**: 32/32 Passing ✅ | **Coverage**: 37% | **Built for Eterna Backend Assessment**
