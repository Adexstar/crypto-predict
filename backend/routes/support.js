import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Create support ticket
router.post('/', async (req, res) => {
  try {
    const { subject, message, category } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message required' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        subject,
        message,
        category: category || 'general',
        status: 'OPEN',
        priority: 'MEDIUM'
      }
    });

    res.status(201).json({ ticket, message: 'Support ticket created' });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get user tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Admin: Get all tickets
router.get('/all', authenticate, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { status } = req.query;
    
    const where = status ? { status: status.toUpperCase() } : {};
    
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tickets });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Admin: Update ticket status
router.patch('/:ticketId/status', authenticate, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { status } = req.body;
    
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.ticketId },
      data: {
        status: status.toUpperCase(),
        closedAt: status === 'CLOSED' ? new Date() : null
      }
    });

    res.json({ ticket, message: 'Ticket status updated' });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Admin: Add reply to ticket
router.post('/:ticketId/reply', authenticate, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { message } = req.body;
    
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.ticketId }
    });

    const replies = ticket.replies ? JSON.parse(ticket.replies) : [];
    replies.push({
      message,
      author: req.user.email,
      timestamp: new Date().toISOString()
    });

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: req.params.ticketId },
      data: {
        replies: JSON.stringify(replies),
        status: 'IN_PROGRESS'
      }
    });

    res.json({ ticket: updatedTicket, message: 'Reply added' });
  } catch (error) {
    console.error('Reply ticket error:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

export default router;
