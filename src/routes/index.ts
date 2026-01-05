import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * Root API endpoint
 * Provides API information and available endpoints
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Meeting Bot API v1',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: '/health',
      api: '/api/v1',
    },
  });
});

/**
 * API v1 Routes
 * Mount additional route modules here as they are created:
 * - router.use('/auth', authRoutes);
 * - router.use('/meetings', meetingRoutes);
 * - router.use('/recordings', recordingRoutes);
 */

export default router;
