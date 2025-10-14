import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import ProductImage from '../ProductImage';
import AddToCartButton from './AddToCartButton';
import { formatINR, paiseToRupees } from '@/app/lib/currency';

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ 
    where: { slug },
    include: { category: true, images: true }
  });
  
  if (!product) return {};

  return {
    title: `${product.name} - Loom and Bloom`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'website',
      images: product.images.length > 0 ? [`https://res.cloudinary.com/dkwrsd0qc/image/upload/w_800/${product.images[0].publicId}`] : [],
    },
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const product = await prisma.product.findUnique({ 
    where: { slug }, 
    include: { 
      images: { orderBy: { position: 'asc' } },
      category: true,
      reviews: { where: { approved: true }, orderBy: { createdAt: 'desc' } }
    } 
  });
  
  if (!product) return notFound();


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <nav className="text-sm mb-4">
        <Link href={`/${locale}/products`} className="text-gray-600">Products</Link>
        <span className="mx-2">/</span>
        <Link href={`/${locale}/products?category=${product.category.slug}`} className="text-gray-600">
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 rounded-lg overflow-hidden relative">
            <ProductImage
              images={product.images}
              name={product.name}
              width={600}
              height={600}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{product.name}</h1>
            <p className="text-gray-600">{product.category.name}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold">{formatINR(paiseToRupees(product.price))}</span>
            {product.mrp > product.price && (
              <span className="text-lg text-gray-500 line-through">{formatINR(paiseToRupees(product.mrp))}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Stock:</span>
            <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
            </span>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
          </div>
          
          <AddToCartButton product={product} />
          
          <div className="text-sm text-gray-600">
            <p>✓ Free delivery on orders above ₹999</p>
            <p>✓ Expert plant care guidance</p>
            <p>✓ WhatsApp support: <a href="https://wa.me/917755963959" className="text-green-600">7755963959</a></p>
          </div>
        </div>
      </div>
      
      {product.reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map(review => (
              <div key={review.id} className="border rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    ))}
                  </div>
                  <span className="font-medium">{review.author || 'Anonymous'}</span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}