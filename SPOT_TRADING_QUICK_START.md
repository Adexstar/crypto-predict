# Spot Trading - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### 1. Install Dependencies & Run Migrations
```bash
cd backend
npm install
npx prisma migrate deploy
npm start
```

Server runs on `http://localhost:3000`

### 2. Open Trading Dashboard
Go to: `http://localhost:3000/trade.html`

Login with your account credentials.

---

## 💡 How to Trade

### BUY Crypto (Limit Order)

1. **Select Trading Pair** → BTC/USDT
2. **Choose Tab** → Limit
3. **Enter Price** → 60,000 (the price you want to buy at)
4. **Enter Amount** → 0.5 (BTC)
5. **Click "Buy (Limit)"**

**What happens:**
- System locks 30,000 USDT from your portfolio
- Order shows in "Open Orders" as OPEN
- When BTC price drops to $60,000 or below → Order AUTO-EXECUTES
- You get 0.5 BTC, USDT is deducted

### SELL Crypto (Limit Order)

1. **Select Trading Pair** → BTC/USDT
2. **Choose Tab** → Limit
3. **Enter Price** → 70,000 (the price you want to sell at)
4. **Enter Amount** → 0.5 (BTC you want to sell)
5. **Click "Sell (Limit)"**

**What happens:**
- System locks 0.5 BTC from your portfolio
- Order shows in "Open Orders" as OPEN
- When BTC price rises to $70,000 or above → Order AUTO-EXECUTES
- You get 35,000 USDT, BTC is deducted

### CANCEL Order

Click the **"Cancel"** button next to any OPEN order in the "Open Orders" table.

Your locked funds are instantly returned.

---

## 📊 Understanding the UI

### **Market Selector (Top)**
Quick toggle between crypto pairs
- BTC/USDT
- ETH/USDT
- BNB/USDT
- XRP/USDT
- ADA/USDT
- SOL/USDT

Click any to see real-time price data.

### **Price Info**
Shows current market conditions:
- **Price** → Current BTC price (e.g., $62,500)
- **24h Change** → % change in last 24h (green/red)
- **24h High** → Highest price in 24h
- **24h Low** → Lowest price in 24h

### **Order Form Tabs**

**[Limit]** → You set the price
- Order waits until market hits your price
- Works like stock trading
- Best for getting a good deal

**[Market]** → Instant execution
- Buys/sells at current market price immediately
- No waiting
- Price might be slightly higher/lower

### **Percentage Buttons**
Quick shortcuts to use % of your balance:
- **25%** → Use 1/4 of available USDT
- **50%** → Use half of available USDT
- **75%** → Use 3/4 of available USDT
- **100%** → Use all available USDT

### **Open Orders Table**
- **Pair** → What you're trading (BTC/USDT)
- **Side** → BUY (green) or SELL (red)
- **Price** → Your order price
- **Amount** → How much you're trading
- **Status** → OPEN (waiting), FILLED (done), CANCELLED
- **Action** → Cancel button (only for OPEN orders)

### **Portfolio**
Your crypto holdings:
- Shows each crypto you own
- Shows amount in crypto
- Shows USD value
- Updates in real-time

---

## 🎯 Trading Examples

### Example 1: Buy the Dip
```
BTC current price: $65,000
You think it will drop to $60,000

ACTION:
1. Open trade.html
2. Select BTC/USDT, Limit tab
3. Price: 60,000
4. Amount: 1.0
5. Click "Buy (Limit)"

RESULT:
- Order placed, waiting
- Your USDT is locked
- When BTC hits $60,000 → AUTO BUY
- You get 1 BTC
```

### Example 2: Sell for Profit
```
You have 1 BTC
Current price: $62,500
You want $70,000

ACTION:
1. Open trade.html
2. Select BTC/USDT, Limit tab
3. Switch side to SELL
4. Price: 70,000
5. Amount: 1.0
6. Click "Sell (Limit)"

RESULT:
- Order placed, waiting
- Your BTC is locked
- When BTC hits $70,000 → AUTO SELL
- You get 70,000 USDT
- Profit: 7,500 USDT
```

### Example 3: Quick Trade (Market Order)
```
ETH price: $3,200
You want to buy NOW

ACTION:
1. Open trade.html
2. Select ETH/USDT, Market tab
3. Amount: 10 ETH
4. Click "Buy (Market)"

RESULT:
- Order executes IMMEDIATELY at ~$3,200
- You get 10 ETH
- Price might be $3,200-$3,205 (slight slippage)
```

---

## 📈 Real-Time Updates

**Order Execution Engine checks every 10 seconds:**
- Fetches current prices from CoinGecko
- Compares against your pending orders
- Auto-executes when price matches

**Portfolio updates every 5 seconds:**
- Reflects new balances
- Shows locked/available funds

---

## ❌ Troubleshooting

### Order not executing?
- Check market price in "Price Info" section
- Make sure you have enough balance
- Wait a few more seconds (checks every 10 seconds)
- Check server logs: `npm run dev`

### "Insufficient Balance" error?
- You don't have enough USDT or crypto
- Check your Portfolio section
- Or check backend logs for locked funds

### Order disappeared?
- It was executed! Check "Trade History" or Portfolio
- Or it was cancelled - funds returned

### Chart not loading?
- It's a placeholder for now
- Real prices update in "Price Info" section
- Use the price data provided

---

## 🔐 Security Notes

- All orders are tied to your account
- Only you can cancel your orders
- Funds are locked until order fills or is cancelled
- No leverage/margin in spot trading
- Real money simulation (not actual crypto trading unless connected to exchange)

---

## 📱 Mobile Usage

Site is fully responsive! Trade from:
- Desktop
- Tablet
- Mobile phone

All features work the same on all devices.

---

## 💾 Your Data

**Backend tracks:**
- All your orders (executed, cancelled, pending)
- All your trades (execution prices, dates)
- Your portfolio (current holdings)
- Price history

**Data stored in:**
- PostgreSQL database
- Associated with your user account

---

## 🎓 Learning

This is a realistic spot trading simulator:
- **Just like Bybit Spot**
- **Just like Binance Spot**
- **Just like stock exchanges**

You learn real trading concepts:
- ✓ Limit orders
- ✓ Market orders
- ✓ Order management
- ✓ Portfolio tracking
- ✓ Real-time prices
- ✓ Trade execution

---

## 🚀 Next Features (Coming Soon)

- Advanced charting (TradingView integration)
- Stop-loss / Take-profit orders
- Trading history export
- Performance analytics
- More crypto pairs
- Leverage trading (if desired)

---

## 🤝 Support

Issues? Check:
1. Server is running (`npm start`)
2. Database migration ran (`npx prisma migrate deploy`)
3. You're logged in
4. You have available balance

Or check server logs for error messages.

---

**Happy Trading! 📊💰**
