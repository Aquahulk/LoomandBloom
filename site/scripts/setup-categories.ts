// Script to set up basic categories for the admin panel
// Run with: node scripts/setup-categories.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Indoor Plants',
    slug: 'indoor-plants',
    description: 'Beautiful indoor plants perfect for home and office decoration'
  },
  {
    name: 'Outdoor Plants',
    slug: 'outdoor-plants',
    description: 'Flowering and ornamental plants for gardens and balconies'
  },
  {
    name: 'Succulents & Cactus',
    slug: 'succulents-cactus',
    description: 'Low-maintenance succulents and cacti for easy care'
  },
  {
    name: 'Bonsai',
    slug: 'bonsai',
    description: 'Miniature trees and artistic bonsai plants'
  },
  {
    name: 'Herbal & Medicinal',
    slug: 'herbal-medicinal',
    description: 'Medicinal and herbal plants for health and wellness'
  },
  {
    name: 'Fruit Plants',
    slug: 'fruit-plants',
    description: 'Fruit-bearing plants for home gardens'
  },
  {
    name: 'Fragrant Plants',
    slug: 'fragrant-plants',
    description: 'Aromatic plants that add fragrance to your space'
  },
  {
    name: 'Pots & Planters',
    slug: 'pots-planters',
    description: 'Stylish pots and planters for all your plants'
  }
];

async function setupCategories() {
  try {
    console.log('🌱 Setting up categories for Bharat Pushpam...');
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const categoryData of categories) {
      try {
        const existing = await prisma.category.findUnique({
          where: { slug: categoryData.slug }
        });
        
        if (existing) {
          console.log(`⏭️  Category already exists: ${categoryData.name}`);
          existingCount++;
        } else {
          await prisma.category.create({
            data: categoryData
          });
          console.log(`✅ Created category: ${categoryData.name}`);
          createdCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating category ${categoryData.name}:`, error);
      }
    }
    
    console.log(`\n📊 Category Setup Summary:`);
    console.log(`✅ Created: ${createdCount} categories`);
    console.log(`⏭️  Already existed: ${existingCount} categories`);
    console.log(`❌ Errors: ${categories.length - createdCount - existingCount} categories`);
    
    if (createdCount > 0) {
      console.log('\n🎉 Categories setup complete!');
      console.log('🌐 You can now add products in the admin panel');
    }
    
  } catch (error) {
    console.error('❌ Category setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupCategories();
