import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

type TaxonomyNode = {
  name: string;
  slug?: string; // optional override
  children?: TaxonomyNode[];
};

// Canonical taxonomy provided by user
const taxonomy: TaxonomyNode[] = [
  { name: 'Indoor Plants' },
  { name: 'Outdoor Plants' },
  { name: 'Fragrant Plants' },
  { name: 'Cactus & Succulents' },
  { name: 'Fruit-Bearing Plants' },
  { name: 'Bonsai Plants' },
  { name: 'Herbal & Medicinal Plants' },
  {
    name: 'Pots & Planters Catalogue',
    children: [
      {
        name: 'Plastic Pots',
        children: [
          { name: 'Round Pots' },
          { name: 'Square Pots' },
          { name: 'Stacking Pots' },
          { name: 'Hanging Pots' },
          { name: 'Railing Planters' }
        ]
      },
      {
        name: 'Ceramic Pots',
        children: [
          // Use unique slugs to avoid conflict with Plastic Pots children
          { name: 'Square Pots', slug: 'ceramic-square-pots' },
          { name: 'Round Pots', slug: 'ceramic-round-pots' },
          { name: 'Designer Ceramic Planters' }
        ]
      },
      {
        name: 'Fiber Pots & Planters',
        children: [
          { name: 'Tall Planters' },
          { name: 'Cube Planters' },
          { name: 'Rectangular Planters' },
          { name: 'Wall Mounted Planters' },
          { name: 'Creative Planter Designs' }
        ]
      }
    ]
  }
];

async function upsertCategory(name: string, parentId?: string, slugOverride?: string) {
  const slug = slugOverride || slugify(name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (!existing) {
    const created = await prisma.category.create({
      data: { name, slug, parentId }
    });
    return { category: created, created: true, updated: false };
  }
  // Ensure name and parent linkage are correct
  const needsUpdate = existing.name !== name || existing.parentId !== (parentId || null);
  if (needsUpdate) {
    const updated = await prisma.category.update({
      where: { id: existing.id },
      data: { name, parentId }
    });
    return { category: updated, created: false, updated: true };
  }
  return { category: existing, created: false, updated: false };
}

async function syncNode(node: TaxonomyNode, parentId?: string, stats?: { created: number; updated: number }) {
  const { category, created, updated } = await upsertCategory(node.name, parentId, node.slug);
  if (stats) {
    if (created) stats.created++;
    if (updated) stats.updated++;
  }
  if (node.children && node.children.length) {
    for (const child of node.children) {
      await syncNode(child, category.id, stats);
    }
  }
}

async function main() {
  const stats = { created: 0, updated: 0 };

  // Special re-parenting: ensure existing known categories are under canonical parents
  // Create or align top-level taxonomy
  for (const node of taxonomy) {
    await syncNode(node, undefined, stats);
  }

  // Additional reconciliation: If legacy categories exist with mismatched parents, fix a few common cases
  // Move 'Railing Planters' under 'Plastic Pots' if orphan
  const plastic = await prisma.category.findUnique({ where: { slug: slugify('Plastic Pots') } });
  const railing = await prisma.category.findUnique({ where: { slug: slugify('Railing Planters') } });
  if (plastic && railing && railing.parentId !== plastic.id) {
    await prisma.category.update({ where: { id: railing.id }, data: { parentId: plastic.id } });
    stats.updated++;
  }

  // Re-parent 'Ceramic Pots' under 'Pots & Planters Catalogue' if linked elsewhere
  const potsCatalogue = await prisma.category.findUnique({ where: { slug: slugify('Pots & Planters Catalogue') } });
  const ceramic = await prisma.category.findUnique({ where: { slug: slugify('Ceramic Pots') } });
  if (potsCatalogue && ceramic && ceramic.parentId !== potsCatalogue.id) {
    await prisma.category.update({ where: { id: ceramic.id }, data: { parentId: potsCatalogue.id } });
    stats.updated++;
  }

  console.log(`Taxonomy sync complete. Created: ${stats.created}, Updated: ${stats.updated}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });