const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const DataService = require('../backend/services/DataService');
const { parseProductImport, slugify } = require('../backend/services/ProductImportService');

const ROOT = path.join(__dirname, '..');
const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'bd-medicine-sample');

function importScraperData() {
  const medicineCsvPath = path.join(FIXTURE_DIR, 'medicine.csv');
  const genericCsvPath = path.join(FIXTURE_DIR, 'generic.csv');

  if (!fs.existsSync(medicineCsvPath)) {
    console.error(`Medicine data not found at ${medicineCsvPath}`);
    process.exit(1);
  }

  // Read Generics map
  const genericsMap = new Map();
  if (fs.existsSync(genericCsvPath)) {
    const genericContent = fs.readFileSync(genericCsvPath, 'utf8');
    const generics = parse(genericContent, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
    for (const gen of generics) {
      genericsMap.set(gen['generic name'], {
        category: gen['drug class'],
        uses: gen['indication'],
        dosage: gen['dosage & administration'],
        sideEffects: gen['side effects'],
        storage: gen['storage condition'],
        warnings: gen['precautions'],
      });
    }
  }

  // Read Medicines
  const medContent = fs.readFileSync(medicineCsvPath, 'utf8');
  let medicines = parse(medContent, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });

  // Enrich medicines with generic data
  medicines = medicines.map(med => {
    const genData = genericsMap.get(med['generic']) || {};
    return {
      ...med,
      category: genData.category || 'General Medicine',
      uses: genData.uses || '',
      dosage: genData.dosage || '',
      sideEffects: genData.sideEffects || '',
      storage: genData.storage || '',
      warnings: genData.warnings || '',
      active: 'yes' // Default to active
    };
  });

  // Write a temp csv that ProductImportService can parse
  const tempCsvPath = path.join(ROOT, 'assets', 'data', 'temp-import-bd-scraper.csv');
  if (medicines.length > 0) {
    const headers = Object.keys(medicines[0]);
    const csv = [headers.join(','), ...medicines.map(row => headers.map(h => {
        const text = String(row[h] ?? '');
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }).join(','))].join('\n');
    fs.writeFileSync(tempCsvPath, csv, 'utf8');
  } else {
    console.log("No medicines to import.");
    process.exit(0);
  }

  // Import into system
  const productsStore = DataService.get('products');
  const parsed = parseProductImport(tempCsvPath, 'bd-scraper-data.csv', productsStore.findAll({}));
  const imported = parsed.newProducts.length ? productsStore.createMany(parsed.newProducts) : [];

  // Create missing categories and brands
  const categories = [...new Set(imported.map(p => p.category).filter(Boolean))];
  const brands = [...new Set(imported.map(p => p.manufacturer).filter(Boolean))];
  const categoryStore = DataService.get('categories');
  const brandStore = DataService.get('brands');
  const existingCats = categoryStore.findAll({});
  const existingBrands = brandStore.findAll({});

  for (const cat of categories) {
    if (!existingCats.some(c => c.name.toLowerCase() === cat.toLowerCase())) {
      categoryStore.create({ name: cat, nameBn: '', slug: slugify(cat), active: true, sortOrder: 0 });
    }
  }
  for (const brand of brands) {
    if (!existingBrands.some(b => b.name.toLowerCase() === brand.toLowerCase())) {
      brandStore.create({ name: brand, nameBn: '', slug: slugify(brand), active: true, country: 'Bangladesh' });
    }
  }

  DataService.get('importHistory').create({
    importId: 'bd-scraper-' + Date.now(),
    sourceName: 'bd-scraper-data.csv',
    count: imported.length,
    failedRows: parsed.invalidRows.length,
    duplicates: parsed.duplicates.length,
    importedBy: 'script:import-bd-scraper',
    productIds: imported.map(p => p.id),
  });

  // Cleanup temp file
  fs.unlinkSync(tempCsvPath);

  console.log(JSON.stringify({
    source: 'bd-scraper-data.csv',
    totalRead: medicines.length,
    importedCount: imported.length,
    failedRows: parsed.invalidRows.length,
    duplicates: parsed.duplicates.length,
    currentProductCount: productsStore.count(),
    currentCategoryCount: categoryStore.count()
  }, null, 2));
}

importScraperData();
