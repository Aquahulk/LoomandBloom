import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/sms';

// OTP expiry time in milliseconds (5 minutes)
const OTP_EXPIRY_TIME = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json();

    // Validate input
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate phone OTP only
    const phoneOtp = crypto.randomInt(100000, 999999).toString();

    // Hash phone OTP for secure storage
    const phoneOtpHash = crypto.createHash('sha256').update(phoneOtp).digest('hex');

    // Calculate expiry time
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_TIME);

    // Create user with pending status
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        emailOtpHash: null, // Skip email verification
        phoneOtpHash,
        otpExpiry,
        isVerified: false
      }
    });

    // Send OTP via SMS only
    try {
      await sendSMS(
        phone,
        `Your BharatPushpam verification code is: ${phoneOtp}. This code will expire in 5 minutes.`
      );
    } catch (error) {
      console.error('Error sending OTP:', error);
      // Continue even if sending fails, user can request resend
    }

    return NextResponse.json({
      message: 'Registration initiated. Please verify with OTP.',
      userId: user.id
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}