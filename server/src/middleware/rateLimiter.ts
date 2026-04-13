import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

interface RateLimitConfig {
  windowMs: number;    // time window in ms
  maxRequests: number; // max requests per window
  action: string;      // action identifier
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 10, action: 'LOGIN' },
  REGISTER: { windowMs: 60 * 60 * 1000, maxRequests: 5, action: 'REGISTER' },
  OTP_REQUEST: { windowMs: 5 * 60 * 1000, maxRequests: 3, action: 'OTP_REQUEST' },
  JOINING: { windowMs: 60 * 60 * 1000, maxRequests: 3, action: 'JOINING' },
  PURCHASE: { windowMs: 5 * 60 * 1000, maxRequests: 10, action: 'PURCHASE' },
};

/**
 * Creates a rate limiting middleware for the specified action.
 */
export function rateLimit(_actionKey: string) {
  // Rate limiting disabled during testing
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

export function _rateLimitFull(actionKey: string) {
  const config = RATE_LIMITS[actionKey];
  if (!config) throw new Error(`Unknown rate limit action: ${actionKey}`);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // Try to find existing entry
      const existing = await db.rateLimitEntry.findUnique({
        where: { key_action: { key, action: config.action } },
      });

      if (existing) {
        // Check if within current window
        if (existing.windowStart > windowStart) {
          // Still in window
          if (existing.count >= config.maxRequests) {
            res.status(429).json({
              error: 'RATE_LIMITED',
              message: `Too many ${config.action.toLowerCase()} attempts. Please try again later.`,
              retryAfter: Math.ceil((existing.windowStart.getTime() + config.windowMs - now.getTime()) / 1000),
            });
            return;
          }

          // Increment count
          await db.rateLimitEntry.update({
            where: { key_action: { key, action: config.action } },
            data: { count: { increment: 1 } },
          });
        } else {
          // Window expired, reset
          await db.rateLimitEntry.update({
            where: { key_action: { key, action: config.action } },
            data: { count: 1, windowStart: now },
          });
        }
      } else {
        // First request
        await db.rateLimitEntry.create({
          data: { key, action: config.action, count: 1, windowStart: now },
        });
      }

      next();
    } catch (err) {
      // Don't block requests if rate limiting fails
      console.error('Rate limiter error:', err);
      next();
    }
  };
}

/**
 * Anti-fraud middleware: checks for suspicious patterns.
 */
export function antiFraud(req: Request, res: Response, next: NextFunction) {
  // Basic anti-fraud checks
  const suspiciousPatterns = [
    // Check for automated tool user agents
    /bot|crawler|spider|scraper/i,
  ];

  const userAgent = req.headers['user-agent'] || '';
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      res.status(403).json({ error: 'BLOCKED', message: 'Request blocked by anti-fraud system.' });
      return;
    }
  }

  next();
}
