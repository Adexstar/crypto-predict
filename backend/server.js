import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { spawn } from 'child_process';
import { initializeDatabase } from './utils/initDb.js';
import { getEmailStatus } from './utils/email.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import depositRoutes from './routes/deposit.js';
import withdrawalRoutes from './routes/withdrawal.js';
import supportRoutes from './routes/support.js';
import announcementRoutes from './routes/announcement.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Run Prisma migrations on startup
async function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Running Prisma migrations...');
    const prismaProcess = spawn('npx', ['prisma', 'migrate', 'deploy', '--skip-generate'], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    prismaProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Migrations completed successfully');
        resolve();
      } else {
        console.log('⚠️  Prisma migrate deploy exited with code ' + code + ' (this may be OK if no migrations needed)');
        resolve(); // Don't fail on migrate deploy, it might have warnings
      }
    });

    prismaProcess.on('error', (err) => {
      console.log('⚠️  Could not run migrations automatically:', err.message);
      resolve(); // Don't block startup if migrations can't run
    });
  });
}

// Trust Railway's reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet());

// CORS configuration with proper preflight handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : ['*'];
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  // Use X-Forwarded-For header for IP (Railway/proxy setup)
  skip: (req) => !req.ip
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/announcements', announcementRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
(async () => {
  try {
    // Run Prisma migrations first
    await runMigrations();
    
    // Initialize database tables
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'not configured'}`);
      
      // Log email configuration status
      const emailStatus = getEmailStatus();
      console.log(`📧 Email Service: ${emailStatus.configured ? '✅ CONFIGURED (' + emailStatus.service + ')' : '❌ NOT CONFIGURED'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
})();
