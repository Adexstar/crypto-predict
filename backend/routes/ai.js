import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { createHistoryEntry } from '../utils/history.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Subscribe to AI Bot
router.post('/subscribe', async (req, res) => {
  try {
    const { amount, strategy, positionSize, stopLoss, takeProfit } = req.body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine which balance to use
    let isTestingBalance = false;
    let subscriptionType = 'unknown';
    let returnRate = 0;
    let profit = 0;

    // Check if using testing balance
    if (amount >= 100 && amount <= 500 && user.testingBalance >= amount) {
      isTestingBalance = true;
      subscriptionType = 'testing';
      returnRate = 0.10; // 10% return for testing balance
      profit = amount * returnRate;

      // Check daily limit for testing balance (2 times per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const testingHistory = await prisma.history.findMany({
        where: {
          userId: req.user.id,
          action: 'ai.subscription',
          createdAt: { gte: today }
        }
      });
      
      // Count testing subscriptions from today
      const todayTestingCount = testingHistory.filter(h => {
        try {
          const meta = typeof h.meta === 'string' ? JSON.parse(h.meta) : h.meta;
          return meta?.subscriptionType === 'testing';
        } catch (e) {
          return false;
        }
      }).length;

      if (todayTestingCount >= 2) {
        return res.status(400).json({
          error: 'Daily limit reached for testing balance subscriptions (max 2 per day)',
          dailyUsed: todayTestingCount,
          dailyLimit: 2
        });
      }
    } 
    // Check if using real balance (deposited funds)
    else if (amount >= 100 && amount <= 10000 && user.balance >= amount) {
      isTestingBalance = false;
      subscriptionType = 'deposited';
      returnRate = 1.5; // 150% return for real deposits
      profit = amount * returnRate;

      // Check daily limit for real balance (1 time per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const depositedHistory = await prisma.history.findMany({
        where: {
          userId: req.user.id,
          action: 'ai.subscription',
          createdAt: { gte: today }
        }
      });
      
      // Count deposited subscriptions from today
      const todayDepositedCount = depositedHistory.filter(h => {
        try {
          const meta = typeof h.meta === 'string' ? JSON.parse(h.meta) : h.meta;
          return meta?.subscriptionType === 'deposited';
        } catch (e) {
          return false;
        }
      }).length;

      if (todayDepositedCount >= 1) {
        return res.status(400).json({
          error: 'Daily limit reached for deposited funds subscriptions (max 1 per day)',
          dailyUsed: todayDepositedCount,
          dailyLimit: 1
        });
      }
    } 
    else {
      return res.status(400).json({
        error: 'Invalid subscription amount or insufficient balance',
        testingBalance: user.testingBalance,
        realBalance: user.balance,
        testingLimits: '$100-$500 (10% return, max 2x/day)',
        depositedLimits: '$100-$10,000 (150% return, max 1x/day)'
      });
    }

    // Update the appropriate balance
    const updateData = {
      history: {
        create: [
          createHistoryEntry('ai.subscription', {
            subscriptionAmount: amount,
            profit: profit,
            returnRate: (returnRate * 100) + '%',
            subscriptionType: subscriptionType,
            strategy: strategy || 'moderate',
            positionSize: positionSize || 5,
            stopLoss: stopLoss || 3,
            takeProfit: takeProfit || 6
          }),
          createHistoryEntry('ai.profit', {
            profit: profit,
            returnRate: (returnRate * 100) + '%',
            fromSubscription: amount,
            subscriptionType: subscriptionType
          })
        ]
      }
    };

    // Deduct from appropriate balance and add profit
    if (isTestingBalance) {
      updateData.testingBalance = user.testingBalance - amount + profit;
    } else {
      updateData.balance = user.balance - amount + profit;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
        testingBalance: true,
        spotBalance: true,
        futuresBalance: true,
        optionsBalance: true,
        history: {
          where: { action: { startsWith: 'ai.' } },
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('✅ AI subscription activated:', {
      userId: req.user.id,
      subscriptionType,
      subscriptionAmount: amount,
      profit: profit.toFixed(2),
      returnRate: (returnRate * 100) + '%'
    });

    res.status(200).json({
      user: updatedUser,
      subscription: {
        amount,
        profit,
        totalValue: amount + profit,
        returnRate: (returnRate * 100) + '%',
        subscriptionType,
        strategy: strategy || 'moderate',
        message: `AI Bot activated! $${amount.toFixed(2)} subscription → $${profit.toFixed(2)} profit earned! (${returnRate * 100}% return)`
      }
    });
  } catch (error) {
    console.error('AI subscription error:', error);
    res.status(500).json({ error: 'Failed to activate AI subscription', details: error.message });
  }
});

// Get AI performance history
router.get('/history', async (req, res) => {
  try {
    const aiHistory = await prisma.history.findMany({
      where: {
        userId: req.user.id,
        action: { startsWith: 'ai.' }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        message: true,
        meta: true,
        createdAt: true
      }
    });

    res.json({ history: aiHistory });
  } catch (error) {
    console.error('Failed to fetch AI history:', error);
    res.status(500).json({ error: 'Failed to fetch AI history', details: error.message });
  }
});

export default router;
