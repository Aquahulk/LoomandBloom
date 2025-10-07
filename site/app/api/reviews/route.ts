import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const REVIEWS_PATH = path.resolve(process.cwd(), 'data', 'reviews.json');

function readReviews(): any[] {
  try {
    const data = fs.readFileSync(REVIEWS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeReviews(reviews: any[]) {
  fs.mkdirSync(path.dirname(REVIEWS_PATH), { recursive: true });
  fs.writeFileSync(REVIEWS_PATH, JSON.stringify(reviews, null, 2));
}

export async function GET() {
  const reviews = readReviews();
  return NextResponse.json({ reviews });
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name || '').trim();
  const comment = String(body.comment || '').trim();
  const rating = Number(body.rating || 0);
  const locale = String(body.locale || 'en');
  const orderId = body.orderId ? String(body.orderId) : undefined;
  const productSlug = body.productSlug ? String(body.productSlug) : undefined;

  if (!name || !comment || !(rating >= 1 && rating <= 5)) {
    return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 });
  }

  const reviews = readReviews();
  const id = Math.random().toString(36).slice(2);
  const createdAt = new Date().toISOString();
  const review = { id, name, comment, rating, locale, orderId, productSlug, createdAt };
  reviews.unshift(review);
  writeReviews(reviews);
  return NextResponse.json({ ok: true, review });
}