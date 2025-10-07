import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET(_req: NextRequest) {
  try {
    const services = await prisma.service.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    console.error('Admin list services error:', error);
    return NextResponse.json({ error: 'Failed to list services' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, priceMin, imagePublicId } = body || {};
    if (!name || !description || typeof priceMin !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const slug = slugify(name);
    const service = await prisma.service.create({
      data: { name, slug, description, priceMin, imagePublicId }
    });
    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    console.error('Admin create service error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Service with similar name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}