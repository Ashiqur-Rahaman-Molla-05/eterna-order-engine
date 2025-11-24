# Demo Video Script (1-2 Minutes)

**Total Duration**: 90-120 seconds

---

## Setup Before Recording

### Terminal Windows to Open
1. **Terminal 1**: Server logs (`npm run dev`)
2. **Terminal 2**: WebSocket client (wscat)
3. **Terminal 3**: API testing (curl commands)
4. **Browser Tab**: Queue statistics

### Commands to Prepare
```bash
# Terminal 1 - Start server
npm run dev

# Terminal 2 - WebSocket connection
wscat -c ws://localhost:3000/api/orders/execute

# Terminal 3 - Ready to paste curl commands
```

---

## Video Script

### Scene 1: Introduction (0-10 seconds)

**[Screen: Show code editor with project structure]**

**Narration**:
> "This is an Order Execution Engine built for Eterna's backend assessment. It processes market orders with intelligent DEX routing and real-time WebSocket updates."

---

### Scene 2: Architecture Overview (10-20 seconds)

**[Screen: README.md showing architecture diagram]**

**Narration**:
> "The system uses Fastify for HTTP and WebSocket, BullMQ for queue management, and routes orders between Raydium and Meteora DEXs to find the best price."

---

### Scene 3: Server Running (20-30 seconds)

**[Screen: Terminal 1 with server logs]**

**Narration**:
> "Let me start the server. As you can see, it connects to PostgreSQL and Redis, and the server is listening on port 3000."

**[Show logs]**:
```
✓ Database initialized
✓ Server listening on 0.0.0.0:3000
✓ WebSocket endpoint: ws://0.0.0.0:3000/api/orders/execute
```

---

### Scene 4: WebSocket Connection (30-45 seconds)

**[Screen: Terminal 2 with wscat]**

**Narration**:
> "Now I'll connect via WebSocket and submit a market order for 100 SOL."

**[Type and send]**:
```json
{"userId":"demo","orderType":"market","tokenIn":"SOL","tokenOut":"USDC","amountIn":100,"slippage":0.01}
```

**[Show incoming messages rapidly]**:
```json
// Connection message
{"type":"connected","message":"WebSocket connection established..."}

// Order created
{"type":"orderCreated","orderId":"ORD-1234567890-ABCD1234","status":"pending",...}

// Routing
{"type":"statusUpdate","status":"routing","data":{"quotes":[...]}}

// Building
{"type":"statusUpdate","status":"building","data":{"dexUsed":"meteora"}}

// Submitted
{"type":"statusUpdate","status":"submitted",...}

// Confirmed
{"type":"statusUpdate","status":"confirmed","data":{"txHash":"abc...","executedPrice":0.000151}}
```

**Narration**:
> "Watch as the order goes through its lifecycle: routing compares prices from both DEXs, the system selects Meteora for better pricing, builds the transaction, submits it, and finally confirms with a transaction hash."

---

### Scene 5: DEX Routing Decision (45-55 seconds)

**[Screen: Terminal 1 - Server logs]**

**[Highlight log entries]**:
```
DEBUG: Raydium quote fetched: price=0.00015, amountOut=14.96
DEBUG: Meteora quote fetched: price=0.000152, amountOut=15.12
INFO: DEX routing completed, selectedDex=meteora
INFO: Order executed successfully, txHash=abc...
```

**Narration**:
> "In the logs, you can see Raydium offered 14.96 USDC, but Meteora offered 15.12 USDC, so the system automatically routed to Meteora for better value."

---

### Scene 6: Concurrent Orders (55-75 seconds)

**[Screen: Split view - Multiple terminals or Postman Runner]**

**Narration**:
> "The system handles concurrent orders. Let me submit 5 orders simultaneously."

**[Use Postman Runner or 5 terminals with prepared orders]**

**[Show Terminal 1 logs]**:
```
INFO: Processing order ORD-...1 (attempt 1 of 3)
INFO: Processing order ORD-...2 (attempt 1 of 3)
INFO: Processing order ORD-...3 (attempt 1 of 3)
INFO: Processing order ORD-...4 (attempt 1 of 3)
INFO: Processing order ORD-...5 (attempt 1 of 3)
...
INFO: Worker completed job ORD-...1
INFO: Worker completed job ORD-...2
```

**Narration**:
> "All five orders are processed concurrently with a maximum of 10 simultaneous executions and 100 orders per minute rate limit."

---

### Scene 7: Queue Statistics (75-85 seconds)

**[Screen: Browser or curl output]**

```bash
curl http://localhost:3000/api/queue/stats
```

**[Show response]**:
```json
{
  "waiting": 0,
  "active": 3,
  "completed": 48,
  "failed": 1,
  "total": 3
}
```

**Narration**:
> "The queue statistics endpoint shows 48 completed orders, 1 failed due to simulated network error, and 3 currently active."

---

### Scene 8: Features Recap (85-100 seconds)

**[Screen: README.md - Features section]**

**[Highlight while speaking]**:
- ✅ Market order execution
- ✅ DEX routing (Raydium + Meteora)
- ✅ Real-time WebSocket updates
- ✅ Concurrent processing (10 orders)
- ✅ Rate limiting (100/min)
- ✅ Retry logic (exponential backoff)
- ✅ Comprehensive testing
- ✅ Docker deployment ready

**Narration**:
> "Key features include intelligent DEX routing, real-time WebSocket updates through the entire order lifecycle, concurrent processing with BullMQ, automatic retry with exponential backoff, and production-ready deployment with Docker."

---

### Scene 9: Code Quality (100-110 seconds)

**[Screen: Show test results]**

```bash
npm test
```

**[Show output]**:
```
 PASS  src/services/dex-router.service.test.ts
 PASS  src/utils/helpers.test.ts
 PASS  src/database/order.repository.test.ts

Test Suites: 3 passed, 3 total
Tests:       12 passed, 12 total
Coverage:    85.3%
```

**Narration**:
> "The codebase has comprehensive test coverage with 12+ tests covering routing logic, queue behavior, and database operations."

---

### Scene 10: Closing (110-120 seconds)

**[Screen: GitHub repository or README]**

**[Show]**:
- README.md
- Documentation files
- Postman collection
- Docker files

**Narration**:
> "The complete implementation includes detailed documentation, Postman collection for API testing, Docker deployment configuration, and is ready for production deployment to platforms like Render, Railway, or AWS. Thank you!"

---

## Recording Tips

### Before Recording
1. ✅ Close unnecessary applications
2. ✅ Clear terminal history
3. ✅ Prepare all commands in text file
4. ✅ Test run the entire flow once
5. ✅ Adjust terminal font size (readable)
6. ✅ Use terminal with good color scheme
7. ✅ Have README open in browser

### During Recording
- **Speak clearly** and at moderate pace
- **Highlight important parts** with cursor
- **Use screen annotations** if possible
- **Show timestamps** in logs
- **Zoom in** on important text

### Screen Recording Tools
- **macOS**: QuickTime, ScreenFlow
- **Windows**: OBS Studio, ShareX
- **Linux**: SimpleScreenRecorder, OBS
- **Cross-platform**: OBS Studio (free)

### Video Editing (Optional)
- Speed up waiting periods (2-3 second delays)
- Add text overlays for key points
- Include background music (optional)
- Keep it under 2 minutes

---

## Alternative 60-Second Version

If you need a shorter video:

1. **0-10s**: Introduction + architecture
2. **10-25s**: WebSocket connection + order submission
3. **25-40s**: Show all status updates
4. **40-50s**: Highlight DEX routing decision
5. **50-60s**: Show concurrent orders + closing

---

## Upload to YouTube

### Video Details
- **Title**: "Order Execution Engine - Eterna Backend Assessment"
- **Description**: 
  ```
  High-performance order execution engine with DEX routing and WebSocket updates.
  
  Features:
  - Market order execution
  - Intelligent DEX routing (Raydium + Meteora)
  - Real-time WebSocket status updates
  - Concurrent processing with BullMQ
  - Retry logic and error handling
  - Production-ready deployment
  
  Tech Stack: TypeScript, Fastify, BullMQ, PostgreSQL, Redis
  
  GitHub: [your-repo-link]
  Documentation: [readme-link]
  ```
- **Tags**: typescript, nodejs, fastify, websocket, dex, solana, backend
- **Privacy**: Unlisted or Public
- **Thumbnail**: Screenshot of architecture diagram or WebSocket flow

---

## Checklist Before Submitting

- [ ] Video shows WebSocket connection
- [ ] Video shows all status updates (pending → confirmed)
- [ ] Video shows DEX routing decision
- [ ] Video shows concurrent order processing
- [ ] Video shows queue statistics
- [ ] Video is under 2 minutes
- [ ] Video is uploaded to YouTube
- [ ] Video is set to Public or Unlisted
- [ ] Video link works and is not private

---

**Good luck with your demo! 🚀**
