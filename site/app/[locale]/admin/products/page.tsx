import { prisma } from '@/app/lib/prisma';
import { formatINR, paiseToRupees } from '@/app/lib/currency';

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Products</h1>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border">Name</th>
            <th className="text-left p-2 border">SKU</th>
            <th className="text-left p-2 border">Price</th>
            <th className="text-left p-2 border">Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td className="p-2 border">{p.name}</td>
              <td className="p-2 border">{p.sku}</td>
              <td className="p-2 border">{formatINR(paiseToRupees(p.price))}</td>
              <td className="p-2 border">{p.stock}</td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td className="p-3 text-gray-500" colSpan={4}>No products yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


