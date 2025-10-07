// Script to set up sample images for testing
// This will create placeholder images using a free image service

const fs = require('fs');
const path = require('path');
const https = require('https');

// Sample image URLs from Unsplash (free to use)
const sampleImages = {
  // Indoor Plants
  'monstera-deliciosa': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center',
  'snake-plant': 'https://images.unsplash.com/photo-1509423350716-97f2360af5e4?w=800&h=800&fit=crop&crop=center',
  'fiddle-leaf-fig': 'https://images.unsplash.com/photo-1519336056116-8e0b5b2b0b5b?w=800&h=800&fit=crop&crop=center',
  'peace-lily': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop&crop=center',
  'rubber-plant': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&h=800&fit=crop&crop=center',
  'pothos-golden': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop&crop=center',
  
  // Outdoor Plants
  'hibiscus': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center',
  'jasmine': 'https://images.unsplash.com/photo-1509423350716-97f2360af5e4?w=800&h=800&fit=crop&crop=center',
  'bougainvillea': 'https://images.unsplash.com/photo-1519336056116-8e0b5b2b0b5b?w=800&h=800&fit=crop&crop=center',
  'sunflower': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop&crop=center',
  
  // Succulents
  'echeveria': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop&crop=center',
  'haworthia': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center',
  'barrel-cactus': 'https://images.unsplash.com/photo-1509423350716-97f2360af5e4?w=800&h=800&fit=crop&crop=center',
  'christmas-cactus': 'https://images.unsplash.com/photo-1519336056116-8e0b5b2b0b5b?w=800&h=800&fit=crop&crop=center',
  
  // Pots & Planters
  'ceramic-round-6': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center',
  'ceramic-round-8': 'https://images.unsplash.com/photo-1509423350716-97f2360af5e4?w=800&h=800&fit=crop&crop=center',
  'ceramic-round-10': 'https://images.unsplash.com/photo-1519336056116-8e0b5b2b0b5b?w=800&h=800&fit=crop&crop=center',
  'square-ceramic-6': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop&crop=center',
  'square-ceramic-8': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center',
  'square-ceramic-10': 'https://images.unsplash.com/photo-1509423350716-97f2360af5e4?w=800&h=800&fit=crop&crop=center',
  'plastic-pot-6': 'https://images.unsplash.com/photo-1519336056116-8e0b5b2b0b5b?w=800&h=800&fit=crop&crop=center',
  'plastic-pot-8': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop&crop=center',
  'plastic-pot-10': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center'
};

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function setupSampleImages() {
  const imagesDir = path.join(__dirname, '../images/products');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  console.log('🌱 Setting up sample images for Bharat Pushpam...');
  console.log('📁 Images will be saved to:', imagesDir);
  
  let downloadedCount = 0;
  let errorCount = 0;
  
  for (const [filename, url] of Object.entries(sampleImages)) {
    const filepath = path.join(imagesDir, `${filename}.jpg`);
    
    try {
      // Skip if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`⏭️  Skipping ${filename}.jpg (already exists)`);
        continue;
      }
      
      console.log(`⬇️  Downloading ${filename}.jpg...`);
      await downloadImage(url, filepath);
      console.log(`✅ Downloaded ${filename}.jpg`);
      downloadedCount++;
      
      // Add small delay to be respectful to the image service
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Failed to download ${filename}.jpg:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Download Summary:`);
  console.log(`✅ Successfully downloaded: ${downloadedCount} images`);
  console.log(`❌ Failed downloads: ${errorCount} images`);
  
  if (downloadedCount > 0) {
    console.log('\n🚀 Next steps:');
    console.log('1. Run: node scripts/upload-images.js');
    console.log('2. Run: node scripts/update-database-images.js');
    console.log('3. Restart your development server');
    console.log('4. Visit http://localhost:3000/en/products');
  }
}

setupSampleImages().catch(console.error);
