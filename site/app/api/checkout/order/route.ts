import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionFromRequest } from '@/app/lib/auth';
import { headers } from 'next/headers';
import { getSettings } from '@/app/lib/settings';
import { isPincodeAllowed, validatePincode } from '@/app/lib/security';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security configurations
const MAX_AMOUNT = 100000; // default ₹1000 max per order
const MIN_AMOUNT = 100; // default ₹1 minimum
const RATE_LIMIT_WINDOW = 60 * 1000; // default 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // default 5 requests per minute per IP

function validateAmount(amount: number): boolean {
  return amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
}

function validateCurrency(currency: string): boolean {
  return ['INR'].includes(currency.toUpperCase());
}

function rateLimit(ip: string, windowMs: number = RATE_LIMIT_WINDOW, maxRequests: number = RATE_LIMIT_MAX_REQUESTS): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  if (typeof input === 'number') {
    return Math.abs(Math.floor(input));
  }
  return input;
}

export async function POST(req: NextRequest) {
  try {
    // Load settings and enforce maintenance mode
    const settings = await getSettings();
    if (settings.maintenanceMode) {
      return NextResponse.json({ error: 'Checkout is temporarily disabled' }, { status: 503 });
    }
    // Require authenticated session
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please login to place an order.' }, { status: 401 });
    }
    // Block new orders for accounts on hold
    try {
      const user = await prisma.user.findUnique({ where: { email: session.email } });
      if (user?.isOnHold) {
        return NextResponse.json({ error: 'Your account is on hold. Please contact support to lift the hold.' }, { status: 403 });
      }
    } catch (_) {}
    // Get client IP for rate limiting
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded
      ? forwarded.split(',')[0]
      : req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting (settings-controlled)
    if (!rateLimit(ip, settings.checkout.rateLimitWindowMs, settings.checkout.rateLimitMaxRequests)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate environment variables
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay configuration missing');
      return NextResponse.json(
        { error: 'Payment service temporarily unavailable' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (_) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Sanitize and validate inputs
    const clientAmount = sanitizeInput(body.amount);
    const currency = sanitizeInput(body.currency) || 'INR';
    const items = sanitizeInput(body.items) || [];
    const customerInfo = sanitizeInput(body.customerInfo) || {};
    const clientShippingFee = sanitizeInput(body.shippingFee) || 0;
    // Force server-side trusted customer info from session
    customerInfo.email = session.email;
    if (session.name) customerInfo.name = session.name;

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Compute server-side subtotal using canonical prices from DB (ignore client-provided unitPrice)
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    if (productIds.length !== items.length) {
      return NextResponse.json(
        { error: 'Invalid cart items: missing productId' },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true }
    });
    const productById = Object.fromEntries(products.map(p => [p.id, p]));

    const variantIds = items.map((i: any) => i.variantId).filter(Boolean);
    const variants = variantIds.length > 0
      ? await prisma.variant.findMany({
          where: { id: { in: variantIds as string[] } },
          select: { id: true, productId: true, priceDelta: true }
        })
      : [];
    const variantById = Object.fromEntries(variants.map(v => [v.id, v]));

    // Build server-trusted items with canonical unitPrice
    const serverItems = items.map((item: any) => {
      const qty = Math.max(1, Math.floor(item.quantity || 1));
      const product = productById[item.productId];
      if (!product) {
        throw new Error('Invalid product in cart');
      }
      let unit = Math.floor(product.price || 0);
      if (item.variantId) {
        const variant = variantById[item.variantId];
        if (variant && variant.productId === item.productId) {
          unit = unit + Math.floor(variant.priceDelta || 0);
        }
      }
      return {
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: qty,
        unitPrice: unit
      };
    });

    const itemsSubtotal = serverItems.reduce((sum: number, it: any) => sum + (it.quantity * it.unitPrice), 0);
    const shippingFee = itemsSubtotal >= (settings.checkout.freeDeliveryThreshold || 0)
      ? 0
      : (settings.checkout.deliveryFee || 0);
    const taxPercent = Math.max(0, Math.floor((settings.invoice?.taxPercent ?? 0)));
    const taxAmount = Math.floor(itemsSubtotal * taxPercent / 100);
    const amount = itemsSubtotal + taxAmount + shippingFee;

    // Validate amount using settings constraints
    const min = settings.checkout.minOrderValue || MIN_AMOUNT;
    const max = settings.checkout.maxOrderValue || MAX_AMOUNT;
    if (!amount || typeof amount !== 'number' || amount < min || amount > max) {
      return NextResponse.json(
        { error: `Amount must be between ₹${min/100} and ₹${max/100}` },
        { status: 400 }
      );
    }

    // Validate currency
    if (!validateCurrency(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency. Only INR is supported.' },
        { status: 400 }
      );
    }

    // Enforce allowed delivery area (Pune district) using settings prefixes
    const pincode = (customerInfo.pincode || '').toString().trim();
    if (!validatePincode(pincode)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit pincode' },
        { status: 400 }
      );
    }
    const allowedPrefixes = (settings.checkout as any).allowedPincodePrefixes || [];
    if (!isPincodeAllowed(pincode, allowedPrefixes)) {
      return NextResponse.json(
        { error: 'We currently deliver only within Pune (Maharashtra) district pincodes.' },
        { status: 400 }
      );
    }

    // Create order in database first

    // Create order in database first
    const orderReceipt = `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const dbOrder = await prisma.order.create({
      data: {
        customer: customerInfo.name || 'Customer',
        email: customerInfo.email || null,
        phone: customerInfo.phone || null,
        address: customerInfo.address || 'Not provided',
        city: customerInfo.city || 'Not provided',
        pincode: pincode || '000000',
        totalMrp: itemsSubtotal,
        totalPrice: amount,
        shippingFee: shippingFee,
        status: 'PENDING',
        // Optionally record tax percentage applied for reference
        paymentDetails: JSON.stringify({ taxPercent, taxAmount }),
        items: {
          create: serverItems.map((it: any) => ({
            productId: it.productId,
            variantId: it.variantId,
            quantity: it.quantity,
            unitPrice: it.unitPrice
          }))
        }
      }
    });

    // Initialize Razorpay
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create Razorpay order
    const razorpayOrder = await instance.orders.create({
      amount: amount, // in paise
      currency: currency.toUpperCase(),
      receipt: orderReceipt,
      notes: {
        orderId: dbOrder.id,
        customerEmail: customerInfo.email || '',
        customerPhone: customerInfo.phone || ''
      }
    });

    // Update database order with Razorpay order ID
    await prisma.order.update({
      where: { id: dbOrder.id },
      data: { paymentId: razorpayOrder.id }
    });

    // Log successful order creation (without sensitive data)
    console.log(`Order created: ${dbOrder.id}, Subtotal: ₹${itemsSubtotal/100}, Tax(${taxPercent}%): ₹${taxAmount/100}, Shipping: ₹${shippingFee/100}, Amount: ₹${amount/100}, IP: ${ip}`);

    return NextResponse.json({
      order: razorpayOrder,
      orderId: dbOrder.id
    });

  } catch (error: any) {
    console.error('Order creation error:', error);
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }
}


