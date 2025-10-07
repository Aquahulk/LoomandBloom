import twilio from 'twilio';

// Get Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID; // optional

function normalizeToE164(to: string): string {
  const raw = (to || '').trim();
  if (!raw) return to;
  if (raw.startsWith('+')) return raw;
  const digits = raw.replace(/\D/g, '');
  // Indian mobile numbers: 10 digits starting 6-9
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }
  // Already includes 91 country code without plus
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  // Leading 0 for local format
  if (digits.length === 11 && digits.startsWith('0')) {
    const nd = digits.slice(1);
    if (/^[6-9]\d{9}$/.test(nd)) return `+91${nd}`;
  }
  return to;
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    const normalizedTo = normalizeToE164(to);
    // If credentials are missing, log instead of sending (keeps flows working during setup)
    if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
      console.log('[SMS dev] Credentials missing, not sending. Preview below:');
      console.log(`To: ${normalizedTo}`);
      console.log(`Message: ${message}`);
      console.log('OTP from SMS:', message.match(/\d{6}/)?.[0] || 'No OTP found');
      return true;
    }

    // Initialize Twilio client (send even in development when credentials are present)
    const client = twilio(accountSid, authToken);

    const params: any = {
      body: message,
      to: normalizedTo,
    };
    if (messagingServiceSid) {
      params.messagingServiceSid = messagingServiceSid;
    } else {
      params.from = fromNumber;
    }

    const res = await client.messages.create(params);
    console.log('[SMS] Sent via Twilio:', {
      sid: res.sid,
      to,
      status: res.status,
      dateCreated: res.dateCreated,
    });

    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}