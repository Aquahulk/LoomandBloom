import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Row = {
  name: string;
  slug: string;
  category: string;
  subcategory?: string;
  description: string;
  mrp: string;
  price: string;
  sku: string;
  stock: string;
  image_urls?: string;
};

function slugify(text: string) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  const csvPath = process.argv[2] || 'prisma/products.csv';

  const parentMap = new Map<string, string>(); // slug -> name
  const subs: Array<{ slug: string; name: string; parentSlug: string }> = [];

  await new Promise<void>((resolve, reject) => {
    const parser = parse({
      // Our products.csv has no header row; define columns explicitly
      columns: ['name', 'slug', 'category', 'subcategory', 'description', 'mrp', 'price', 'sku', 'stock', 'image_urls'],
      trim: true,
      skip_empty_lines: true
    });

    parser.on('readable', () => {
      let record: Row;
      // eslint-disable-next-line no-cond-assign
      while ((record = parser.read() as Row)) {
        const catName = (record.category || '').trim();
        if (!catName) continue;
        const parentSlug = slugify(catName);
        if (!parentMap.has(parentSlug)) parentMap.set(parentSlug, catName);

        const subName = (record.subcategory || '').trim();
        if (subName) {
          const subSlug = slugify(subName);
          subs.push({ slug: subSlug, name: subName, parentSlug });
        }
      }
    });

    parser.on('error', reject);
    parser.on('end', resolve);

    createReadStream(csvPath).pipe(parser);
  });

  let createdParents = 0;
  let updatedParents = 0;
  let createdSubs = 0;
  let updatedSubs = 0;

  // Upsert parent categories
  for (const [slug, name] of parentMap.entries()) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) {
      await prisma.category.create({
        data: {
          name,
          slug,
          description: `${name} category for Bharat Pushpam`
        }
      });
      createdParents++;
    } else {
      // Ensure name stays in sync
      if (existing.name !== name) {
        await prisma.category.update({ where: { id: existing.id }, data: { name } });
        updatedParents++;
      }
    }
  }

  // Deduplicate subs by slug, prefer last occurrence for name/parent
  const subMap = new Map<string, { name: string; parentSlug: string }>();
  for (const s of subs) subMap.set(s.slug, { name: s.name, parentSlug: s.parentSlug });

  for (const [subSlug, info] of subMap.entries()) {
    const parent = await prisma.category.findUnique({ where: { slug: info.parentSlug } });
    if (!parent) {
      // Create missing parent if somehow not present
      await prisma.category.create({
        data: {
          name: parentMap.get(info.parentSlug) || info.parentSlug,
          slug: info.parentSlug,
          description: `${parentMap.get(info.parentSlug) || info.parentSlug} category for Bharat Pushpam`
        }
      });
    }
    const parentEnsured = await prisma.category.findUnique({ where: { slug: info.parentSlug } });
    if (!parentEnsured) continue; // safety

    const existingSub = await prisma.category.findUnique({ where: { slug: subSlug } });
    if (!existingSub) {
      await prisma.category.create({
        data: {
          name: info.name,
          slug: subSlug,
          description: `${info.name} subcategory for Bharat Pushpam`,
          parentId: parentEnsured.id
        }
      });
      createdSubs++;
    } else {
      const needsUpdate = (existingSub.name !== info.name) || (existingSub.parentId !== parentEnsured.id);
      if (needsUpdate) {
        await prisma.category.update({
          where: { id: existingSub.id },
          data: {
            name: info.name,
            parentId: parentEnsured.id
          }
        });
        updatedSubs++;
      }
    }
  }

  console.log(`Categories sync complete.`);
  console.log(`Parents: created ${createdParents}, updated ${updatedParents}, total ${parentMap.size}`);
  console.log(`Subcategories: created ${createdSubs}, updated ${updatedSubs}, total ${subMap.size}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });