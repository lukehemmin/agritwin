import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { initializeDatabase } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './utils/errorHandler';

// Routes
import sensorsRouter from './routes/sensors';
import farmRouter from './routes/farm';
import analyticsRouter from './routes/analytics';
import plantsRouter from './routes/plants';

// WebSocket handlers
import { setupSocketHandlers } from './websocket/socketHandlers';

// Services
import { PlantGrowthSimulator } from './services/PlantGrowthSimulator';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // Initialize database
    const db = await initializeDatabase();
    logger.info('Database initialized successfully');

    // Create Express app
    const app = express();
    const server = createServer(app);

    // Initialize Socket.IO
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    // Middleware
    app.use(helmet());
    app.use(compression());
    app.use(cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true
    }));
    app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Make database available to routes
    app.locals.db = db;
    app.locals.io = io;

    // Routes
    app.use('/api/sensors', sensorsRouter);
    app.use('/api/farm', farmRouter);
    app.use('/api/analytics', analyticsRouter);
    app.use('/api/plants', plantsRouter);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Setup WebSocket handlers
    setupSocketHandlers(io, db);

    // Start plant growth simulation
    const plantSimulator = PlantGrowthSimulator.getInstance();
    plantSimulator.start();

    // Error handling middleware
    app.use(errorHandler);

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`📊 API available at http://localhost:${PORT}/api`);
      logger.info(`🔌 WebSocket available at http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();