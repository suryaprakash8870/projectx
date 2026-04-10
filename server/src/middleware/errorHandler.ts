import { Request, Response, NextFunction } from 'express';

const KNOWN_ERRORS: Record<string, { status: number; message: string }> = {
  INVALID_REFERRAL_CODE:  { status: 400, message: 'Invalid referral code. Please check and try again.' },
  ALREADY_PROCESSED:      { status: 409, message: 'This joining request has already been processed.' },
  INSUFFICIENT_COUPON:    { status: 400, message: 'Insufficient coupon balance.' },
  INSUFFICIENT_INCOME:    { status: 400, message: 'Insufficient income balance.' },
  PRODUCT_NOT_AVAILABLE:  { status: 400, message: 'Product is not available.' },
  INVALID_CREDENTIALS:    { status: 401, message: 'Invalid mobile/email or password.' },
  USER_NOT_ACTIVE:        { status: 403, message: 'Your account is not active yet. Please wait for admin approval.' },
  JOINING_REQUEST_EXISTS: { status: 409, message: 'You already have a pending joining request.' },
  DUPLICATE_MOBILE:       { status: 400, message: 'This mobile number is already registered.' },
  DUPLICATE_EMAIL:        { status: 400, message: 'This email address is already registered.' },
  INVALID_AMOUNT:         { status: 400, message: 'Invalid transfer amount.' },
  INSUFFICIENT_PURCHASE_BALANCE: { status: 400, message: 'Insufficient purchase wallet balance.' },
  SLOT_TAKEN:             { status: 409, message: 'A vendor already exists for this category in this PIN code area.' },
  ALREADY_VENDOR:         { status: 409, message: 'You are already registered as a vendor.' },
};

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[ERROR]', err.message);

  // Check for Prisma unique constraint errors
  if (err.message.includes('Unique constraint failed')) {
    if (err.message.includes('mobile')) {
      res.status(400).json({ error: 'DUPLICATE_MOBILE', message: KNOWN_ERRORS.DUPLICATE_MOBILE.message });
      return;
    }
    if (err.message.includes('email')) {
      res.status(400).json({ error: 'DUPLICATE_EMAIL', message: KNOWN_ERRORS.DUPLICATE_EMAIL.message });
      return;
    }
  }

  // Prisma "No User found" / P2025 / NotFoundError — commonly happens when
  // a JWT token references a userId that no longer exists (e.g. after DB reset).
  // Return 401 so the client can auto-logout and force re-authentication.
  if (err.message.includes('No User found') || err.message.includes('No record was found')) {
    res.status(401).json({ error: 'USER_NOT_FOUND', message: 'Your session is invalid. Please login again.' });
    return;
  }

  const known = KNOWN_ERRORS[err.message];
  if (known) {
    res.status(known.status).json({ error: err.message, message: known.message });
    return;
  }

  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' });
}
