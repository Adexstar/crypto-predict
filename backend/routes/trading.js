import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ===== MARKETS =====

/**
 * GET /api/trading/markets
 * Get all available crypto markets with current prices
 */
router.get('/markets', async (req, res) => {
  try {
    const markets = await prisma.cryptoMarket.findMany({
      orderBy: { symbol: 'asc' }
    });
    
    res.json({
      success: true,
      markets
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch markets'
    });
  }
});

/**
 * GET /api/trading/markets/:symbol
 * Get detailed market data for a specific symbol
 */
router.get('/markets/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const market = await prisma.cryptoMarket.findUnique({
      where: { symbol }
    });
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }
    
    res.json({
      success: true,
      market
    });
  } catch (error) {
    console.error('Error fetching market:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market'
    });
  }
});

// ===== PORTFOLIO =====

/**
 * GET /api/trading/portfolio
 * Get user's portfolio (all crypto holdings)
 */
router.get('/portfolio', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let portfolio = await prisma.portfolio.findUnique({
      where: { userId }
    });
    
    // Create portfolio if it doesn't exist
    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          userId,
          assets: {
            USDT: 10000  // Starting balance
          }
        }
      });
    }
    
    res.json({
      success: true,
      portfolio
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio'
    });
  }
});

// ===== ORDERS =====

/**
 * POST /api/trading/orders
 * Place a new order (BUY or SELL)
 */
router.post('/orders', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, side, orderType, price, quantity } = req.body;
    
    // Validation
    if (!symbol || !side || !orderType || !price || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    if (!['BUY', 'SELL'].includes(side)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid side. Must be BUY or SELL'
      });
    }
    
    if (!['LIMIT', 'MARKET'].includes(orderType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order type. Must be LIMIT or MARKET'
      });
    }
    
    // Get or create portfolio
    let portfolio = await prisma.portfolio.findUnique({
      where: { userId }
    });
    
    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          userId,
          assets: { USDT: 10000 }
        }
      });
    }
    
    const assets = portfolio.assets || {};
    const totalCost = price * quantity;
    
    // For BUY orders: check USDT balance
    if (side === 'BUY') {
      const usdtBalance = assets.USDT || 0;
      if (usdtBalance < totalCost) {
        return res.status(400).json({
          success: false,
          error: `Insufficient USDT balance. Have ${usdtBalance}, need ${totalCost}`
        });
      }
      
      // Lock USDT in portfolio
      assets.USDT -= totalCost;
      assets._lockedIn = (assets._lockedIn || 0) + totalCost;
    }
    
    // For SELL orders: check crypto balance
    if (side === 'SELL') {
      const [baseAsset] = symbol.split('/');
      const cryptoBalance = assets[baseAsset] || 0;
      if (cryptoBalance < quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient ${baseAsset} balance. Have ${cryptoBalance}, need ${quantity}`
        });
      }
      
      // Lock crypto in portfolio
      assets[baseAsset] -= quantity;
      assets._locked = (assets._locked || {});
      assets._locked[baseAsset] = (assets._locked[baseAsset] || 0) + quantity;
    }
    
    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        symbol,
        side,
        orderType,
        price,
        quantity,
        totalCost
      }
    });
    
    // Update portfolio with locked funds
    await prisma.portfolio.update({
      where: { userId },
      data: { assets }
    });
    
    res.status(201).json({
      success: true,
      order,
      message: `${side} order placed for ${quantity} ${symbol} at $${price}`
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place order'
    });
  }
});

/**
 * GET /api/trading/orders/open
 * Get all open orders for the user
 */
router.get('/orders/open', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: { in: ['OPEN', 'PARTIALLY_FILLED'] }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching open orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch open orders'
    });
  }
});

/**
 * GET /api/trading/orders/history
 * Get order history for the user
 */
router.get('/orders/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: { in: ['FILLED', 'CANCELLED'] }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const total = await prisma.order.count({
      where: {
        userId,
        status: { in: ['FILLED', 'CANCELLED'] }
      }
    });
    
    res.json({
      success: true,
      orders,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order history'
    });
  }
});

/**
 * GET /api/trading/orders/:orderId
 * Get details of a specific order
 */
router.get('/orders/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { trades: true }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check ownership
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

/**
 * DELETE /api/trading/orders/:orderId
 * Cancel an open order and unlock funds
 */
router.delete('/orders/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check ownership
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Can only cancel OPEN or PARTIALLY_FILLED orders
    if (!['OPEN', 'PARTIALLY_FILLED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel ${order.status} order`
      });
    }
    
    // Get portfolio
    let portfolio = await prisma.portfolio.findUnique({
      where: { userId }
    });
    
    const assets = portfolio.assets || {};
    const [baseAsset] = order.symbol.split('/');
    
    // Unlock funds
    if (order.side === 'BUY') {
      // Return USDT
      assets.USDT = (assets.USDT || 0) + order.totalCost;
      assets._lockedIn = (assets._lockedIn || 0) - order.totalCost;
    } else if (order.side === 'SELL') {
      // Return crypto
      assets[baseAsset] = (assets[baseAsset] || 0) + (order.quantity - order.filledQuantity);
      assets._locked = assets._locked || {};
      assets._locked[baseAsset] = (assets._locked[baseAsset] || 0) - (order.quantity - order.filledQuantity);
    }
    
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });
    
    // Update portfolio
    await prisma.portfolio.update({
      where: { userId },
      data: { assets }
    });
    
    res.json({
      success: true,
      order: updatedOrder,
      message: 'Order cancelled and funds unlocked'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

// ===== TRADES =====

/**
 * GET /api/trading/trades
 * Get all completed trades for the user
 */
router.get('/trades', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const total = await prisma.trade.count({
      where: { userId }
    });
    
    res.json({
      success: true,
      trades,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trades'
    });
  }
});

export default router;
