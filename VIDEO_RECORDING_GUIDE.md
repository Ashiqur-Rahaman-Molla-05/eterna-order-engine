# YouTube Video Recording Script - Shot by Shot

**Total Duration**: 2 minutes  
**Recording Tool**: Windows Game Bar (Win + G) or OBS Studio  
**Quality**: 1080p recommended

---

## 📹 SHOT 1: Intro (15 seconds)

**Setup:**
- Open VS Code
- Position window to show full screen
- Zoom to 125% for readability

**Script to Say:**
```
"Hi, I'm Ashiqur. This is my Order Execution Engine 
for Eterna's backend assessment.

It's a production-ready system that routes orders 
between Raydium and Meteora DEXs with real-time 
WebSocket updates."
```

**Visual:**
- Show project folder in VS Code sidebar
- Point to `src` folder briefly

---

## 📹 SHOT 2: Run Tests (25 seconds)

**Setup:**
- Open Terminal in VS Code
- Clear screen first

**Commands to Run:**
```powershell
npm test
```

**Script to Say (while tests run):**
```
"The system has 32 unit tests covering:
- DEX routing logic (quote comparison)
- Order execution lifecycle
- Slippage validation
- Database operations
- Queue behavior

All tests pass with 37% code coverage on tested components."
```

**What You'll See:**
```
PASS  src/utils/helpers.test.ts
PASS  src/database/order.repository.test.ts
PASS  src/services/dex-router.service.test.ts

Test Suites: 3 passed, 3 total
Tests:       32 passed, 32 total ✅
```

**Stop Here** - Wait for tests to complete before moving to next shot

---

## 📹 SHOT 3: Run System Verification (30 seconds)

**Setup:**
- Keep terminal visible
- Scroll to clear previous output

**Commands to Run:**
```powershell
node verify-system.js
```

**Script to Say (while it runs):**
```
"Let me verify the core system components work:

This runs through:
1. Utility functions - order ID generation, price impact
2. Raydium quote fetching
3. Meteora quote fetching
4. Best quote selection - comparing both DEXs
5. Swap execution with slippage
6. Failure simulation

All in real-time."
```

**What You'll See:**
```
✓ Test 1: Core Utilities
✓ Test 2: Raydium DEX Quote
✓ Test 3: Meteora DEX Quote
✓ Test 4: Best DEX Quote Selection
✓ Test 5: Swap Execution
✓ Test 6: Failure Simulation

✅ VERIFICATION COMPLETE - All Systems Operational!
```

---

## 📹 SHOT 4: Show Architecture (25 seconds)

**Setup:**
- Click on `README.md` in VS Code
- Scroll to "How It Works" section

**Script to Say:**
```
"The architecture is simple but powerful:

Order comes in via WebSocket, gets added to a BullMQ queue 
with up to 10 concurrent workers. Each worker:

1. Fetches quotes from Raydium (0.25% fee)
2. Fetches quotes from Meteora (0.2% fee)
3. Compares net amounts after fees and gas
4. Selects the better DEX
5. Executes the swap
6. Streams real-time updates back to the client

This happens for every order - the system can handle 
100 orders per minute."
```

**Visual:**
- Show the diagram in README (the flow chart)
- Highlight the 6 steps

---

## 📹 SHOT 5: Show Key Code (20 seconds)

**Setup:**
- Open `src/services/dex-router.service.ts`
- Show the file around line 90 (getBestQuote method)

**Script to Say:**
```
"Here's how the DEX comparison works:

We fetch quotes from both DEXs in parallel,
then select the one with the highest net output.

This is the routing intelligence that ensures 
every order gets the best price available."
```

**Visual:**
- Highlight `getBestQuote` method
- Show the comparison logic (raydiumQuote.amountOut vs meteoraQuote.amountOut)

---

## 📹 SHOT 6: Design Decision (15 seconds)

**Setup:**
- Go back to README.md
- Scroll to "Design Decisions" section

**Script to Say:**
```
"I chose Market Orders because they:
- Provide immediate execution at best price
- Showcase the DEX routing logic
- Demonstrate real-time WebSocket capabilities
- Are the most common in production trading

The architecture easily extends to:
- Limit Orders: Add price monitoring
- Sniper Orders: Detect token launches

All documented in the README."
```

**Visual:**
- Point to each decision in README
- Show the extensibility section

---

## 📹 SHOT 7: Project Links (10 seconds)

**Setup:**
- Open browser
- Navigate to GitHub repo

**Script to Say:**
```
"The complete code is on GitHub with:
- Clean commits
- Full documentation
- 40+ files of production-ready code
- Docker configuration for easy deployment

All links in the submission."
```

**Visual:**
- Show GitHub repo page
- Highlight README, code files

---

## 🎤 RECORDING CHECKLIST

Before you hit record:
- [ ] Close all unnecessary applications
- [ ] Disable notifications (Do Not Disturb on)
- [ ] Full screen VS Code (F11)
- [ ] Zoom to 125% for readability
- [ ] Have microphone/headset plugged in
- [ ] Speak clearly and moderately paced
- [ ] Practice the script once

---

## ⏱️ TIMING BREAKDOWN

| Shot | Content | Duration |
|------|---------|----------|
| 1 | Intro | 15 sec |
| 2 | Run Tests | 25 sec |
| 3 | Run Verification | 30 sec |
| 4 | Architecture | 25 sec |
| 5 | Show Code | 20 sec |
| 6 | Design Decision | 15 sec |
| 7 | Project Links | 10 sec |
| **TOTAL** | | **2 min 20 sec** ✅ |

---

## 🎥 RECORDING INSTRUCTIONS

### Using Windows Game Bar (Easiest)

1. **Start Recording**:
   - Press `Win + G`
   - Click "Start recording" button
   - Or press `Win + Alt + R`

2. **Do the demo** (follow the script above)

3. **Stop Recording**:
   - Press `Win + Alt + R`
   - Video auto-saves to: `C:\Users\YourName\Videos\Captures`

### Using OBS Studio (Professional)

1. Download: https://obsproject.com/
2. Settings → Output → Set video codec to H.264
3. Add source: Display Capture (select your main monitor)
4. Add audio source: Your microphone
5. Click "Start Recording"
6. Follow script
7. Click "Stop Recording"
8. Saved in Documents folder by default

---

## 📤 AFTER RECORDING

1. **Upload to YouTube**:
   - Go to https://www.youtube.com
   - Click "Create" → "Upload video"
   - Select your video file
   - **Title**: "Eterna Order Execution Engine Demo"
   - **Description**: 
     ```
     GitHub: https://github.com/Ashiqur-Rahaman-Molla-05/eterna-order-engine
     
     Demo of Order Execution Engine with DEX routing, 
     real-time WebSocket updates, and concurrent queue processing.
     ```
   - **Visibility**: Public or Unlisted
   - Click "Upload"
   - Wait for processing (2-5 minutes)
   - Copy the video URL

2. **Get Your Links**:
   - GitHub: `https://github.com/Ashiqur-Rahaman-Molla-05/eterna-order-engine`
   - README: `https://github.com/Ashiqur-Rahaman-Molla-05/eterna-order-engine/blob/main/README.md`
   - YouTube: (paste your video URL here)

3. **Submit to Eterna**:
   - Go to: https://tally.so/r/VLEVRE
   - Fill the 3 deliverable fields with your links
   - Submit! ✅

---

## ✅ YOU'RE DONE!

Total time: 10 minutes (5 min recording + 5 min upload + form)

Good luck! 🚀
