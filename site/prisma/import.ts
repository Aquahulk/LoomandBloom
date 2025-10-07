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
  image_urls?: string; // pipe separated publicIds or URLs
};

async function ensureCategory(slug: string, name: string) {
  return prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { slug, name }
  });
}

async function ensureSubCategory(slug: string, name: string, parentId: string) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, parentId },
    create: { slug, name, parentId }
  });
}

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function main(csvPath = 'prisma/products.csv') {
  const parser = createReadStream(csvPath).pipe(
    parse({ columns: true, trim: true, skip_empty_lines: true })
  );

  let count = 0;
  for await (const row of parser as AsyncIterable<Row>) {
    const categoryName = row.category || 'Uncategorized';
    const categorySlug = slugify(categoryName);
    const category = await ensureCategory(categorySlug, categoryName);

    // Prefer assigning products to subcategory if provided
    let assignCategoryId = category.id;
    const subName = row.subcategory?.trim();
    if (subName) {
      const subSlug = slugify(subName);
      const subCategory = await ensureSubCategory(subSlug, subName, category.id);
      assignCategoryId = subCategory.id;
    }

    const price = Number(row.price) || 0;
    const mrp = Number(row.mrp) || price;
    const stock = Number(row.stock) || 0;

    const product = await prisma.product.upsert({
      where: { slug: row.slug || slugify(row.name) },
      update: {
        name: row.name,
        description: row.description,
        mrp,
        price,
        sku: row.sku,
        stock,
        categoryId: assignCategoryId
      },
      create: {
        name: row.name,
        slug: row.slug || slugify(row.name),
        description: row.description,
        mrp,
        price,
        sku: row.sku,
        stock,
        categoryId: assignCategoryId
      }
    });

    // Images: accept Cloudinary publicIds separated by |
    if (row.image_urls) {
      const parts = row.image_urls.split('|').map(s => s.trim()).filter(Boolean);
      // Clear existing images then add
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      for (let i = 0; i < parts.length; i++) {
        await prisma.productImage.create({
          data: { productId: product.id, publicId: parts[i], position: i }
        });
      }
    }
    count++;
  }
  console.log(`Imported ${count} products`);
}

main(process.argv[2]).catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


