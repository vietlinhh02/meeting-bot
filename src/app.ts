import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import logger from './config/logger.js';

/**
 * Create and configure Express application
 * @returns Configured Express application instance
 */
const createApp = (): Application => {
  const app: Application = express();

  // Security middleware - protect against common vulnerabilities
  app.use(helmet());

  // CORS middleware - configure cross-origin requests
  app.use(cors());

  // Compression middleware - compress response bodies
  app.use(compression());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req: Request, _res: Response, next) => {
    logger.info('Incoming request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (_req, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // API v1 routes
  app.use('/api/v1', routes);

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
