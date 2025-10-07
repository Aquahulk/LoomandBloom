// Script to upload product images to Cloudinary
// Run with: node scripts/upload-images.js

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary via environment variables for safety
// Set CLOUDINARY_URL or cloud_name/api_key/api_secret in your hosting env
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

if (!cloudinary.config().cloud_name) {
  console.error('❌ Cloudinary is not configured. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.');
  process.exit(1);
}

// Product images mapping
const productImages = {
  // Indoor Plants
  'monstera-deliciosa': 'monstera-deliciosa.jpg',
  'snake-plant': 'snake-plant.jpg',
  'fiddle-leaf-fig': 'fiddle-leaf-fig.jpg',
  'peace-lily': 'peace-lily.jpg',
  'rubber-plant': 'rubber-plant.jpg',
  'pothos-golden': 'pothos-golden.jpg',
  
  // Outdoor Plants
  'hibiscus': 'hibiscus.jpg',
  'jasmine': 'jasmine.jpg',
  'bougainvillea': 'bougainvillea.jpg',
  'sunflower': 'sunflower.jpg',
  
  // Succulents & Cactus
  'echeveria': 'echeveria.jpg',
  'haworthia': 'haworthia.jpg',
  'barrel-cactus': 'barrel-cactus.jpg',
  'christmas-cactus': 'christmas-cactus.jpg',
  
  // Bonsai
  'juniper-bonsai': 'juniper-bonsai.jpg',
  'ficus-bonsai': 'ficus-bonsai.jpg',
  'jade-bonsai': 'jade-bonsai.jpg',
  
  // Herbal & Medicinal
  'tulsi': 'tulsi.jpg',
  'aloe-vera': 'aloe-vera.jpg',
  'neem': 'neem.jpg',
  'giloy': 'giloy.jpg',
  
  // Fruit Plants
  'lemon': 'lemon.jpg',
  'mango': 'mango.jpg',
  'guava': 'guava.jpg',
  'pomegranate': 'pomegranate.jpg',
  
  // Fragrant Plants
  'lavender': 'lavender.jpg',
  'rosemary': 'rosemary.jpg',
  'mint': 'mint.jpg',
  'basil': 'basil.jpg',
  
  // Pots & Planters
  'ceramic-round-6': 'ceramic-round-6.jpg',
  'ceramic-round-8': 'ceramic-round-8.jpg',
  'ceramic-round-10': 'ceramic-round-10.jpg',
  'square-ceramic-6': 'square-ceramic-6.jpg',
  'square-ceramic-8': 'square-ceramic-8.jpg',
  'square-ceramic-10': 'square-ceramic-10.jpg',
  'plastic-pot-6': 'plastic-pot-6.jpg',
  'plastic-pot-8': 'plastic-pot-8.jpg',
  'plastic-pot-10': 'plastic-pot-10.jpg',
  'fiber-pot-6': 'fiber-pot-6.jpg',
  'fiber-pot-8': 'fiber-pot-8.jpg',
  'hanging-basket-8': 'hanging-basket-8.jpg',
  'hanging-basket-10': 'hanging-basket-10.jpg',
  'railing-planter-24': 'railing-planter-24.jpg',
  'railing-planter-36': 'railing-planter-36.jpg',
  'tall-planter-12': 'tall-planter-12.jpg',
  'tall-planter-16': 'tall-planter-16.jpg',
  'cube-planter-8': 'cube-planter-8.jpg',
  'cube-planter-10': 'cube-planter-10.jpg',
  'rectangular-planter-12': 'rectangular-planter-12.jpg',
  'rectangular-planter-18': 'rectangular-planter-18.jpg',
  'wall-mounted-planter': 'wall-mounted-planter.jpg',
  'cat-planter': 'cat-planter.jpg',
  'owl-planter': 'owl-planter.jpg',
  'stacking-set': 'stacking-set.jpg'
};

async function uploadImage(imagePath, publicId) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: 'bharat-pushpam/products',
      transformation: [
        { width: 800, height: 800, crop: 'fill', quality: 'auto' },
        { format: 'auto' }
      ]
    });
    
    console.log(`✅ Uploaded: ${publicId} -> ${result.secure_url}`);
    return result.public_id;
  } catch (error) {
    console.error(`❌ Failed to upload ${publicId}:`, error.message);
    return null;
  }
}

async function uploadAllImages() {
  const imagesDir = path.join(__dirname, '../images/products');
  
  // Check if images directory exists
  if (!fs.existsSync(imagesDir)) {
    console.log('📁 Creating images directory...');
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('📁 Please add your product images to: site/images/products/');
    console.log('📁 Expected files:', Object.values(productImages).join(', '));
    return;
  }

  console.log('🚀 Starting image upload to Cloudinary...');
  
  const uploadResults = [];
  
  for (const [productSlug, imageFile] of Object.entries(productImages)) {
    const imagePath = path.join(imagesDir, imageFile);
    
    if (fs.existsSync(imagePath)) {
      const publicId = await uploadImage(imagePath, productSlug);
      if (publicId) {
        uploadResults.push({ productSlug, publicId });
      }
    } else {
      console.log(`⚠️  Image not found: ${imageFile}`);
    }
  }
  
  console.log(`\n📊 Upload Summary:`);
  console.log(`✅ Successfully uploaded: ${uploadResults.length} images`);
  console.log(`❌ Failed uploads: ${Object.keys(productImages).length - uploadResults.length} images`);
  
  if (uploadResults.length > 0) {
    console.log('\n📝 Next step: Update database with these public IDs');
    console.log('Run: node scripts/update-database-images.js');
  }
}

uploadAllImages().catch(console.error);
