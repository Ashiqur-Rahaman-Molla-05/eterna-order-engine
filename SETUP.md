# Order Execution Engine - Quick Start Guide

## Prerequisites Checklist

Before running the application, ensure you have:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15+ installed and running
- [ ] Redis 7+ installed and running
- [ ] Git installed

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup PostgreSQL

```bash
# Create database
createdb order_execution

# Or using psql
psql -U postgres -c "CREATE DATABASE order_execution;"
```

### 3. Setup Redis

```bash
# Start Redis (if not running)
# macOS:
brew services start redis

# Linux:
sudo systemctl start redis

# Windows:
redis-server
```

### 4. Configure Environment

The `.env` file is already configured for local development. If needed, update:

```env
DB_PASSWORD=your_postgres_password
```

### 5. Run the Application

```bash
npm run dev
```

Server will start at: `http://localhost:3000`

## Verify Installation

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 5.123
}
```

### Submit Test Order

```bash
curl -X POST http://localhost:3000/api/orders/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "testuser",
    "orderType": "market",
    "tokenIn": "SOL",
    "tokenOut": "USDC",
    "amountIn": 100,
    "slippage": 0.01
  }'
```

## Testing WebSocket Connection

### Using wscat

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3000/api/orders/execute

# Send order (paste this after connection)
{"userId":"testuser","orderType":"market","tokenIn":"SOL","tokenOut":"USDC","amountIn":100,"slippage":0.01}
```

You'll receive real-time status updates!

## Run Tests

```bash
npm test
```

## Using Docker (Alternative)

If you prefer Docker:

```bash
# Start all services
docker-compose up

# Or in detached mode
docker-compose up -d

# View logs
docker-compose logs -f app
```

## Import Postman Collection

1. Open Postman
2. Click "Import"
3. Select `postman_collection.json`
4. Collection will have 11 pre-configured requests

## Troubleshooting

### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
pg_isready

# If not, start it
# macOS:
brew services start postgresql@15

# Linux:
sudo systemctl start postgresql
```

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG

# If not, start it
# macOS:
brew services start redis

# Linux:
sudo systemctl start redis
```

### Port Already in Use

```bash
# Change PORT in .env file
PORT=3001
```

## Next Steps

1. ✅ Read the full [README.md](./README.md) for detailed documentation
2. ✅ Import [postman_collection.json](./postman_collection.json) for API testing
3. ✅ Test concurrent orders using multiple Postman requests
4. ✅ Monitor queue stats at `/api/queue/stats`

## Demo Flow

### 1. Submit 5 Orders Simultaneously

Use Postman Runner:
- Select orders 7-11 (Concurrent Test 1-5)
- Run all at once
- Orders will be queued and processed concurrently

### 2. Watch WebSocket Updates

Open multiple WebSocket connections and send orders. Each will stream:
- `pending` → `routing` → `building` → `submitted` → `confirmed`

### 3. Check Queue Statistics

```bash
curl http://localhost:3000/api/queue/stats
```

## Production Deployment

See [README.md](./README.md#deployment) for deployment instructions to:
- Render
- Railway
- AWS
- Docker

## Support

For issues or questions about the implementation:
- Check [README.md](./README.md) for detailed architecture
- Review code comments in `src/` directory
- Test with Postman collection first

---

**Built for Eterna Backend Assessment** 🚀
