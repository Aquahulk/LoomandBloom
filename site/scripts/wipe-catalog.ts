import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function wipeCatalog(force = true) {
  console.log('Starting catalog wipe...');

  // Collect all product IDs first
  const products = await prisma.product.findMany({ select: { id: true } });
  const productIds = products.map(p => p.id);
  console.log(`Found ${productIds.length} products to delete`);

  if (productIds.length > 0) {
    if (force) {
      const delOrders = await prisma.orderItem.deleteMany({ where: { productId: { in: productIds } } });
      console.log(`Deleted ${delOrders.count} linked order items`);
    }

    const delImgs = await prisma.productImage.deleteMany({ where: { productId: { in: productIds } } });
    const delReviews = await prisma.review.deleteMany({ where: { productId: { in: productIds } } });
    const delVariants = await prisma.variant.deleteMany({ where: { productId: { in: productIds } } });
    console.log(`Deleted ${delImgs.count} images, ${delReviews.count} reviews, ${delVariants.count} variants`);

    const delProducts = await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    console.log(`Deleted ${delProducts.count} products`);
  }

  // Break parent-child relations before category deletion
  const breakRelations = await prisma.category.updateMany({ where: { parentId: { not: null } }, data: { parentId: null } });
  console.log(`Cleared parent relation for ${breakRelations.count} categories`);

  const delCats = await prisma.category.deleteMany();
  console.log(`Deleted ${delCats.count} categories`);

  console.log('Catalog wipe complete.');
}

wipeCatalog(true)
  .catch((err) => {
    console.error('Wipe failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });