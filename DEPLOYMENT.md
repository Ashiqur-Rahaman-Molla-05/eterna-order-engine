# Deployment Guide - Order Execution Engine

## Overview

This guide covers deploying the Order Execution Engine to various platforms. The application requires:
- Node.js runtime
- PostgreSQL database
- Redis instance

## Option 1: Render (Recommended for Demo)

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: `order-execution-db`
   - Database: `order_execution`
   - User: `postgres`
   - Region: Choose closest to you
   - Instance Type: Free tier
4. Click "Create Database"
5. Copy the **Internal Database URL**

### Step 2: Create Redis Instance

1. Click "New +" → "Redis"
2. Configure:
   - Name: `order-execution-redis`
   - Region: Same as database
   - Instance Type: Free tier
3. Click "Create Redis"
4. Copy the **Internal Redis URL**

### Step 3: Deploy Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - Name: `order-execution-engine`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Free tier
4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<internal_database_url>
   REDIS_HOST=<redis_host>
   REDIS_PORT=<redis_port>
   MAX_CONCURRENT_ORDERS=10
   ORDERS_PER_MINUTE=100
   MOCK_MODE=true
   MIN_EXECUTION_DELAY_MS=2000
   MAX_EXECUTION_DELAY_MS=3000
   ```
5. Click "Create Web Service"

### Step 4: Verify Deployment

Once deployed, test:
```bash
curl https://your-app.onrender.com/health
```

Your public URL: `https://order-execution-engine.onrender.com`

## Option 2: Railway

### Quick Deploy

1. Go to [Railway](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### Add Database & Redis

1. Click "+ New" → "Database" → "PostgreSQL"
2. Click "+ New" → "Database" → "Redis"

### Configure Environment

Railway auto-detects services. Add these variables:
```
NODE_ENV=production
MAX_CONCURRENT_ORDERS=10
ORDERS_PER_MINUTE=100
MOCK_MODE=true
```

Railway automatically provides:
- `DATABASE_URL`
- `REDIS_URL`

### Deploy

1. Commit your code
2. Railway auto-deploys on push
3. Get public URL from Railway dashboard

## Option 3: Docker Compose (Self-Hosted)

### Prerequisites

- Docker and Docker Compose installed
- Server with public IP (DigitalOcean, AWS EC2, etc.)

### Deploy

```bash
# Clone repository
git clone <your-repo>
cd BACKEND

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Access Application

```bash
# Local
http://localhost:3000

# Remote (with nginx reverse proxy)
https://yourdomain.com
```

### Setup Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /api/orders/execute {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

## Option 4: AWS (Production Grade)

### Architecture

- **Compute**: ECS Fargate or EC2
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Load Balancer**: ALB with WebSocket support

### ECS Deployment

1. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name order-execution-engine
```

2. **Build and Push Image**
```bash
# Authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Build
docker build -t order-execution-engine .

# Tag
docker tag order-execution-engine:latest <account>.dkr.ecr.us-east-1.amazonaws.com/order-execution-engine:latest

# Push
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/order-execution-engine:latest
```

3. **Create ECS Task Definition**

```json
{
  "family": "order-execution-engine",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "<account>.dkr.ecr.us-east-1.amazonaws.com/order-execution-engine:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3000" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "REDIS_HOST", "valueFrom": "arn:aws:secretsmanager:..." }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/order-execution-engine",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

4. **Create ECS Service**
```bash
aws ecs create-service \
  --cluster default \
  --service-name order-execution-engine \
  --task-definition order-execution-engine \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=app,containerPort=3000"
```

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `REDIS_HOST` | Redis hostname | `redis.example.com` |
| `REDIS_PORT` | Redis port | `6379` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `order_execution` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `REDIS_PASSWORD` | Redis password | - |
| `MAX_CONCURRENT_ORDERS` | Max concurrent orders | `10` |
| `ORDERS_PER_MINUTE` | Rate limit | `100` |
| `MOCK_MODE` | Use mock DEX | `true` |
| `MIN_EXECUTION_DELAY_MS` | Min swap time | `2000` |
| `MAX_EXECUTION_DELAY_MS` | Max swap time | `3000` |

## Post-Deployment Checklist

- [ ] Health check endpoint responds: `GET /health`
- [ ] Database tables created automatically
- [ ] Redis connection established
- [ ] Submit test order successfully
- [ ] WebSocket connection works
- [ ] Queue processes orders
- [ ] Logs are accessible
- [ ] Monitoring configured (optional)

## Monitoring (Production)

### Application Logs

**Render/Railway**: View in dashboard

**Docker**: 
```bash
docker-compose logs -f app
```

**AWS**:
```bash
aws logs tail /ecs/order-execution-engine --follow
```

### Health Checks

Setup monitoring with:
- **UptimeRobot**: Free tier, check `/health` endpoint
- **Datadog**: Full APM monitoring
- **CloudWatch**: AWS native monitoring

### Metrics to Track

1. **Order Metrics**
   - Orders per minute
   - Average execution time
   - Success rate
   - Failure rate

2. **Queue Metrics**
   - Queue depth
   - Active jobs
   - Completed jobs
   - Failed jobs

3. **System Metrics**
   - CPU usage
   - Memory usage
   - Database connections
   - Redis connections

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Redis Connection Issues

```bash
# Test connection
redis-cli -h <host> -p <port> ping
```

### WebSocket Not Working

Ensure your platform supports WebSocket:
- **Render**: ✅ Supported
- **Railway**: ✅ Supported
- **Heroku**: ⚠️ Requires paid dyno
- **Vercel**: ❌ Not supported (use Render instead)

### Application Crashes

Check logs for errors:
```bash
# Render/Railway
View in dashboard

# Docker
docker-compose logs app

# AWS
aws logs tail /ecs/order-execution-engine
```

## Cost Estimates

### Free Tier (Perfect for Demo)

- **Render**: Free PostgreSQL + Redis + Web Service
- **Railway**: $5/month credit (includes all services)
- **Docker Compose**: $5-10/month (DigitalOcean Droplet)

### Production

- **Render**: ~$20-30/month (paid tiers)
- **Railway**: ~$20-40/month
- **AWS**: ~$50-100/month (optimized)

## Security Considerations

1. **Environment Variables**: Never commit `.env` to git
2. **Database**: Use strong passwords
3. **Redis**: Enable password authentication in production
4. **API**: Add rate limiting (already implemented)
5. **HTTPS**: Use SSL certificates (auto on Render/Railway)
6. **CORS**: Configure allowed origins in production

## Scaling Strategies

### Horizontal Scaling

1. **Multiple Workers**: Deploy additional instances
2. **Load Balancer**: Distribute requests
3. **Shared Queue**: All workers use same Redis queue

### Vertical Scaling

1. **Increase Resources**: More CPU/RAM per instance
2. **Database**: Upgrade PostgreSQL tier
3. **Redis**: Upgrade Redis tier

### Geographic Distribution

1. **Multi-Region**: Deploy to multiple regions
2. **CDN**: Use CloudFront for static assets
3. **Database Replicas**: Read replicas in multiple regions

---

**Need Help?** Check the main [README.md](./README.md) or open an issue.
