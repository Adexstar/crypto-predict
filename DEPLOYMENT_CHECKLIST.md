# Spot Trading Integration Checklist

## ✅ Pre-Deployment Checklist

Before deploying to production, verify all components are working:

### 1. Database & Migrations
- [ ] PostgreSQL running and accessible
- [ ] Run migration: `npx prisma migrate deploy`
- [ ] Verify new tables created: `npx prisma studio`
  - [ ] Portfolio table exists
  - [ ] CryptoMarket table exists
  - [ ] Order table exists
  - [ ] Trade table exists
- [ ] All indexes created successfully

### 2. Backend API
- [ ] Run `npm install` (installs node-fetch)
- [ ] Start server: `npm start`
- [ ] Verify no errors in console
- [ ] Test health check: `curl http://localhost:3000/health`
- [ ] Order Execution Engine started:
  - [ ] See "Starting Order Execution Engine..." in logs
  - [ ] Market data updates every 30 seconds
  - [ ] Orders matched every 10 seconds

### 3. API Endpoints
- [ ] GET `/api/trading/markets` returns data
- [ ] GET `/api/trading/portfolio` creates default portfolio
- [ ] POST `/api/trading/orders` accepts valid requests
- [ ] GET `/api/trading/orders/open` returns array
- [ ] DELETE `/api/trading/orders/:id` cancels orders

### 4. Frontend
- [ ] `trade.html` loads without errors
- [ ] Login redirects to trading page
- [ ] Market selector displays all pairs
- [ ] Price info updates
- [ ] Order forms load
- [ ] Portfolio displays
- [ ] Open orders table works
- [ ] Responsive on mobile/tablet

### 5. Order Flow
- [ ] Place order → appears in Open Orders
- [ ] Can see details of own orders only
- [ ] Can cancel order → funds returned
- [ ] Cancel refreshes portfolio correctly

### 6. Real-Time Updates
- [ ] Portfolio updates every 5 seconds
- [ ] Open orders refresh without page reload
- [ ] Prices update from CoinGecko

### 7. Error Handling
- [ ] Insufficient balance error shown
- [ ] Invalid inputs rejected
- [ ] Server errors logged properly
- [ ] User sees friendly error messages

### 8. Authentication
- [ ] Only logged-in users can trade
- [ ] Sessions persist
- [ ] Logout works
- [ ] Token validation enforced

---

## 🚀 Deployment Steps

### Railway (Recommended)

1. **Push to git:**
   ```bash
   git add .
   git commit -m "Add spot trading upgrade"
   git push
   ```

2. **Database migration on Railway:**
   ```bash
   # In Railway environment:
   npx prisma migrate deploy
   ```

3. **Restart service:**
   - Railway auto-deploys on push
   - Verify health endpoint is up

4. **Update environment variables:**
   - Ensure `DATABASE_URL` is set
   - Ensure `FRONTEND_URL` is correct
   - Ensure `JWT_SECRET` is set

### Vercel (Frontend)

1. Vercel auto-deploys HTML/CSS/JS
2. Ensure `js/api-config.js` points to correct backend
3. Test trading flow end-to-end

---

## 🔍 Verification Tests

### Test 1: Place BUY Order (Limit)
```bash
TOKEN=your_jwt_token
curl -X POST http://localhost:3000/api/trading/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USDT",
    "side": "BUY",
    "orderType": "LIMIT",
    "price": 50000,
    "quantity": 0.1
  }'

# Expected: Order created with status "OPEN"
```

### Test 2: Check Portfolio
```bash
curl http://localhost:3000/api/trading/portfolio \
  -H "Authorization: Bearer $TOKEN"

# Expected: Portfolio with locked USDT
```

### Test 3: Get Open Orders
```bash
curl http://localhost:3000/api/trading/orders/open \
  -H "Authorization: Bearer $TOKEN"

# Expected: Array with your order
```

### Test 4: Cancel Order
```bash
curl -X DELETE http://localhost:3000/api/trading/orders/ORDER_ID \
  -H "Authorization: Bearer $TOKEN"

# Expected: Order status "CANCELLED", funds unlocked
```

### Test 5: Place SELL Order
```bash
curl -X POST http://localhost:3000/api/trading/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USDT",
    "side": "SELL",
    "orderType": "LIMIT",
    "price": 70000,
    "quantity": 0.1
  }'

# Expected: Order created (if have crypto)
```

### Test 6: Market Order
```bash
curl -X POST http://localhost:3000/api/trading/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "ETH/USDT",
    "side": "BUY",
    "orderType": "MARKET",
    "price": 3200,
    "quantity": 1
  }'

# Expected: Immediate execution
```

---

## 📊 Performance Monitoring

### Server Logs to Monitor:

```
Updated BTC/USDT: $62,500        → Price feed working
Checking 5 open orders...          → Order engine running
✓ BUY order executed: 0.5 BTC      → Orders executing
```

### Database Performance:

Check slow queries:
```bash
SELECT query, calls, mean_time FROM pg_stat_statements
ORDER BY mean_time DESC;
```

---

## 🔐 Security Audit

- [ ] Authentication token required for all trading endpoints
- [ ] User can only see/manage their own orders
- [ ] Fund locking prevents double-spending
- [ ] Balance checked before order placement
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS protection on frontend
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Sensitive data not logged
- [ ] JWT tokens properly validated

---

## 📈 Monitoring Checklist

### Metrics to Watch:

1. **Order Execution Time:**
   - Target: < 5 seconds from price match
   - Monitor: Order.filledAt - triggeredAt

2. **API Response Time:**
   - Target: < 100ms
   - Monitor: Server logs

3. **Database Queries:**
   - Target: < 50ms per query
   - Monitor: Prisma logs

4. **Price Update Lag:**
   - Target: < 30 seconds
   - Monitor: CryptoMarket.lastUpdated

5. **Order Matching Frequency:**
   - Target: Every 10 seconds
   - Monitor: Server logs

6. **Error Rate:**
   - Target: < 0.1%
   - Monitor: Error logs

---

## 🆘 Rollback Plan

If issues occur:

1. **Database Issue:**
   ```bash
   # Rollback to previous migration
   npx prisma migrate resolve --rolled-back 20260203_spot_trading
   ```

2. **Backend Issue:**
   ```bash
   # Stop server
   # Deploy previous version
   # Restart
   ```

3. **Frontend Issue:**
   ```bash
   # Revert trade.html
   # Revert js/dashboard.js
   # Redeploy
   ```

---

## 📞 Support Escalation

### If Orders Don't Execute:
1. Check server logs for order matching
2. Check CoinGecko API is accessible
3. Verify prices are updating
4. Check order price vs current price

### If Balance Errors:
1. Check migration completed
2. Verify portfolio was created
3. Check locked funds in database
4. Review Order status

### If API Errors:
1. Check authentication token
2. Verify request body format
3. Check database connection
4. Review server logs

---

## ✨ Success Criteria

✅ All tests pass  
✅ Orders execute correctly  
✅ Prices update in real-time  
✅ Portfolio accurately tracked  
✅ No database errors  
✅ No API errors  
✅ Frontend responsive  
✅ Users can trade end-to-end  
✅ Orders persist after restart  
✅ Scalable for 100+ concurrent users  

---

## 📝 Documentation Links

- [Setup Guide](./SPOT_TRADING_SETUP.md)
- [Quick Start](./SPOT_TRADING_QUICK_START.md)
- [Summary](./SPOT_TRADING_SUMMARY.md)

---

## 🎯 Next Phase

After verification:

1. **Gather feedback** from early users
2. **Add features:**
   - Stop-loss orders
   - Take-profit orders
   - Order history export
   - Advanced charts
3. **Scale infrastructure:**
   - Load testing
   - Database optimization
   - Cache implementation
4. **Community:**
   - Tutorials
   - Help center articles
   - Video guides

---

**Ready to Go Live! 🚀**

Once all checks pass, your spot trading platform is production-ready.

Deployment Date: ____________  
Verified By: ________________  
Notes: _____________________
