# Spot Crypto Trading Platform - Upgrade Documentation

## Overview

Your Crypto Predict platform has been upgraded from options/futures trading to **Spot Trading** — a simple, stock-like crypto trading interface where users can:

- **Buy** crypto at a price they choose (Limit Orders)
- **Hold** crypto long-term like stocks
- **Sell** when ready to profit
- **Manual control** — no bots, no automated execution

This is exactly like Bybit Spot Trading or any stock exchange.

---

## What Was Added

### 1. **Database Schema Updates** (`backend/prisma/schema.prisma`)

Four new models for spot trading:

#### **Portfolio**
Stores each user's crypto holdings (USDT, BTC, ETH, etc.)
```prisma
model Portfolio {
  assets: Json  // { "USDT": 10000, "BTC": 0.5, "ETH": 2.0 }
}
```

#### **CryptoMarket**
Stores real-time prices from CoinGecko
```prisma
model CryptoMarket {
  symbol: String        // "BTC/USDT", "ETH/USDT"
  lastPrice: Float
  high24h: Float
  low24h: Float
  volume24h: Float
  changePercent24h: Float
}
```

#### **Order**
Tracks pending buy/sell orders
```prisma
model Order {
  symbol: String        // "BTC/USDT"
  side: String         // "BUY" or "SELL"
  orderType: String    // "LIMIT" or "MARKET"
  price: Float         // User's desired price
  quantity: Float
  status: String       // "OPEN", "FILLED", "CANCELLED"
}
```

#### **Trade**
Executed orders (when price is matched)
```prisma
model Trade {
  orderId: String      // Link to Order
  executionPrice: Float
  quantity: Float
  totalValue: Float
}
```

---

### 2. **Backend API Routes** (`backend/routes/trading.js`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/trading/markets` | GET | List all available crypto markets |
| `GET /api/trading/markets/:symbol` | GET | Get specific market data (price, change, etc.) |
| `GET /api/trading/portfolio` | GET | Get user's crypto holdings |
| `POST /api/trading/orders` | POST | Place a new BUY/SELL order |
| `GET /api/trading/orders/open` | GET | Get all open orders |
| `GET /api/trading/orders/history` | GET | Get completed/cancelled orders |
| `GET /api/trading/orders/:orderId` | GET | Get order details |
| `DELETE /api/trading/orders/:orderId` | DELETE | Cancel an open order |
| `GET /api/trading/trades` | GET | Get all completed trades |

#### Example: Place a Limit Order
```javascript
POST /api/trading/orders
{
  "symbol": "BTC/USDT",
  "side": "BUY",
  "orderType": "LIMIT",
  "price": 60000,
  "quantity": 0.5
}
```

**What happens:**
1. System checks if user has 30,000 USDT (0.5 × 60,000)
2. Locks the USDT in their portfolio
3. Creates an OPEN order
4. Returns order confirmation

**When price hits:**
- Price feed triggers automatic execution
- Trade record created
- Crypto added to portfolio
- USDT deducted
- Order status = FILLED

---

### 3. **Order Execution Engine** (`backend/utils/orderExecutor.js`)

Automatic engine that:

1. **Fetches real-time prices** from CoinGecko API (free)
2. **Updates market data** every 30 seconds
3. **Matches orders** every 10 seconds
4. **Executes trades** when price conditions are met

#### Logic
- **BUY Limit Order**: Execute when `currentPrice <= orderPrice`
- **SELL Limit Order**: Execute when `currentPrice >= orderPrice`

**Example:**
```
User places BUY order: 1 BTC @ $60,000
Current price: $65,000 (order stays OPEN)

Price drops to $59,999
Engine detects: $59,999 < $60,000 ✓
Order EXECUTED
Trade created
1 BTC added to user's portfolio
60,000 USDT removed
```

---

### 4. **Frontend UI** (`trade.html`)

Professional Bybit-style trading interface with:

#### **Left Column: Market Data**
- Market selector buttons (BTC, ETH, BNB, XRP, ADA, SOL)
- Real-time price chart area
- 24h stats (price, change, high, low, volume)

#### **Right Column: Trading**
**Tabs: [Limit] | [Market]**

**Limit Order Form:**
- Trading pair dropdown
- Price input (your desired price)
- Amount input
- Total cost calculator
- % buttons (25%, 50%, 75%, 100% of balance)
- Buy/Sell buttons

**Market Order Form:**
- Trading pair dropdown
- Amount input
- Estimated cost
- % buttons
- Buy/Sell buttons

#### **Open Orders Table**
- Shows all active orders
- Columns: Pair, Side, Price, Amount, Status, Cancel button
- Real-time updates (refreshes every 5 seconds)

#### **Portfolio Section**
- Lists all crypto holdings
- Shows USD value of each asset
- Updates in real-time

---

## How It Works: Step by Step

### **Scenario: User buys BTC**

1. **User opens `/trade.html`**
   - Page loads markets and their portfolio
   - Displays real-time prices

2. **User places LIMIT order**
   - Selects "BTC/USDT"
   - Sets price: $60,000
   - Sets amount: 0.5 BTC
   - Total: $30,000
   - Clicks "Buy (Limit)"

3. **Frontend validates and submits**
   ```javascript
   POST /api/trading/orders
   {
     symbol: "BTC/USDT",
     side: "BUY",
     orderType: "LIMIT",
     price: 60000,
     quantity: 0.5
   }
   ```

4. **Backend processes**
   - Checks portfolio: User has $50,000 USDT ✓
   - Locks $30,000 USDT
   - Creates Order record with status: "OPEN"
   - Returns order ID

5. **Frontend shows "Order Placed"**
   - Order appears in "Open Orders" table
   - Portfolio shows locked USDT
   - User can cancel anytime

6. **Order Execution Engine runs**
   - Every 30 seconds: Fetches BTC price from CoinGecko
   - Every 10 seconds: Checks all OPEN orders
   - Finds: BTC price = $59,950
   - **Executes order** (price hit limit of $60,000)

7. **Backend executes trade**
   - Unlocks USDT from portfolio
   - Adds 0.5 BTC to portfolio
   - Deducts $29,975 from USDT (0.5 × $59,950)
   - Creates Trade record
   - Updates Order status: "FILLED"

8. **Frontend auto-updates**
   - Order moves from "Open Orders" to history
   - Portfolio shows: +0.5 BTC, -$29,975 USDT
   - User can now SELL when price rises

---

## Setup Instructions

### **1. Run Database Migrations**

```bash
cd backend
npm install  # Install node-fetch
npx prisma migrate deploy
```

This creates the new tables: Portfolio, CryptoMarket, Order, Trade

### **2. Start Backend**

```bash
npm start
# or for development
npm run dev
```

The Order Execution Engine starts automatically and:
- Updates market data every 30 seconds
- Processes orders every 10 seconds

### **3. Access Frontend**

Open: `http://localhost:3000/trade.html`

Login with your account, then trade!

---

## API Examples

### Get Markets
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/trading/markets
```

Response:
```json
{
  "success": true,
  "markets": [
    {
      "id": "btc-usdt",
      "symbol": "BTC/USDT",
      "baseAsset": "BTC",
      "lastPrice": 62500,
      "high24h": 65000,
      "low24h": 59000,
      "volume24h": 1500000000,
      "changePercent24h": 2.35
    }
  ]
}
```

### Place Order
```bash
curl -X POST http://localhost:3000/api/trading/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USDT",
    "side": "BUY",
    "orderType": "LIMIT",
    "price": 60000,
    "quantity": 0.5
  }'
```

Response:
```json
{
  "success": true,
  "order": {
    "id": "order_123",
    "symbol": "BTC/USDT",
    "side": "BUY",
    "orderType": "LIMIT",
    "price": 60000,
    "quantity": 0.5,
    "status": "OPEN",
    "createdAt": "2026-02-03T10:30:00Z"
  },
  "message": "BUY order placed for 0.5 BTC/USDT at $60000"
}
```

### Get Portfolio
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/trading/portfolio
```

Response:
```json
{
  "success": true,
  "portfolio": {
    "assets": {
      "USDT": 50000,
      "BTC": 0.5,
      "ETH": 2.0,
      "_lockedIn": 30000,
      "_locked": { "BTC": 0.25 }
    }
  }
}
```

### Get Open Orders
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/trading/orders/open
```

### Cancel Order
```bash
curl -X DELETE http://localhost:3000/api/trading/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Real-Time Price Feed

The system uses **CoinGecko's free API** to fetch real-time prices for:

- Bitcoin (BTC)
- Ethereum (ETH)
- Binance Coin (BNB)
- Ripple (XRP)
- Cardano (ADA)
- Solana (SOL)
- Dogecoin (DOGE)
- And 10+ more...

**No API key required.** The free tier supports unlimited requests.

**Update frequency:** Every 30 seconds for market data

---

## Key Features

✅ **Limit Orders** - Choose your price  
✅ **Market Orders** - Instant execution at current price  
✅ **Real-Time Prices** - CoinGecko data  
✅ **Portfolio Tracking** - See all your crypto holdings  
✅ **Order Management** - View, cancel orders  
✅ **Trade History** - See all executed trades  
✅ **Fund Locking** - Money is locked until order fills or cancels  
✅ **Auto-Execution** - Orders execute when price is reached  
✅ **Mobile Responsive** - Works on phones/tablets  

---

## File Changes Summary

### New Files
- `backend/routes/trading.js` - Trading API endpoints
- `backend/utils/orderExecutor.js` - Price feed & order execution
- `backend/prisma/migrations/20260203_spot_trading/migration.sql` - Database schema
- `trade.html` - Trading UI

### Modified Files
- `backend/prisma/schema.prisma` - Added 4 new models
- `backend/server.js` - Integrated trading routes & order executor
- `backend/package.json` - Added node-fetch dependency
- `js/dashboard.js` - Added "Spot Trading" nav link

---

## Next Steps (Optional Enhancements)

1. **Advanced Charts** - Replace placeholder with TradingView Lightweight Charts
2. **Order Types** - Add Stop-Loss, Take-Profit orders
3. **Leverage** - (If desired) Add margin/leverage trading
4. **P2P Trading** - User-to-user trades
5. **Staking** - Earn interest on holdings
6. **Mobile App** - Native iOS/Android app
7. **Advanced Analytics** - Trading bots, signals, backtesting

---

## Troubleshooting

### Orders not executing?
Check server logs:
```bash
npm run dev
# Look for "Checking X open orders for execution..."
```

### Price not updating?
1. Check internet connection
2. Verify CoinGecko API is accessible
3. Check server logs for fetch errors

### Portfolio showing "undefined"?
Portfolio is auto-created on first trade. If missing:
```bash
npx prisma studio
# Manually create Portfolio record with userId
```

### "Insufficient balance" error?
Verify you have enough USDT/crypto locked in portfolio.

---

## Support

For issues or questions about the spot trading system, contact support or check server logs.

Good luck trading! 🚀
