import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// CoinGecko API for free real-time prices
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

const CRYPTO_PRICES_MAP = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'SOL': 'solana',
  'DOGE': 'dogecoin',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'LINK': 'chainlink',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'ATOM': 'cosmos',
  'NEAR': 'near',
  'FTM': 'fantom',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'LIDO': 'lido-dao'
};

/**
 * Fetch real-time prices from CoinGecko
 */
export async function fetchRealPrices(symbols = []) {
  try {
    const cryptos = symbols.length > 0 
      ? symbols.map(s => CRYPTO_PRICES_MAP[s]).filter(Boolean)
      : Object.values(CRYPTO_PRICES_MAP);
    
    if (cryptos.length === 0) {
      console.warn('No valid cryptos to fetch');
      return {};
    }
    
    const url = `${COINGECKO_API}/simple/price?ids=${cryptos.join(',')}&vs_currencies=usd&include_24hr_vol=true&include_market_cap=false&include_last_updated_at=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Convert to symbol -> price mapping
    const priceMap = {};
    Object.entries(CRYPTO_PRICES_MAP).forEach(([symbol, coingeckoId]) => {
      if (data[coingeckoId]) {
        priceMap[symbol] = {
          price: data[coingeckoId].usd,
          volume24h: data[coingeckoId].usd_24h_vol || 0,
          lastUpdated: new Date(data[coingeckoId].last_updated_at * 1000)
        };
      }
    });
    
    return priceMap;
  } catch (error) {
    console.error('Error fetching prices from CoinGecko:', error);
    return {};
  }
}

/**
 * Update market data in database
 */
export async function updateMarketData() {
  try {
    const symbols = Object.keys(CRYPTO_PRICES_MAP);
    const prices = await fetchRealPrices(symbols);
    
    for (const [baseAsset, priceData] of Object.entries(prices)) {
      const symbol = `${baseAsset}/USDT`;
      
      const market = await prisma.cryptoMarket.upsert({
        where: { symbol },
        update: {
          lastPrice: priceData.price,
          volume24h: priceData.volume24h,
          lastUpdated: new Date()
        },
        create: {
          symbol,
          baseAsset,
          quoteAsset: 'USDT',
          lastPrice: priceData.price,
          volume24h: priceData.volume24h,
          lastUpdated: new Date()
        }
      });
      
      console.log(`Updated ${symbol}: $${priceData.price}`);
    }
  } catch (error) {
    console.error('Error updating market data:', error);
  }
}

/**
 * Match pending orders with market prices
 * Execute orders when price is reached
 */
export async function matchOrdersWithPrices() {
  try {
    // Get all open orders
    const openOrders = await prisma.order.findMany({
      where: {
        status: { in: ['OPEN', 'PARTIALLY_FILLED'] }
      },
      include: {
        user: true
      }
    });
    
    console.log(`Checking ${openOrders.length} open orders for execution...`);
    
    for (const order of openOrders) {
      const [baseAsset] = order.symbol.split('/');
      
      // Get current market price
      const market = await prisma.cryptoMarket.findUnique({
        where: { symbol: order.symbol }
      });
      
      if (!market) {
        console.log(`Market data not found for ${order.symbol}`);
        continue;
      }
      
      const currentPrice = market.lastPrice;
      let shouldExecute = false;
      
      // Check if order should be executed
      if (order.side === 'BUY' && currentPrice <= order.price) {
        // BUY limit order: execute if market price is at or below order price
        shouldExecute = true;
      } else if (order.side === 'SELL' && currentPrice >= order.price) {
        // SELL limit order: execute if market price is at or above order price
        shouldExecute = true;
      }
      
      if (shouldExecute) {
        await executeOrder(order, currentPrice);
      }
    }
  } catch (error) {
    console.error('Error matching orders:', error);
  }
}

/**
 * Execute an order at a specific price
 */
export async function executeOrder(order, executionPrice) {
  try {
    const userId = order.userId;
    const [baseAsset] = order.symbol.split('/');
    
    // Get portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId }
    });
    
    if (!portfolio) {
      console.error(`Portfolio not found for user ${userId}`);
      return;
    }
    
    const assets = portfolio.assets || {};
    const totalValue = executionPrice * order.quantity;
    
    // BUY order execution
    if (order.side === 'BUY') {
      // Add crypto to portfolio
      assets[baseAsset] = (assets[baseAsset] || 0) + order.quantity;
      
      // Remove locked USDT
      assets._lockedIn = (assets._lockedIn || 0) - order.totalCost;
      
      // Create trade record
      await prisma.trade.create({
        data: {
          orderId: order.id,
          userId,
          symbol: order.symbol,
          side: 'BUY',
          executionPrice,
          quantity: order.quantity,
          totalValue
        }
      });
      
      console.log(`✓ BUY order executed: ${order.quantity} ${baseAsset} @ $${executionPrice}`);
    }
    
    // SELL order execution
    if (order.side === 'SELL') {
      // Add USDT to portfolio
      assets.USDT = (assets.USDT || 0) + totalValue;
      
      // Remove locked crypto
      assets._locked = assets._locked || {};
      assets._locked[baseAsset] = (assets._locked[baseAsset] || 0) - order.quantity;
      
      // Create trade record
      await prisma.trade.create({
        data: {
          orderId: order.id,
          userId,
          symbol: order.symbol,
          side: 'SELL',
          executionPrice,
          quantity: order.quantity,
          totalValue
        }
      });
      
      console.log(`✓ SELL order executed: ${order.quantity} ${baseAsset} @ $${executionPrice}`);
    }
    
    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'FILLED',
        filledQuantity: order.quantity,
        filledAt: new Date()
      }
    });
    
    // Update portfolio
    await prisma.portfolio.update({
      where: { userId },
      data: { assets }
    });
  } catch (error) {
    console.error('Error executing order:', error);
  }
}

/**
 * Start the order execution engine
 * Runs every 10 seconds
 */
export function startOrderExecutionEngine() {
  console.log('🚀 Starting Order Execution Engine...');
  
  // Update market data every 30 seconds
  setInterval(async () => {
    await updateMarketData();
  }, 30000);
  
  // Match orders every 10 seconds
  setInterval(async () => {
    await matchOrdersWithPrices();
  }, 10000);
  
  // Initial run
  updateMarketData();
  matchOrdersWithPrices();
}

export default {
  fetchRealPrices,
  updateMarketData,
  matchOrdersWithPrices,
  executeOrder,
  startOrderExecutionEngine
};
