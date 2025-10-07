import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/app/lib/settings';

// Public settings endpoint exposing only safe, non-secret fields
export async function GET(_req: NextRequest) {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      whatsappNumber: settings.whatsappNumber,
      storeAddress: settings.storeAddress,
      contact: {
        heading: settings.contact?.heading ?? 'Contact Us',
        intro: settings.contact?.intro ?? '',
      },
      invoice: {
        taxPercent: settings.invoice?.taxPercent ?? 0,
      },
      checkout: {
        freeDeliveryThreshold: settings.checkout.freeDeliveryThreshold,
        deliveryFee: settings.checkout.deliveryFee,
        minOrderValue: settings.checkout.minOrderValue,
        maxOrderValue: settings.checkout.maxOrderValue,
      }
    });
  } catch (error) {
    console.error('Failed to load settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}