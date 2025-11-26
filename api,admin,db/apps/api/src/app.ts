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

// Database connection is initialized in database/models/index.ts
// No need to authenticate here as it's already done during model initialization

// Security middleware
// Configure helmet to allow cross-origin resource sharing for images
// Exclude /uploads from helmet to avoid blocking image loading
const helmetMiddleware = helmet({
  crossOriginResourcePolicy: false, // Disable CORP completely to allow cross-origin images
  crossOriginEmbedderPolicy: false,
  // Disable contentSecurityPolicy for static files (images need to be loaded cross-origin)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:4001", "https://test3.fstu.uz", "http://10.0.2.2:4001", "*"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
});

// Apply helmet to all routes except /uploads
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads')) {
    // Skip helmet for uploads
    return next();
  }
  helmetMiddleware(req, res, next);
});

app.use(cors(config.cors));

// Logging
if (config.server.env === 'development') {
  app.use(morgan('dev'));
}

// Body parsing - increased limit for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle OPTIONS requests for CORS preflight on static files
app.options('/uploads/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

// Serve uploaded files statically
// Note: express.static serves files from the directory specified
// Request to /uploads/driver-photos/image.jpg will look for file at {uploadPath}/driver-photos/image.jpg
const uploadPath = config.upload.uploadPath;
console.log(`📁 Serving static files from: ${uploadPath}`);

// Middleware to log static file requests in development
if (config.server.env === 'development') {
  app.use('/uploads', (req, res, next) => {
    console.log(`📄 Static file request: ${req.path}`);
    next();
  });
}

// Serve static files with proper CORS headers
// Important: This middleware must be registered AFTER helmet to override its headers
app.use('/uploads', (req, res, next) => {
  // Remove any blocking headers before serving static files
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  next();
}, express.static(uploadPath, {
  setHeaders: (res, path) => {
    // Set CORS headers for static files - must match CORS config
    const origin = config.cors.origin === '*' ? '*' : (typeof config.cors.origin === 'string' ? config.cors.origin : '*');
    
    // Explicitly set headers to allow cross-origin loading
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Ensure content-type is set correctly for images
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    }
  }
}));

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: config.server.env,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      environment: config.server.env,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
app.use(config.server.apiPrefix, routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

