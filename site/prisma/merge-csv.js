/*
  Merge multiple product CSVs into a single file.
  - Deduplicates by `slug`
  - Preserves header: name,slug,category,subcategory,description,mrp,price,sku,stock,image_urls
  Usage:
    node prisma/merge-csv.js --out=prisma/products.all.csv
  Defaults:
    --out=prisma/products.all.csv
    sources = [
      'prisma/products.csv',
      'prisma/upload-from-user.csv',
      'prisma/products-plastic-ceramic.csv',
      'prisma/ceramic-batch-2.csv',
      'prisma/fiber-ceramic-large.csv'
    ]
*/

const fs = require('fs');
const path = require('path');

const HEADER = 'name,slug,category,subcategory,description,mrp,price,sku,stock,image_urls';

function getArg(key, def) {
  const found = process.argv.find(a => a.startsWith(`--${key}=`));
  if (!found) return def;
  return found.split('=')[1];
}

// Robust CSV split that respects quoted commas
function splitCsvLine(line) {
  const cols = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Toggle quotes, handle escaped quotes by doubling
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

function readCsvRows(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const hasHeader = lines[0].trim().toLowerCase().startsWith('name,slug,category,subcategory,description,mrp,price,sku,stock,image_urls');
  return hasHeader ? lines.slice(1) : lines;
}

function main() {
  const projectRoot = process.cwd();
  const outArg = getArg('out', 'prisma/products.all.csv');
  const outPath = path.isAbsolute(outArg) ? outArg : path.join(projectRoot, outArg);

  const defaultSources = [
    'prisma/products.csv',
    'prisma/upload-from-user.csv',
    'prisma/products-plastic-ceramic.csv',
    'prisma/ceramic-batch-2.csv',
    'prisma/fiber-ceramic-large.csv',
  ].map(p => path.join(projectRoot, p));

  const rows = [];
  const seenSlugs = new Set();
  let totalRead = 0;

  for (const src of defaultSources) {
    const srcRows = readCsvRows(src);
    totalRead += srcRows.length;
    for (const line of srcRows) {
      const cols = splitCsvLine(line);
      const slug = cols[1] ? cols[1].trim() : '';
      if (!slug) continue; // skip invalid
      if (seenSlugs.has(slug)) continue; // dedupe by slug
      seenSlugs.add(slug);
      rows.push(line);
    }
  }

  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const content = [HEADER, ...rows].join('\n') + '\n';
  fs.writeFileSync(outPath, content, 'utf8');

  console.log(`Merged ${rows.length} unique products out of ${totalRead} rows.`);
  console.log(`Output written to: ${outPath}`);
}

main();