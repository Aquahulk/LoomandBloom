const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function timestampFolder(base) {
  const ts = new Date().toISOString().replace(/[:]/g, '-');
  const dir = path.join(base, ts);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function exportData() {
  const outBase = path.join(process.cwd(), 'prisma', 'exports');
  const outDir = timestampFolder(outBase);

  console.log(`📦 Exporting backup to: ${outDir}`);

  // Export categories
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
  fs.writeFileSync(path.join(outDir, 'categories.json'), JSON.stringify(categories, null, 2));
  console.log(`✅ categories.json (${categories.length})`);

  // Export products with images and category relation
  const products = await prisma.product.findMany({
    include: { images: true, category: true },
    orderBy: { id: 'asc' }
  });
  fs.writeFileSync(path.join(outDir, 'products.json'), JSON.stringify(products, null, 2));
  console.log(`✅ products.json (${products.length})`);

  // Separate product images if needed
  const productImages = await prisma.productImage.findMany({ orderBy: { id: 'asc' } });
  fs.writeFileSync(path.join(outDir, 'product_images.json'), JSON.stringify(productImages, null, 2));
  console.log(`✅ product_images.json (${productImages.length})`);

  await prisma.$disconnect();
}

exportData().catch(async (err) => {
  console.error('❌ Export failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});