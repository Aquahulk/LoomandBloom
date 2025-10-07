import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    'Fragrant Plants',
    'Indoor Plants',
    'Outdoor Plants',
    'Fruit-Bearing Plants',
    'Herbal & Medicinal Plants',
    'Cactus & Succulents',
    'Bonsai Plants',
    'Plastic Pots',
    'Round Pots',
    'Square Pots',
    'Stacking Pots',
    'Hanging Pots',
    'Railing Planters',
    'Fiber Pots & Planters',
    'Tall Planters',
    'Cube Planters',
    'Rectangular Planters',
    'Wall Mounted Planters',
    'Creative Planter Designs'
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) }
    });
  }

  console.log('Seeded categories');

  // Demo products
  const indoor = await prisma.category.findFirst({ where: { slug: 'indoor-plants' } });
  if (indoor) {
    await prisma.product.upsert({
      where: { slug: 'money-plant-pothos' },
      update: {},
      create: {
        name: 'Money Plant (Pothos)',
        slug: 'money-plant-pothos',
        description: 'Easy-care, air-purifying vine for indoors.',
        mrp: 499,
        price: 349,
        sku: 'PTH-001',
        stock: 50,
        categoryId: indoor.id
      }
    });
    await prisma.product.upsert({
      where: { slug: 'snake-plant-sansevieria' },
      update: {},
      create: {
        name: 'Snake Plant (Sansevieria)',
        slug: 'snake-plant-sansevieria',
        description: 'Low-light tolerant, excellent air purifier.',
        mrp: 999,
        price: 749,
        sku: 'SNS-001',
        stock: 30,
        categoryId: indoor.id
      }
    });
  }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


