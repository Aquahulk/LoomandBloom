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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const reviews = readReviews();
  const next = reviews.filter((r) => r.id !== id);
  writeReviews(next);
  return NextResponse.json({ ok: true });
}