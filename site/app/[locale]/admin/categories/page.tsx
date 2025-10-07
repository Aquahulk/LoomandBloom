import { prisma } from '@/app/lib/prisma';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <ul className="list-disc pl-5">
        {categories.map(c => (
          <li key={c.id}>{c.name}</li>
        ))}
        {categories.length === 0 && <li className="text-gray-500">No categories yet.</li>}
      </ul>
    </div>
  );
}


