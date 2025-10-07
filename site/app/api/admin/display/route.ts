import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { uploadImage, deleteImage } from '@/app/lib/cloudinary-server';
import { revalidateTag, revalidatePath } from 'next/cache';

// Helper to prevent external deletes from hanging the request
async function withTimeout<T>(promise: Promise<T>, ms = 4000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TimeoutError')), ms))
  ]);
}

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_authenticated')?.value === 'true';
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const type = req.nextUrl.searchParams.get('type') || undefined;
  const categorySlug = req.nextUrl.searchParams.get('category') || undefined;
  const locale = req.nextUrl.searchParams.get('locale') || undefined;
  const where: any = {};
  if (type) where.type = type as any;
  if (locale) where.locale = locale;
  if (categorySlug) {
    const cat = await prisma.displayCategory.findUnique({ where: { slug: categorySlug } });
    if (cat) where.categoryId = cat.id; else where.categoryId = '__no_match__';
  }
  const assets = await prisma.displayAsset.findMany({ where, orderBy: { order: 'asc' } });
  const categories = await prisma.displayCategory.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ assets, categories });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    const title = (form.get('title') as string) || '';
    const description = (form.get('description') as string) || '';
    const type = (form.get('type') as string) || 'BANNER';
    const categorySlug = (form.get('category') as string) || '';
    const locale = (form.get('locale') as string) || '';
    if (!(file instanceof File)) return NextResponse.json({ error: 'File required' }, { status: 400 });
    const upload = await uploadImage(file, 'bharat-pushpam/display');
    const publicId = (upload as any).public_id as string;
    const url = (upload as any).secure_url as string;
    let categoryId: string | undefined = undefined;
    if (categorySlug) {
      const cat = await prisma.displayCategory.upsert({
        where: { slug: categorySlug },
        update: {},
        create: { name: categorySlug, slug: categorySlug },
      });
      categoryId = cat.id;
    }
    const created = await prisma.displayAsset.create({
      data: { title, description, type: type as any, publicId, url, categoryId, locale: locale || null },
    });
    return NextResponse.json({ ok: true, asset: created });
  } else {
    const body = await req.json();
    const { title = '', description = '', type = 'BANNER', publicId = '', url = '', categorySlug = '', locale = '' } = body || {};
    if (!publicId) return NextResponse.json({ error: 'publicId required' }, { status: 400 });
    let categoryId: string | undefined = undefined;
    if (categorySlug) {
      const cat = await prisma.displayCategory.upsert({
        where: { slug: categorySlug },
        update: {},
        create: { name: categorySlug, slug: categorySlug },
      });
      categoryId = cat.id;
    }
    const created = await prisma.displayAsset.create({
      data: { title, description, type: type as any, publicId, url, categoryId, locale: locale || null },
    });
    return NextResponse.json({ ok: true, asset: created });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const asset = await prisma.displayAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let cloudinaryWarning: string | undefined;
  if (asset.publicId) {
    try {
      // Avoid request hanging due to upstream timeouts
      await withTimeout(deleteImage(asset.publicId));
    } catch (err: any) {
      console.error('Cloudinary delete failed or timed out:', err);
      cloudinaryWarning = 'Cloudinary delete failed or timed out; DB record removed';
      // Continue regardless of Cloudinary failure
    }
  }
  // Tolerate already-deleted records and avoid P2025
  await prisma.displayAsset.deleteMany({ where: { id } });

  // Revalidate homepage caches so changes reflect immediately
  try {
    revalidateTag('home-data');
    const locales = ['en', 'hi', 'mr'];
    const loc = asset.locale || undefined;
    if (loc && locales.includes(loc)) {
      revalidatePath(`/${loc}`);
    } else {
      locales.forEach(l => revalidatePath(`/${l}`));
    }
  } catch (e) {
    console.warn('Revalidate after display DELETE failed:', e);
  }

  return NextResponse.json({ ok: true, warning: cloudinaryWarning });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { id, title, description, order, locale, type, categorySlug } = body as any;

  const data: any = {};
  if (typeof title !== 'undefined') data.title = title;
  if (typeof description !== 'undefined') data.description = description;
  if (typeof order !== 'undefined') data.order = Number.isFinite(order) ? Number(order) : null;
  if (typeof locale !== 'undefined') data.locale = locale || null;
  if (typeof type !== 'undefined') data.type = type;

  if (categorySlug) {
    const cat = await prisma.displayCategory.upsert({
      where: { slug: categorySlug },
      update: {},
      create: { name: categorySlug, slug: categorySlug },
    });
    data.categoryId = cat.id;
  }

  try {
    const updated = await prisma.displayAsset.update({ where: { id }, data });
    try {
      revalidateTag('home-data');
      const locales = ['en', 'hi', 'mr'];
      const loc = updated.locale || undefined;
      if (loc && locales.includes(loc)) {
        revalidatePath(`/${loc}`);
      } else {
        locales.forEach(l => revalidatePath(`/${l}`));
      }
    } catch (e) {
      console.warn('Revalidate after display PATCH failed:', e);
    }
    return NextResponse.json({ ok: true, asset: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Update failed' }, { status: 500 });
  }
}