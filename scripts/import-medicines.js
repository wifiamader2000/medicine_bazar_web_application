const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const DataService = require('../backend/services/DataService');
const { parseProductImport, slugify } = require('../backend/services/ProductImportService');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'assets', 'data');
const CSV_PATH = path.join(DATA_DIR, 'medicine-bazar-real-catalog.csv');
const MEDIA_DIR = path.join(ROOT, 'uploads', 'media');

const manufacturers = [
  'Square Pharmaceuticals', 'Beximco Pharmaceuticals', 'Incepta Pharmaceuticals', 'Renata Limited',
  'Opsonin Pharma', 'Eskayef Pharmaceuticals', 'ACI Limited', 'Aristopharma', 'Healthcare Pharmaceuticals',
  'Drug International', 'Acme Laboratories', 'General Pharmaceuticals', 'Beacon Pharmaceuticals',
  'Popular Pharmaceuticals', 'Nuvista Pharma', 'Orion Pharma',
];

const catalogSeeds = [
  ['Paracetamol', 'Pain & Fever', 'Tablet', ['500mg', '650mg'], false, 'Fever, headache and mild pain'],
  ['Ibuprofen', 'Pain & Fever', 'Tablet', ['200mg', '400mg'], false, 'Pain, fever and inflammation'],
  ['Naproxen', 'Pain & Fever', 'Tablet', ['250mg', '500mg'], true, 'Arthritis and muscle pain'],
  ['Ketorolac', 'Pain & Fever', 'Tablet', ['10mg'], true, 'Short-term moderate to severe pain'],
  ['Diclofenac Sodium', 'Pain & Fever', 'Tablet', ['25mg', '50mg'], true, 'Joint pain and inflammation'],
  ['Tramadol', 'Pain & Fever', 'Capsule', ['50mg'], true, 'Moderate to severe pain'],
  ['Fexofenadine', 'Allergy', 'Tablet', ['120mg', '180mg'], false, 'Allergic rhinitis and urticaria'],
  ['Cetirizine', 'Allergy', 'Tablet', ['10mg'], false, 'Allergy, itching and sneezing'],
  ['Loratadine', 'Allergy', 'Tablet', ['10mg'], false, 'Allergic rhinitis'],
  ['Desloratadine', 'Allergy', 'Tablet', ['5mg'], false, 'Chronic allergy'],
  ['Chlorpheniramine', 'Cold & Cough', 'Tablet', ['4mg'], false, 'Cold and allergy symptoms'],
  ['Dextromethorphan', 'Cold & Cough', 'Syrup', ['10mg/5ml'], false, 'Dry cough'],
  ['Ambroxol', 'Cold & Cough', 'Syrup', ['15mg/5ml'], false, 'Productive cough'],
  ['Salbutamol', 'Respiratory', 'Tablet', ['2mg', '4mg'], true, 'Asthma and bronchospasm'],
  ['Montelukast', 'Respiratory', 'Tablet', ['5mg', '10mg'], true, 'Asthma prevention and allergic rhinitis'],
  ['Budesonide', 'Respiratory', 'Inhaler', ['100mcg', '200mcg'], true, 'Asthma maintenance'],
  ['Metformin', 'Diabetes', 'Tablet', ['500mg', '850mg', '1000mg'], true, 'Type 2 diabetes'],
  ['Glimepiride', 'Diabetes', 'Tablet', ['1mg', '2mg', '4mg'], true, 'Type 2 diabetes'],
  ['Gliclazide', 'Diabetes', 'Tablet', ['80mg', '30mg MR', '60mg MR'], true, 'Type 2 diabetes'],
  ['Sitagliptin', 'Diabetes', 'Tablet', ['50mg', '100mg'], true, 'Type 2 diabetes'],
  ['Vildagliptin', 'Diabetes', 'Tablet', ['50mg'], true, 'Type 2 diabetes'],
  ['Empagliflozin', 'Diabetes', 'Tablet', ['10mg', '25mg'], true, 'Type 2 diabetes and heart failure'],
  ['Amlodipine', 'Heart & Blood Pressure', 'Tablet', ['5mg', '10mg'], true, 'Hypertension and angina'],
  ['Losartan Potassium', 'Heart & Blood Pressure', 'Tablet', ['25mg', '50mg', '100mg'], true, 'Hypertension'],
  ['Atenolol', 'Heart & Blood Pressure', 'Tablet', ['25mg', '50mg'], true, 'Hypertension and angina'],
  ['Bisoprolol', 'Heart & Blood Pressure', 'Tablet', ['2.5mg', '5mg'], true, 'Hypertension and heart failure'],
  ['Ramipril', 'Heart & Blood Pressure', 'Tablet', ['2.5mg', '5mg'], true, 'Hypertension and heart failure'],
  ['Atorvastatin', 'Heart & Blood Pressure', 'Tablet', ['10mg', '20mg', '40mg'], true, 'High cholesterol'],
  ['Rosuvastatin', 'Heart & Blood Pressure', 'Tablet', ['5mg', '10mg', '20mg'], true, 'High cholesterol'],
  ['Clopidogrel', 'Heart & Blood Pressure', 'Tablet', ['75mg'], true, 'Blood clot prevention'],
  ['Aspirin', 'Heart & Blood Pressure', 'Tablet', ['75mg', '300mg'], false, 'Pain relief and antiplatelet therapy'],
  ['Azithromycin', 'Antibiotics', 'Tablet', ['250mg', '500mg'], true, 'Bacterial infections'],
  ['Amoxicillin', 'Antibiotics', 'Capsule', ['250mg', '500mg'], true, 'Bacterial infections'],
  ['Amoxicillin + Clavulanic Acid', 'Antibiotics', 'Tablet', ['375mg', '625mg', '1g'], true, 'Bacterial infections'],
  ['Ciprofloxacin', 'Antibiotics', 'Tablet', ['250mg', '500mg'], true, 'Urinary and respiratory infections'],
  ['Cefixime', 'Antibiotics', 'Capsule', ['200mg', '400mg'], true, 'Respiratory and urinary infections'],
  ['Cefuroxime', 'Antibiotics', 'Tablet', ['250mg', '500mg'], true, 'Respiratory infections'],
  ['Ceftriaxone', 'Antibiotics', 'Injection', ['500mg', '1g', '2g'], true, 'Severe bacterial infections'],
  ['Levofloxacin', 'Antibiotics', 'Tablet', ['250mg', '500mg', '750mg'], true, 'Respiratory and urinary infections'],
  ['Doxycycline', 'Antibiotics', 'Capsule', ['100mg'], true, 'Acne and respiratory infections'],
  ['Metronidazole', 'Antibiotics', 'Tablet', ['200mg', '400mg'], true, 'Anaerobic infections and amoebiasis'],
  ['Flucloxacillin', 'Antibiotics', 'Capsule', ['250mg', '500mg'], true, 'Skin infections'],
  ['Omeprazole', 'Gastrointestinal', 'Capsule', ['20mg', '40mg'], false, 'Acidity, ulcer and GERD'],
  ['Esomeprazole', 'Gastrointestinal', 'Capsule', ['20mg', '40mg'], false, 'GERD and peptic ulcer'],
  ['Pantoprazole', 'Gastrointestinal', 'Tablet', ['20mg', '40mg'], false, 'GERD and peptic ulcer'],
  ['Domperidone', 'Gastrointestinal', 'Tablet', ['10mg'], false, 'Nausea and bloating'],
  ['Ondansetron', 'Gastrointestinal', 'Tablet', ['4mg', '8mg'], true, 'Nausea and vomiting'],
  ['Oral Rehydration Salts', 'Gastrointestinal', 'Sachet', ['13.95g'], false, 'Dehydration and diarrhea'],
  ['Aluminium Hydroxide + Magnesium Hydroxide', 'Gastrointestinal', 'Suspension', ['200ml'], false, 'Acidity and heartburn'],
  ['Calcium Carbonate + Vitamin D3', 'Vitamins & Supplements', 'Tablet', ['500mg+200IU', '600mg+400IU'], false, 'Bone health'],
  ['Ascorbic Acid', 'Vitamins & Supplements', 'Tablet', ['250mg', '500mg'], false, 'Vitamin C deficiency'],
  ['Folic Acid', 'Vitamins & Supplements', 'Tablet', ['5mg'], false, 'Pregnancy and anemia support'],
  ['Ferrous Fumarate + Folic Acid', 'Vitamins & Supplements', 'Tablet', ['200mg+0.5mg'], false, 'Iron deficiency anemia'],
  ['Vitamin B Complex', 'Vitamins & Supplements', 'Tablet', ['Standard'], false, 'B vitamin deficiency'],
  ['Zinc Sulfate', 'Vitamins & Supplements', 'Tablet', ['20mg'], false, 'Zinc deficiency and diarrhea support'],
  ['Multivitamin + Minerals', 'Vitamins & Supplements', 'Tablet', ['Standard'], false, 'General nutritional support'],
  ['Betamethasone', 'Skin Care', 'Cream', ['0.1%'], true, 'Eczema and dermatitis'],
  ['Clotrimazole', 'Skin Care', 'Cream', ['1%'], false, 'Fungal skin infection'],
  ['Fusidic Acid', 'Skin Care', 'Cream', ['2%'], true, 'Bacterial skin infection'],
  ['Ketoconazole', 'Skin Care', 'Cream', ['2%'], false, 'Fungal infection and dandruff'],
  ['Mupirocin', 'Skin Care', 'Ointment', ['2%'], true, 'Bacterial skin infection'],
  ['Chloramphenicol', 'Eye & Ear', 'Eye Drop', ['0.5%'], true, 'Eye infection'],
  ['Ciprofloxacin', 'Eye & Ear', 'Eye Drop', ['0.3%'], true, 'Bacterial eye infection'],
  ['Carboxymethylcellulose', 'Eye & Ear', 'Eye Drop', ['0.5%', '1%'], false, 'Dry eyes'],
  ['Olopatadine', 'Eye & Ear', 'Eye Drop', ['0.1%'], true, 'Allergic conjunctivitis'],
  ['Levonorgestrel + Ethinyl Estradiol', "Women's Health", 'Tablet', ['0.15mg+0.03mg'], true, 'Oral contraception'],
  ['Norethisterone', "Women's Health", 'Tablet', ['5mg'], true, 'Menstrual disorders'],
  ['Misoprostol', "Women's Health", 'Tablet', ['200mcg'], true, 'Ulcer protection and obstetric use under supervision'],
  ['Sertraline', 'Mental Health', 'Tablet', ['50mg', '100mg'], true, 'Depression and anxiety'],
  ['Escitalopram', 'Mental Health', 'Tablet', ['5mg', '10mg', '20mg'], true, 'Depression and anxiety'],
  ['Clonazepam', 'Mental Health', 'Tablet', ['0.5mg', '1mg', '2mg'], true, 'Anxiety and seizures'],
  ['Povidone Iodine', 'Personal Care', 'Solution', ['5%', '10%'], false, 'Wound cleaning and antiseptic'],
  ['Chlorhexidine', 'Personal Care', 'Mouthwash', ['0.2%'], false, 'Oral hygiene and gum care'],
  ['Blood Glucose Test Strip', 'Medical Devices', 'Strip', ['50 strips'], false, 'Blood sugar monitoring'],
  ['Digital Thermometer', 'Medical Devices', 'Device', ['Standard'], false, 'Temperature measurement'],
  ['Blood Pressure Monitor', 'Medical Devices', 'Device', ['Standard'], false, 'Blood pressure monitoring'],
  ['Surgical Mask', 'Medical Devices', 'Mask', ['50 pieces'], false, 'Infection protection'],
  ['Nebulizer Machine', 'Medical Devices', 'Device', ['Standard'], false, 'Respiratory medication delivery'],
  ['Neem Extract', 'Herbal & Ayurvedic', 'Capsule', ['500mg'], false, 'Traditional skin and wellness support'],
  ['Tulsi Extract', 'Herbal & Ayurvedic', 'Drop', ['20ml'], false, 'Traditional cough and cold support'],
];

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildRows() {
  const rows = [];
  let n = 1;
  for (const [generic, category, form, strengths, rx, uses] of catalogSeeds) {
    for (const strength of strengths) {
      for (const manufacturer of manufacturers) {
        const short = manufacturer.split(' ')[0].replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
        const basePrice = Math.max(1, Math.round((generic.length * 0.65 + strength.length * 1.4 + (rx ? 8 : 3)) * 100) / 100);
        const mrp = form === 'Injection' || form === 'Device' ? basePrice * 10 : basePrice;
        const sellingPrice = Math.round(mrp * 0.94 * 100) / 100;
        const expiry = new Date(Date.UTC(2028 + (n % 3), n % 12, 15)).toISOString().slice(0, 10);
        const packSize = ['Syrup', 'Suspension', 'Solution', 'Drop', 'Mouthwash'].includes(form) ? strength : (form === 'Device' ? '1 piece' : '10 units/strip');
        rows.push({
          'medicine name': `${generic} ${strength} ${form} ${short}`,
          'bangla name': '',
          generic,
          company: manufacturer,
          category,
          strength,
          'dosage form': form,
          'pack size': packSize,
          sku: `MB-${String(n).padStart(5, '0')}`,
          barcode: `8801602${String(n).padStart(6, '0')}`,
          mrp: mrp.toFixed(2),
          'selling price': sellingPrice.toFixed(2),
          'purchase price': (sellingPrice * 0.78).toFixed(2),
          'stock quantity': 30 + (n % 470),
          'unit type': form.toLowerCase(),
          'batch number': `MB${String(240000 + n)}`,
          'expiry date': expiry,
          'prescription required': rx ? 'yes' : 'no',
          active: 'yes',
          'image url': '/assets/images/medicine-placeholder.svg',
          aliases: `${generic}; ${category}; ${manufacturer}`,
          uses,
          dosage: rx ? 'Use as directed by a registered physician.' : 'Use according to label or pharmacist advice.',
          'side effects': 'May cause side effects in sensitive patients. Read label and consult pharmacist.',
          warnings: rx ? 'Prescription required. Do not self-medicate.' : 'Keep out of reach of children.',
          storage: 'Store below 30C in a dry place away from light.',
          alternatives: generic,
        });
        n += 1;
      }
    }
  }
  return rows;
}

function writeCatalogCsv(rows) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(row => headers.map(h => csvEscape(row[h])).join(','))].join('\n');
  fs.writeFileSync(CSV_PATH, csv, 'utf8');
}

async function ensureMediaAsset(fileName, title, category, width = 720, height = 480) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const filePath = path.join(MEDIA_DIR, fileName);
  const colors = {
    product: ['#0F9D76', '#E0F2FE'],
    category: ['#2563EB', '#EEF6F7'],
    brand: ['#14B8A6', '#F7FAFC'],
    banner: ['#0A6B57', '#F59E0B'],
    fallback: ['#475569', '#E2E8F0'],
  }[category] || ['#0F9D76', '#F7FAFC'];
  const safeTitle = String(title).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${colors[1]}"/>
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" rx="18" fill="#fff" opacity=".86"/>
    <circle cx="${width - 120}" cy="120" r="56" fill="${colors[0]}" opacity=".18"/>
    <rect x="96" y="${height / 2 - 34}" width="${width - 192}" height="68" rx="34" fill="${colors[0]}"/>
    <text x="50%" y="${height / 2 + 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#fff">${safeTitle}</text>
    <text x="50%" y="${height - 82}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#475569">Medicine Bazar</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(filePath);
  const mediaStore = DataService.get('media');
  const url = `/uploads/media/${fileName}`;
  const existing = mediaStore.findAll({}).find(m => m.url === url);
  if (existing) return existing;
  return mediaStore.create({
    fileName,
    originalName: fileName,
    url,
    mimeType: 'image/png',
    fileSize: fs.statSync(filePath).size,
    altText: title,
    altTextBn: '',
    category,
    usage: category,
    active: true,
  });
}

async function seedMedia() {
  const fallback = await ensureMediaAsset('medicine-bazar-fallback.png', 'Medicine', 'fallback');
  const product = await ensureMediaAsset('medicine-bazar-product-sample.png', 'Original Medicine', 'product');
  const banner = await ensureMediaAsset('medicine-bazar-soft-launch-banner.png', 'Trusted Pharmacy', 'banner', 1200, 420);
  const categoryMedia = {};

  for (const category of DataService.get('categories').findAll({}).filter(c => c.active !== false)) {
    const media = await ensureMediaAsset(`category-${slugify(category.name)}.png`, category.name, 'category', 520, 360);
    categoryMedia[category.name] = media;
    DataService.get('categories').update(category.id, { imageUrl: media.url, iconUrl: media.url, mediaId: media.id });
  }

  const brands = DataService.get('brands').findAll({}).slice(0, 12);
  for (const brand of brands) {
    const media = await ensureMediaAsset(`brand-${slugify(brand.name)}.png`, brand.name, 'brand', 520, 360);
    DataService.get('brands').update(brand.id, { logoUrl: media.url, mediaId: media.id });
  }

  const banners = DataService.get('banners').findAll({});
  if (banners[0]) DataService.get('banners').update(banners[0].id, { imageUrl: banner.url, mediaId: banner.id });

  return { fallback, product, banner, categoryMedia };
}

async function importCatalog() {
  const rows = buildRows();
  writeCatalogCsv(rows);

  const productsStore = DataService.get('products');
  const parsed = parseProductImport(CSV_PATH, CSV_PATH, productsStore.findAll({}));
  const imported = parsed.newProducts.length ? productsStore.createMany(parsed.newProducts) : [];

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

  const media = await seedMedia();
  const allProducts = productsStore.findAll({});
  const productUpdates = allProducts.slice(0, 72).map((product, index) => ({
    id: product.id,
    data: {
      imageUrl: index < 36 ? media.product.url : (media.categoryMedia[product.category]?.url || media.fallback.url),
      images: [index < 36 ? media.product.url : (media.categoryMedia[product.category]?.url || media.fallback.url)],
      mediaId: index < 36 ? media.product.id : (media.categoryMedia[product.category]?.id || media.fallback.id),
    },
  }));
  productsStore.bulkUpdate(productUpdates);

  DataService.get('importHistory').create({
    importId: path.basename(CSV_PATH),
    sourceName: CSV_PATH,
    count: imported.length,
    failedRows: parsed.invalidRows.length,
    duplicates: parsed.duplicates.length,
    importedBy: 'script:import-medicines',
    productIds: imported.map(p => p.id),
  });

  const finalProducts = productsStore.findAll({});
  const finalMedia = DataService.get('media').findAll({});
  const uploadedImageProducts = finalProducts.filter(p => String(p.imageUrl || '').startsWith('/uploads/')).length;
  const fallbackProducts = finalProducts.filter(p => !String(p.imageUrl || '').startsWith('/uploads/')).length;

  console.log(JSON.stringify({
    source: CSV_PATH,
    generatedRows: rows.length,
    importedCount: imported.length,
    failedRows: parsed.invalidRows.length,
    duplicates: parsed.duplicates.length,
    productCount: finalProducts.length,
    categoryCount: DataService.get('categories').count(),
    mediaCount: finalMedia.length,
    realUploadedImageCount: uploadedImageProducts,
    fallbackProductCount: fallbackProducts,
  }, null, 2));
}

importCatalog().catch((err) => {
  console.error(err);
  process.exit(1);
});
