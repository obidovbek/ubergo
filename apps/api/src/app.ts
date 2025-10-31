/**
 * Express Application Setup
 */

import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import sequelize from './database/models/index.js';
import { initializeFirebase } from './services/FirebaseService.js';

// Global error handlers to prevent crashes
process.on('uncaughtException', (error: Error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

const app: Application = express();

// Initialize Firebase Admin SDK
initializeFirebase();

// Initialize database connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully');
  })
  .catch((err: Error) => {
    console.error('❌ Unable to connect to database:', err);
  });

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

// Logging
if (config.server.env === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(config.upload.uploadPath));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.server.env 
  });
});

// API routes
app.use(config.server.apiPrefix, routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

