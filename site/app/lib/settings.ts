import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/app/lib/prisma';
// Avoid importing bcrypt in this module to keep it safe for server-rendered public pages

export type Settings = {
  maintenanceMode: boolean;
  holdBannerText: string;
  supportEmail: string;
  whatsappNumber: string;
  storeAddress: string;
  // Editable content sections
  about?: {
    heading?: string;
    intro?: string;
    highlights?: string[];
    social?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
    };
  };
  contact?: {
    heading?: string;
    intro?: string;
  };
  legal?: {
    privacy?: string; // Markdown or plain text
    terms?: string;   // Markdown or plain text
  };
  admin?: {
    username: string;
    passwordHash: string;
  };
  invoice?: {
    companyName: string;
    companyAddress: string;
    gstNumber?: string;
    logoPublicId?: string;
    footerNote?: string;
    themeColor?: string;
    taxPercent?: number;
  };
  checkout: {
    minOrderValue: number; // in paise
    maxOrderValue: number; // in paise
    freeDeliveryThreshold: number; // in paise
    deliveryFee: number; // in paise
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    allowedPincodePrefixes?: string[];
  };
  bookings: {
    bookingMaxDaysAdvance: number;
    sameDayCutoffMinutes: number; // minutes from midnight
    blackoutDates: string[]; // ISO dates
    serviceAllowedPincodes: string[];
    capacityPerSlot: number;
  };
  notifications: {
    enableSms: boolean;
  };
};

// Password hashing and verification are handled in server-only code (see lib/password.ts)

const defaults: Settings = {
  maintenanceMode: false,
  holdBannerText: 'Your account is on hold. Please contact support to get it unhold.',
  supportEmail: 'support@example.com',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '6260122094',
  storeAddress: '',
  about: {
    heading: 'About Loom and Bloom',
    intro: 'We create elegant jewelry and women’s accessories — necklaces, bracelets, earrings, rings, and hair accessories — crafted to elevate your everyday style.',
    highlights: [
      'Nickel-free, skin-friendly materials',
      'Free delivery on orders above ₹999',
      'Gift-ready packaging',
      'Made in India craftsmanship',
      'Timeless, versatile designs'
    ],
    social: {
      instagram: '',
      facebook: '',
      twitter: ''
    }
  },
  contact: {
    heading: 'Contact Us',
    intro: 'Have questions about our jewelry or accessories? Send us a message and we\'ll respond as soon as possible.'
  },
  legal: {
    privacy: 'Your privacy is important to us. We collect only necessary information to process orders and improve our services. We do not sell your personal data. Contact us for any data-related requests.',
    terms: 'By using our website and services, you agree to our policies on orders, payments, returns, and service bookings. Please contact us for clarifications or support.'
  },
  admin: {
    username: 'admin',
    passwordHash: '',
  },
  invoice: {
    companyName: 'Loom and Bloom',
    companyAddress: 'Shop No. 24, Ganga Altus, Near Manipal Hospital, Kharadi - 411014',
    gstNumber: '',
    logoPublicId: '',
    footerNote: 'Thank you for your purchase!',
    themeColor: '#16a34a',
    taxPercent: 0
  },
  checkout: {
    minOrderValue: 100, // ₹1
    maxOrderValue: 100000, // ₹1000
    freeDeliveryThreshold: 99900, // ₹999
    deliveryFee: 5000, // ₹50 default delivery fee
    rateLimitWindowMs: 60_000,
    rateLimitMaxRequests: 5,
    // Allow only Pune district pincodes by default; admin can edit prefixes
    // 411xxx, 412xxx cover most of Pune city/rural; 4131xx includes Baramati/Indapur
    allowedPincodePrefixes: ['411', '412', '4131'],
  },
  bookings: {
    bookingMaxDaysAdvance: 30,
    sameDayCutoffMinutes: 720, // 12:00 PM
    blackoutDates: [],
    // Default to Pune district pincodes for service bookings as well
    serviceAllowedPincodes: ['411', '412', '4131'],
    capacityPerSlot: 5,
  },
  notifications: {
    enableSms: true,
  },
};

function settingsPath() {
  // Project root for Next app is the site directory; store under data/settings.json
  return path.join(process.cwd(), 'data', 'settings.json');
}

export async function getSettings(): Promise<Settings> {
  try {
    // Prefer database-backed settings for serverless deployments
    const record = await (prisma as any).siteSettings?.findUnique({ where: { id: 'main' } });
    if (record?.data) {
      return mergeSettings(record.data as any);
    }
    // Fallback to file-based settings (useful for local dev)
    const file = settingsPath();
    const raw = await fs.readFile(file, 'utf-8');
    const parsed = JSON.parse(raw);
    return mergeSettings(parsed);
  } catch {
    return { ...defaults };
  }
}

export async function saveSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const merged = mergeSettings({ ...current, ...partial });
  // Persist in database first to support Vercel's read-only filesystem
  try {
    await (prisma as any).siteSettings.upsert({
      where: { id: 'main' },
      update: { data: merged },
      create: { id: 'main', data: merged }
    });
    return merged;
  } catch (dbErr) {
    // Fallback to writing to local file (useful in local dev)
    try {
      const file = settingsPath();
      await fs.mkdir(path.dirname(file), { recursive: true });
      const toPersist: any = JSON.parse(JSON.stringify(merged));
      if (toPersist.admin) {
        delete toPersist.admin.password;
      }
      await fs.writeFile(file, JSON.stringify(toPersist, null, 2), 'utf-8');
      return merged;
    } catch (fileErr) {
      // Propagate an error if both DB and file writes fail
      throw fileErr;
    }
  }
}

function mergeSettings(input: any): Settings {
  return {
    maintenanceMode: !!input.maintenanceMode,
    holdBannerText: typeof input.holdBannerText === 'string' && input.holdBannerText.trim() ? input.holdBannerText.trim() : defaults.holdBannerText,
    supportEmail: typeof input.supportEmail === 'string' ? input.supportEmail : defaults.supportEmail,
    whatsappNumber: typeof input.whatsappNumber === 'string' ? input.whatsappNumber : defaults.whatsappNumber,
    storeAddress: typeof input.storeAddress === 'string' ? input.storeAddress : defaults.storeAddress,
    about: {
      heading: typeof input?.about?.heading === 'string' ? input.about.heading : defaults.about!.heading,
      intro: typeof input?.about?.intro === 'string' ? input.about.intro : defaults.about!.intro,
      highlights: Array.isArray(input?.about?.highlights) ? input.about.highlights : defaults.about!.highlights,
      social: {
        instagram: typeof input?.about?.social?.instagram === 'string' ? input.about.social.instagram : defaults.about!.social!.instagram,
        facebook: typeof input?.about?.social?.facebook === 'string' ? input.about.social.facebook : defaults.about!.social!.facebook,
        twitter: typeof input?.about?.social?.twitter === 'string' ? input.about.social.twitter : defaults.about!.social!.twitter,
      },
    },
    contact: {
      heading: typeof input?.contact?.heading === 'string' ? input.contact.heading : defaults.contact!.heading,
      intro: typeof input?.contact?.intro === 'string' ? input.contact.intro : defaults.contact!.intro,
    },
    legal: {
      privacy: typeof input?.legal?.privacy === 'string' ? input.legal.privacy : defaults.legal!.privacy,
      terms: typeof input?.legal?.terms === 'string' ? input.legal.terms : defaults.legal!.terms,
    },
    admin: {
      username: typeof input?.admin?.username === 'string' && input.admin.username.trim() ? input.admin.username.trim() : defaults.admin!.username,
      passwordHash: typeof input?.admin?.passwordHash === 'string' ? input.admin.passwordHash : defaults.admin!.passwordHash,
    },
    invoice: {
      companyName: typeof input?.invoice?.companyName === 'string' && input.invoice.companyName.trim() ? input.invoice.companyName.trim() : defaults.invoice!.companyName,
      companyAddress: typeof input?.invoice?.companyAddress === 'string' && input.invoice.companyAddress.trim() ? input.invoice.companyAddress.trim() : defaults.invoice!.companyAddress,
      gstNumber: typeof input?.invoice?.gstNumber === 'string' ? input.invoice.gstNumber : defaults.invoice!.gstNumber,
      logoPublicId: typeof input?.invoice?.logoPublicId === 'string' ? input.invoice.logoPublicId : defaults.invoice!.logoPublicId,
      footerNote: typeof input?.invoice?.footerNote === 'string' ? input.invoice.footerNote : defaults.invoice!.footerNote,
      themeColor: typeof input?.invoice?.themeColor === 'string' && /^#([0-9a-fA-F]{3}){1,2}$/.test(input.invoice.themeColor) ? input.invoice.themeColor : defaults.invoice!.themeColor,
      taxPercent: num(input?.invoice?.taxPercent, defaults.invoice!.taxPercent || 0),
    },
    checkout: {
      minOrderValue: num(input?.checkout?.minOrderValue, defaults.checkout.minOrderValue),
      maxOrderValue: num(input?.checkout?.maxOrderValue, defaults.checkout.maxOrderValue),
      freeDeliveryThreshold: num(input?.checkout?.freeDeliveryThreshold, defaults.checkout.freeDeliveryThreshold),
      deliveryFee: num(input?.checkout?.deliveryFee, defaults.checkout.deliveryFee),
      rateLimitWindowMs: num(input?.checkout?.rateLimitWindowMs, defaults.checkout.rateLimitWindowMs),
      rateLimitMaxRequests: num(input?.checkout?.rateLimitMaxRequests, defaults.checkout.rateLimitMaxRequests),
      allowedPincodePrefixes: Array.isArray(input?.checkout?.allowedPincodePrefixes)
        ? input.checkout.allowedPincodePrefixes.filter((p: any) => typeof p === 'string')
        : (defaults.checkout as any).allowedPincodePrefixes,
    },
    bookings: {
      bookingMaxDaysAdvance: num(input?.bookings?.bookingMaxDaysAdvance, defaults.bookings.bookingMaxDaysAdvance),
      sameDayCutoffMinutes: num(input?.bookings?.sameDayCutoffMinutes, defaults.bookings.sameDayCutoffMinutes),
      blackoutDates: Array.isArray(input?.bookings?.blackoutDates) ? input.bookings.blackoutDates.filter((d: any) => typeof d === 'string') : defaults.bookings.blackoutDates,
      serviceAllowedPincodes: Array.isArray(input?.bookings?.serviceAllowedPincodes) ? input.bookings.serviceAllowedPincodes.filter((p: any) => typeof p === 'string') : defaults.bookings.serviceAllowedPincodes,
      capacityPerSlot: num(input?.bookings?.capacityPerSlot, defaults.bookings.capacityPerSlot),
    },
    notifications: {
      enableSms: !!(input?.notifications?.enableSms ?? defaults.notifications.enableSms),
    },
  };
}

function num(val: any, fallback: number): number {
  const n = typeof val === 'string' ? parseInt(val, 10) : val;
  return typeof n === 'number' && !Number.isNaN(n) ? n : fallback;
}