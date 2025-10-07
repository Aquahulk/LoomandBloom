import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
// import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

// OTP expiry time in milliseconds (5 minutes)
const OTP_EXPIRY_TIME = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { userId, method } = await request.json();

    if (!userId || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new OTP
    const newOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(newOtp).digest('hex');
    
    // Calculate new expiry time
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_TIME);

    // Update user with new OTP hash and expiry for phone only
    if (method === 'phone') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneOtpHash: otpHash,
          otpExpiry
        }
      });

      // Send OTP via SMS (do not fail request if SMS sending fails)
      try {
        await sendSMS(
          user.phone,
          `Your new BharatPushpam verification code is: ${newOtp}. This code will expire in 5 minutes.`
        );
      } catch (smsError) {
        console.error('Resend OTP SMS error:', smsError);
        // Continue; user can request again and OTP is already updated
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid method. Only phone OTP is supported.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'New OTP sent to your phone'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resending OTP' },
      { status: 500 }
    );
  }
}