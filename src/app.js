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

// Routes
app.use('/api', routes);


// Add this temporary route to test database connectivity
app.get('/api/debug/database', async (req, res) => {
  try {
    // Test basic database operations
    const tables = {
      users: await prisma.user.count(),
      products: await prisma.product.count(),
      orders: await prisma.order.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.subcategory.count(),
      ratings: await prisma.rating.count(),
      homeSliders: await prisma.homeSlider.count(),
      contacts: await prisma.contact.count()
    };

    res.json({ success: true, tables });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error Handling
app.use(errorHandler);

// 404 Handler - FIXED: Use proper approach
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

export default app;