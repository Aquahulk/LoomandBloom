// Security utilities for the payment system

export interface SecurityConfig {
  maxAmount: number;
  minAmount: number;
  allowedCurrencies: string[];
  rateLimitWindow: number;
  rateLimitMaxRequests: number;
}

export const SECURITY_CONFIG: SecurityConfig = {
  maxAmount: 100000, // ₹1000
  minAmount: 100,    // ₹1
  allowedCurrencies: ['INR'],
  rateLimitWindow: 60 * 1000, // 1 minute
  rateLimitMaxRequests: 5
};

export function validatePaymentAmount(amount: number): { valid: boolean; error?: string } {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (amount < SECURITY_CONFIG.minAmount) {
    return { 
      valid: false, 
      error: `Minimum amount is ₹${SECURITY_CONFIG.minAmount / 100}` 
    };
  }

  if (amount > SECURITY_CONFIG.maxAmount) {
    return { 
      valid: false, 
      error: `Maximum amount is ₹${SECURITY_CONFIG.maxAmount / 100}` 
    };
  }

  return { valid: true };
}

export function validateCurrency(currency: string): { valid: boolean; error?: string } {
  if (!SECURITY_CONFIG.allowedCurrencies.includes(currency.toUpperCase())) {
    return { 
      valid: false, 
      error: `Only ${SECURITY_CONFIG.allowedCurrencies.join(', ')} currencies are supported` 
    };
  }

  return { valid: true };
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 255); // Limit length
}

export function sanitizeNumber(input: any): number {
  const num = Number(input);
  if (isNaN(num)) return 0;
  return Math.abs(Math.floor(num));
}

export function generateSecureReceipt(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `rcpt_${timestamp}_${random}`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export function validatePincode(pincode: string): boolean {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { 
      count: 1, 
      resetTime: now + SECURITY_CONFIG.rateLimitWindow 
    });
    return { allowed: true };
  }

  if (userLimit.count >= SECURITY_CONFIG.rateLimitMaxRequests) {
    return { 
      allowed: false, 
      resetTime: userLimit.resetTime 
    };
  }

  userLimit.count++;
  return { allowed: true };
}

export function logSecurityEvent(event: string, details: Record<string, any>, ip?: string) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip: ip || 'unknown',
    details: {
      ...details,
      // Remove sensitive data from logs
      amount: details.amount ? `₹${details.amount / 100}` : undefined,
      email: details.email ? details.email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined,
      phone: details.phone ? details.phone.replace(/(.{2}).*(.{2})/, '$1***$2') : undefined
    }
  };

  console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
}
