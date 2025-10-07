import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId, phoneOtp } = await request.json();

    if (!userId || !phoneOtp) {
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

    // Check if OTP is expired
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify phone OTP
    // Hash the provided OTP to compare with stored hash
    const providedOtpHash = crypto.createHash('sha256').update(phoneOtp).digest('hex');
    const isValid = providedOtpHash === user.phoneOtpHash;

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Mark user as verified and clear OTP fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        phoneOtpHash: null,
        otpExpiry: null
      }
    });

    // Prepare response

    // Return success with token
    const response = NextResponse.json({
      message: 'Account verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }, { status: 200 });

    // Set session cookie using auth helper (JWT-like)
    setSessionCookie(response, { email: user.email, name: user.name });

    return response;
    
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}