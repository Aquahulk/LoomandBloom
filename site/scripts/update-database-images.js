// Script to update database with real product images
// Run with: node scripts/update-database-images.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Product images mapping (public IDs from Cloudinary)
const productImageMapping = {
  // Indoor Plants
  'monstera-deliciosa': 'monstera-deliciosa',
  'snake-plant': 'snake-plant',
  'fiddle-leaf-fig': 'fiddle-leaf-fig',
  'peace-lily': 'peace-lily',
  'rubber-plant': 'rubber-plant',
  'pothos-golden': 'pothos-golden',
  
  // Outdoor Plants
  'hibiscus': 'hibiscus',
  'jasmine': 'jasmine',
  'bougainvillea': 'bougainvillea',
  'sunflower': 'sunflower',
  
  // Succulents & Cactus
  'echeveria': 'echeveria',
  'haworthia': 'haworthia',
  'barrel-cactus': 'barrel-cactus',
  'christmas-cactus': 'christmas-cactus',
  
  // Bonsai
  'juniper-bonsai': 'juniper-bonsai',
  'ficus-bonsai': 'ficus-bonsai',
  'jade-bonsai': 'jade-bonsai',
  
  // Herbal & Medicinal
  'tulsi': 'tulsi',
  'aloe-vera': 'aloe-vera',
  'neem': 'neem',
  'giloy': 'giloy',
  
  // Fruit Plants
  'lemon': 'lemon',
  'mango': 'mango',
  'guava': 'guava',
  'pomegranate': 'pomegranate',
  
  // Fragrant Plants
  'lavender': 'lavender',
  'rosemary': 'rosemary',
  'mint': 'mint',
  'basil': 'basil',
  
  // Pots & Planters
  'ceramic-round-6': 'ceramic-round-6',
  'ceramic-round-8': 'ceramic-round-8',
  'ceramic-round-10': 'ceramic-round-10',
  'square-ceramic-6': 'square-ceramic-6',
  'square-ceramic-8': 'square-ceramic-8',
  'square-ceramic-10': 'square-ceramic-10',
  'plastic-pot-6': 'plastic-pot-6',
  'plastic-pot-8': 'plastic-pot-8',
  'plastic-pot-10': 'plastic-pot-10',
  'fiber-pot-6': 'fiber-pot-6',
  'fiber-pot-8': 'fiber-pot-8',
  'hanging-basket-8': 'hanging-basket-8',
  'hanging-basket-10': 'hanging-basket-10',
  'railing-planter-24': 'railing-planter-24',
  'railing-planter-36': 'railing-planter-36',
  'tall-planter-12': 'tall-planter-12',
  'tall-planter-16': 'tall-planter-16',
  'cube-planter-8': 'cube-planter-8',
  'cube-planter-10': 'cube-planter-10',
  'rectangular-planter-12': 'rectangular-planter-12',
  'rectangular-planter-18': 'rectangular-planter-18',
  'wall-mounted-planter': 'wall-mounted-planter',
  'cat-planter': 'cat-planter',
  'owl-planter': 'owl-planter',
  'stacking-set': 'stacking-set'
};

async function updateProductImages() {
  try {
    console.log('🔄 Updating product images in database...');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const [productSlug, publicId] of Object.entries(productImageMapping)) {
      try {
        // Find the product by slug
        const product = await prisma.product.findUnique({
          where: { slug: productSlug }
        });
        
        if (product) {
          // Clear existing images
          await prisma.productImage.deleteMany({
            where: { productId: product.id }
          });
          
          // Add new image
          await prisma.productImage.create({
            data: {
              productId: product.id,
              publicId: publicId,
              alt: `${product.name} - Plant Image`,
              position: 0
            }
          });
          
          console.log(`✅ Updated: ${product.name} -> ${publicId}`);
          updatedCount++;
        } else {
          console.log(`⚠️  Product not found: ${productSlug}`);
          notFoundCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${productSlug}:`, error.message);
      }
    }
    
    console.log(`\n📊 Update Summary:`);
    console.log(`✅ Successfully updated: ${updatedCount} products`);
    console.log(`⚠️  Products not found: ${notFoundCount}`);
    console.log(`❌ Errors: ${Object.keys(productImageMapping).length - updatedCount - notFoundCount}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Database updated successfully!');
      console.log('🌐 Your website should now display real product images!');
    }
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductImages();
