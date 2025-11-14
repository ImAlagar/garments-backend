// app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import 'dotenv/config';

import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import prisma from './config/database.js';

const app = express();

// Security Middleware
app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
    } else {
        callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));
app.use(compression());

// Logging
app.use(morgan('combined'));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check (should work even if database is down)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Database Health Check
app.get('/api/health/database', async (req, res) => {
  try {
    // Check if prisma is defined
    if (!prisma) {
      return res.status(503).json({
        success: false,
        status: 'DATABASE_ERROR',
        message: 'Prisma client is not initialized',
        timestamp: new Date().toISOString()
      });
    }

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      status: 'DATABASE_CONNECTED',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'DATABASE_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint - MOVE THIS AFTER HEALTH CHECKS
app.get('/api/debug/database', async (req, res) => {
  try {
    // Check if prisma is defined
    if (!prisma) {
      return res.status(500).json({ 
        success: false, 
        error: 'Prisma client is undefined',
        timestamp: new Date().toISOString()
      });
    }

    // Test basic database operations with error handling for each table
    const tables = {};
    const tableQueries = [
      { name: 'users', query: prisma.user.count() },
      { name: 'products', query: prisma.product.count() },
      { name: 'orders', query: prisma.order.count() },
      { name: 'categories', query: prisma.category.count() },
      { name: 'subcategories', query: prisma.subcategory.count() },
      { name: 'ratings', query: prisma.rating.count() },
      { name: 'homeSliders', query: prisma.homeSlider.count() },
      { name: 'contacts', query: prisma.contact.count() }
    ];

    // Execute all queries with individual error handling
    for (const { name, query } of tableQueries) {
      try {
        tables[name] = await query;
      } catch (error) {
        tables[name] = `ERROR: ${error.message}`;
      }
    }

    res.json({ 
      success: true, 
      tables,
      databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Missing',
      nodeEnv: process.env.NODE_ENV || 'not set',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Main Routes (AFTER debug endpoints)
app.use('/api', routes);

// Error Handling
app.use(errorHandler);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

export default app;