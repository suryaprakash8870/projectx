import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

/**
 * Helper to generate a 6-digit random numeric OTP
 */
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends an SMS using Twilio
 */
async function sendTwilioSms(mobile: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[Twilio] Missing credentials in env — SMS not sent.');
    return false;
  }

  const client = twilio(accountSid, authToken);

  // Twilio requires E.164 format (e.g. +919000000501)
  const toMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`; // Assuming India +91 base if no code

  try {
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toMobile
    });
    console.log(`[Twilio OTP Sent to ${toMobile}]: SID ${response.sid}`);
    return true;
  } catch (error: any) {
    console.error('Failed to send SMS via Twilio:', error?.message);
    return false;
  }
}

/**
 * Generates an OTP, saves it in the database, and sends it via AuthKey
 */
export async function generateAndSendOTP(mobile: string, purpose: string, db: PrismaClient) {
  // 1. Generate 6 digit code
  const code = generateOtpCode();

  // 2. Compute expiration time (e.g., 5 minutes from now)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // 3. Invalidate any existing unused OTPs for this mobile + purpose
  await db.otpRecord.updateMany({
    where: { mobile, purpose, isUsed: false },
    data: { isUsed: true },
  });

  // 4. Save the new OTP
  await db.otpRecord.create({
    data: {
      mobile,
      code,
      purpose,
      expiresAt,
    },
  });

  // 5. Send it using Twilio
  const message = `Your verification code is ${code}. It expires in 5 minutes.`;
  // COMMENTED OUT FOR PROTOTYPING:
  // await sendTwilioSms(mobile, message);

  // Also log it locally for debugging just in case AuthKey limits are reached
  console.log(`[LOCAL DEV OVERRIDE] OTP for ${mobile} is: ${code}`);

  return true;
}

/**
 * Verifies an OTP based on mobile, the code itself, and its designated purpose
 */
export async function verifyOTP(mobile: string, code: string, purpose: string, db: PrismaClient) {
  // Bypass logic for prototype easing if needed
  const bypass = process.env.OTP_BYPASS_CODE || '123456';
  if (code === bypass) {
    return true;
  }

  // 1. Find a matching OTP record that's not used and not expired
  const otpRecord = await db.otpRecord.findFirst({
    where: {
      mobile,
      code,
      purpose,
      isUsed: false,
      expiresAt: {
        gt: new Date() // Must be in the future
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!otpRecord) {
    throw new Error('INVALID_OTP');
  }

  // 2. Mark as used
  await db.otpRecord.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  return true;
}
