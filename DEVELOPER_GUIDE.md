# Spot Trading Platform - Developer Guide

Complete guide for developers maintaining and extending the spot trading system.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│         Frontend (trade.html)           │
│  - Market selector                      │
│  - Order forms (Limit/Market)          │
│  - Portfolio display                    │
│  - Open orders table                    │
└────────────┬────────────────────────────┘
             │ HTTP Requests
             ↓
┌─────────────────────────────────────────┐
│       Backend API (Express.js)          │
│  - Authentication middleware            │
│  - Trading routes (/api/trading/*)     │
│  - Balance validation                   │
│  - Order management                     │
└────────────┬────────────────────────────┘
             │ Database Queries
             ↓
┌─────────────────────────────────────────┐
│    Order Execution Engine (Node.js)     │
│  - Price fetching (every 30s)           │
│  - Order matching (every 10s)           │
│  - Trade execution                      │
│  - Portfolio updates                    │
└────────────┬────────────────────────────┘
             │ Database Updates
             ↓
┌─────────────────────────────────────────┐
│   Database (PostgreSQL + Prisma ORM)    │
│  - Portfolio (multi-asset holdings)    │
│  - CryptoMarket (price data)            │
│  - Order (pending orders)               │
│  - Trade (executed trades)              │
└─────────────────────────────────────────┘
```

---

## 📂 Code Organization

### Backend Structure

```
backend/
├── server.js                           # Entry point
│   ├── Loads environment
│   ├── Initializes Express
│   ├── Registers routes
│   └── Starts order executor
│
├── middleware/
│   └── auth.js                         # JWT validation
│
├── routes/
│   ├── trading.js                      # SPOT TRADING ENDPOINTS
│   │   ├── GET  /markets               # Get all markets
│   │   ├── GET  /markets/:symbol       # Get market data
│   │   ├── GET  /portfolio             # Get holdings
│   │   ├── POST /orders                # Place order
│   │   ├── GET  /orders/open           # Open orders
│   │   ├── GET  /orders/history        # Order history
│   │   ├── GET  /orders/:id            # Order details
│   │   ├── DEL  /orders/:id            # Cancel order
│   │   └── GET  /trades                # Trade history
│   │
│   ├── auth.js                         # Authentication
│   ├── user.js                         # User management
│   └── ... (other routes)
│
├── utils/
│   ├── orderExecutor.js                # ORDER EXECUTION ENGINE
│   │   ├── fetchRealPrices()           # Get prices from CoinGecko
│   │   ├── updateMarketData()          # Store prices in DB
│   │   ├── matchOrdersWithPrices()     # Check if orders should execute
│   │   ├── executeOrder()              # Execute trade
│   │   └── startOrderExecutionEngine() # Main loop
│   │
│   ├── email.js                        # Email sending
│   └── initDb.js                       # Database initialization
│
└── prisma/
    ├── schema.prisma                   # DATABASE SCHEMA
    │   ├── User                        # Existing
    │   ├── Portfolio                   # NEW
    │   ├── CryptoMarket                # NEW
    │   ├── Order                       # NEW
    │   └── Trade                       # NEW
    │
    ├── migrations/
    │   └── 20260203_spot_trading/      # NEW MIGRATION
    │       └── migration.sql
    │
    └── seed.js                         # Database seeding
```

---

## 🔄 Data Flow Examples

### Example 1: User Places Buy Order

```javascript
// Frontend (trade.html)
const response = await fetch('/api/trading/orders', {
  method: 'POST',
  body: JSON.stringify({
    symbol: 'BTC/USDT',
    side: 'BUY',
    orderType: 'LIMIT',
    price: 60000,
    quantity: 0.5
  })
});
```

```javascript
// Backend (routes/trading.js)
router.post('/orders', authenticate, async (req, res) => {
  const { symbol, side, orderType, price, quantity } = req.body;
  
  // 1. Get portfolio
  let portfolio = await prisma.portfolio.findUnique({ where: { userId } });
  
  // 2. Check balance
  const totalCost = price * quantity; // 60000 * 0.5 = 30000
  if (assets.USDT < totalCost) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // 3. Lock funds
  assets.USDT -= totalCost;        // 50000 - 30000 = 20000
  assets._lockedIn += totalCost;   // 0 + 30000 = 30000
  
  // 4. Create order
  const order = await prisma.order.create({
    data: {
      userId, symbol, side, orderType, price, quantity, totalCost,
      status: 'OPEN'
    }
  });
  
  // 5. Save portfolio
  await prisma.portfolio.update({
    where: { userId },
    data: { assets }
  });
  
  return res.json({ success: true, order });
});
```

```javascript
// Order Executor (utils/orderExecutor.js)
async function matchOrdersWithPrices() {
  // 1. Get all OPEN orders
  const openOrders = await prisma.order.findMany({
    where: { status: 'OPEN' }
  });
  
  // 2. For each order
  for (const order of openOrders) {
    // 3. Get current market price
    const market = await prisma.cryptoMarket.findUnique({
      where: { symbol: order.symbol }
    });
    
    // 4. Check if order should execute
    if (order.side === 'BUY' && market.lastPrice <= order.price) {
      await executeOrder(order, market.lastPrice);
    }
  }
}

async function executeOrder(order, executionPrice) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: order.userId }
  });
  
  const assets = portfolio.assets;
  const [baseAsset] = order.symbol.split('/');
  
  // 1. Add crypto to portfolio
  assets.BTC = (assets.BTC || 0) + 0.5;
  
  // 2. Unlock USDT
  assets.USDT += (order.totalCost - executionPrice * order.quantity);
  assets._lockedIn -= order.totalCost;
  
  // 3. Create trade record
  await prisma.trade.create({
    data: {
      orderId: order.id,
      userId: order.userId,
      symbol: order.symbol,
      side: 'BUY',
      executionPrice,
      quantity: 0.5,
      totalValue: executionPrice * 0.5
    }
  });
  
  // 4. Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'FILLED', filledAt: new Date() }
  });
  
  // 5. Save portfolio
  await prisma.portfolio.update({
    where: { userId: order.userId },
    data: { assets }
  });
}
```

---

## 🔌 Integration Points

### Adding a New Crypto

1. **Add to CoinGecko Map**
```javascript
// backend/utils/orderExecutor.js
const CRYPTO_PRICES_MAP = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SHIB': 'shiba-inu'  // ADD HERE
};
```

2. **Restart Server**
```bash
npm start
```

3. **Market created automatically** when engine runs

---

### Adding a New Endpoint

1. **Create Route Handler**
```javascript
// backend/routes/trading.js
router.get('/my-endpoint', authenticate, async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

2. **Update Frontend**
```javascript
// trade.html
const response = await fetch(`${API_BASE_URL}/api/trading/my-endpoint`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

### Adding a Database Field

1. **Update Prisma Schema**
```prisma
// backend/prisma/schema.prisma
model Order {
  // ... existing fields ...
  leverage    Float @default(1)  // NEW FIELD
}
```

2. **Create Migration**
```bash
npx prisma migrate dev --name add_leverage_field
```

3. **Use in Code**
```javascript
const order = await prisma.order.create({
  data: { /* ... */ leverage: 2 }
});
```

---

## 🧪 Testing Guide

### Unit Tests

```javascript
// Test balance checking
describe('Order Placement', () => {
  test('should reject if insufficient balance', async () => {
    const response = await placeOrder({
      symbol: 'BTC/USDT',
      price: 100000,
      quantity: 1
    });
    
    expect(response.success).toBe(false);
    expect(response.error).toContain('Insufficient');
  });
});
```

### Integration Tests

```javascript
// Test full order flow
describe('Order Execution Flow', () => {
  test('should execute order when price matches', async () => {
    // 1. Place order at 50000
    // 2. Update market price to 49000
    // 3. Run executor
    // 4. Verify trade was created
    // 5. Verify portfolio updated
  });
});
```

### Manual Testing

```bash
# 1. Place order
curl -X POST http://localhost:3000/api/trading/orders \
  -H "Authorization: Bearer TOKEN" \
  -d '{"symbol":"BTC/USDT","side":"BUY","orderType":"LIMIT","price":50000,"quantity":0.1}'

# 2. Check open orders
curl http://localhost:3000/api/trading/orders/open \
  -H "Authorization: Bearer TOKEN"

# 3. Monitor execution
npm run dev
# Look for: "✓ BUY order executed"

# 4. Verify trade
curl http://localhost:3000/api/trading/trades \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔍 Debugging Tips

### Enable Detailed Logging

```javascript
// backend/utils/orderExecutor.js
console.log('DEBUG: Fetching prices...');
console.log('DEBUG: Current BTC price:', currentPrice);
console.log('DEBUG: Order price limit:', order.price);
```

### Check Database

```bash
npx prisma studio
# View all tables and data
```

### Monitor Order Execution

```bash
npm run dev
# Filter for "order executed" in logs
```

### API Testing

```bash
# Use Postman or curl with verbose output
curl -v http://localhost:3000/api/trading/markets

# Check response headers
curl -i http://localhost:3000/api/trading/portfolio
```

---

## 📊 Performance Optimization

### Database Indexes

All tables have indexes on frequently queried fields:
```sql
CREATE INDEX Order_userId_idx ON Order(userId);
CREATE INDEX Order_status_idx ON Order(status);
CREATE INDEX Trade_userId_idx ON Trade(userId);
```

### Query Optimization

```javascript
// ❌ BAD: N+1 queries
const orders = await prisma.order.findMany();
for (const order of orders) {
  const user = await prisma.user.findUnique({ where: { id: order.userId } });
}

// ✅ GOOD: Single query with relations
const orders = await prisma.order.findMany({
  include: { user: true }  // Fetch user in one query
});
```

### Caching Strategy

```javascript
// Cache market prices for 30 seconds
let cachedPrices = {};
let pricesCachedAt = 0;

async function getPricesWithCache() {
  const now = Date.now();
  if (now - pricesCachedAt < 30000) {
    return cachedPrices;  // Use cached
  }
  
  cachedPrices = await fetchRealPrices();
  pricesCachedAt = now;
  return cachedPrices;
}
```

---

## 🚨 Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Insufficient balance" | Not enough funds | Check portfolio balance |
| "Order not found" | Wrong order ID | Verify order ID |
| "Unauthorized" | Missing JWT token | Login and get token |
| "Database error" | Migration not run | Run `npx prisma migrate deploy` |
| "Price feed error" | CoinGecko unreachable | Check internet, retry |

### Error Recovery

```javascript
try {
  await executeOrder(order, price);
} catch (error) {
  console.error('Order execution failed:', error);
  
  // Log to database for debugging
  await logError({
    orderId: order.id,
    error: error.message,
    timestamp: new Date()
  });
  
  // Alert admin
  await sendAlert(`Order ${order.id} failed to execute`);
  
  // Unlock funds on failure
  await unlockFunds(order.userId, order);
}
```

---

## 📈 Scaling Considerations

### Current Limitations

- Single server instance
- Polling-based updates (not real-time)
- In-memory order matching
- No database replication

### Scaling Improvements

```javascript
// 1. Use message queue for orders
const kafka = new Kafka({ /* ... */ });
await producer.send({
  topic: 'orders',
  messages: [{ value: JSON.stringify(order) }]
});

// 2. Use WebSockets for real-time updates
io.on('connection', (socket) => {
  socket.emit('price-update', { symbol, price });
});

// 3. Redis caching for frequently accessed data
redis.set(`market:${symbol}`, JSON.stringify(market), 'EX', 30);
```

---

## 🔐 Security Considerations

### Input Validation

```javascript
// Validate all inputs
if (!Number.isFinite(price) || price <= 0) {
  throw new Error('Invalid price');
}

if (quantity <= 0 || !Number.isFinite(quantity)) {
  throw new Error('Invalid quantity');
}

if (!['BUY', 'SELL'].includes(side)) {
  throw new Error('Invalid side');
}
```

### Authentication Checks

```javascript
// Ensure user can only access their own data
const order = await prisma.order.findUnique({ where: { id: orderId } });
if (order.userId !== req.user.id) {
  throw new Error('Unauthorized');
}
```

### Fund Locking

```javascript
// Always lock before creating order
// Always unlock if order fails or is cancelled
// Use transactions for consistency
```

---

## 📚 Code Examples

### Creating a Custom Order Type

```javascript
// Example: Stop-Loss Order
if (orderType === 'STOP_LOSS') {
  // Price below which order triggers
  const stopPrice = price;
  const targetPrice = quantity; // reuse field for simplicity
  
  // Check if stop condition is met
  if (market.lastPrice <= stopPrice) {
    // Execute as market order at target price
    await executeOrder(order, targetPrice);
  }
}
```

### Creating a Fee System

```javascript
const FEE_RATE = 0.001; // 0.1%

async function executeOrder(order, executionPrice) {
  const totalValue = executionPrice * order.quantity;
  const fee = totalValue * FEE_RATE;
  
  // Deduct fee from proceeds
  assets.USDT += (totalValue - fee);
  
  // Track fees
  await prisma.fee.create({
    data: {
      userId: order.userId,
      orderId: order.id,
      amount: fee
    }
  });
}
```

---

## 🎯 Best Practices

1. **Always validate input** before processing
2. **Lock funds immediately** when order placed
3. **Unlock immediately** if validation fails
4. **Use transactions** for multi-step operations
5. **Log everything** for debugging
6. **Handle errors gracefully** with user-friendly messages
7. **Test edge cases** (zero balance, extreme prices, etc.)
8. **Use indexes** on frequently queried fields
9. **Cache when possible** to reduce database load
10. **Monitor performance** continuously

---

## 📞 Getting Help

- Check logs: `npm run dev`
- Database: `npx prisma studio`
- API docs in code comments
- Test with curl/Postman
- Read error messages carefully

---

## 🚀 Deployment Checklist

- [ ] All code committed
- [ ] Migrations created
- [ ] Tests passing
- [ ] Environment variables set
- [ ] Database backed up
- [ ] Server health check passing
- [ ] API endpoints tested
- [ ] Frontend responsive
- [ ] Error handling in place
- [ ] Logging enabled
- [ ] Performance acceptable
- [ ] Security audit passed

---

## 📝 Maintenance Tasks

### Daily
- Monitor logs for errors
- Check API response times
- Verify order execution

### Weekly
- Database backup
- Review slow queries
- Check error rate

### Monthly
- Performance analysis
- Security updates
- Feature planning

---

**Developer's Guide Complete**

For questions or improvements, refer to code comments and documentation.

Happy coding! 🚀
