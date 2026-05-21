const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const FIELD_MAP = {
  'medicine name': 'name', 'brand name': 'name', 'product name': 'name', name: 'name',
  'bangla name': 'nameBn', 'bn name': 'nameBn', namebn: 'nameBn',
  'generic name': 'genericName', generic: 'genericName', genericname: 'genericName',
  company: 'manufacturer', manufacturer: 'manufacturer', brand: 'manufacturer',
  category: 'category', strength: 'strength', 'dosage form': 'dosageForm', dosageform: 'dosageForm',
  'dosage strength': 'strength',
  'medicine type': 'dosageForm', medicinetype: 'dosageForm',
  'pack size': 'packSize', packsize: 'packSize', barcode: 'barcode', sku: 'sku',
  mrp: 'mrp', price: 'mrp', 'selling price': 'sellingPrice', sellingprice: 'sellingPrice',
  'unit price': 'mrp', unitprice: 'mrp',
  'purchase price': 'purchasePrice', purchaseprice: 'purchasePrice', cost: 'purchasePrice',
  stock: 'stockQuantity', 'stock quantity': 'stockQuantity', stockquantity: 'stockQuantity', qty: 'stockQuantity',
  unit: 'unitType', 'unit type': 'unitType', unittype: 'unitType',
  batch: 'batchNumber', 'batch number': 'batchNumber', batchnumber: 'batchNumber',
  expiry: 'expiryDate', 'expiry date': 'expiryDate', expirydate: 'expiryDate',
  'prescription required': 'prescriptionRequired', prescriptionrequired: 'prescriptionRequired', rx: 'prescriptionRequired',
  active: 'active', uses: 'uses', dosage: 'dosage', 'side effects': 'sideEffects', sideeffects: 'sideEffects',
  warning: 'warnings', warnings: 'warnings', storage: 'storage', image: 'imageUrl', 'image url': 'imageUrl',
  imageurl: 'imageUrl', 'media id': 'mediaId', mediaid: 'mediaId',
  aliases: 'aliases', keywords: 'searchKeywords', 'search keywords': 'searchKeywords',
  alternatives: 'alternatives',
};

const LIST_FIELDS = ['aliases', 'searchKeywords', 'alternatives'];

function slugify(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', 'yes', '1', 'y', 'rx', 'required', 'active'].includes(String(value).toLowerCase().trim());
}

function parseNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(String(value).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readRows(filePath, originalName = filePath, isApiJson = false, jsonData = null) {
  if (isApiJson && jsonData) {
    return Array.isArray(jsonData) ? jsonData : [];
  }
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.json') {
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      throw new Error('Invalid JSON file format.');
    }
  }
  if (ext === '.xlsx' || ext === '.xls') {
    throw new Error('Excel import is disabled. Convert the sheet to CSV or tab-delimited TXT before importing.');
  }
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  if (ext === '.csv') {
    return parse(content, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
  }
  if (ext === '.txt') {
    return parse(content, { columns: true, delimiter: '\t', skip_empty_lines: true, trim: true, relax_column_count: true });
  }
  throw new Error('Unsupported import file. Use CSV, JSON, or tab-delimited TXT.');
}

function normalizeRow(row, index, sourceName) {
  const mapped = {};
  for (const [rawKey, value] of Object.entries(row)) {
    const key = String(rawKey).toLowerCase().trim();
    const mappedKey = FIELD_MAP[key] || key;
    mapped[mappedKey] = value;
  }

  if (!mapped.name || String(mapped.name).trim().length === 0) {
    return { error: { row: index + 2, data: row, error: 'Missing medicine name' } };
  }

  const name = String(mapped.name).trim();
  const mrp = parseNumber(mapped.mrp, null); // Null if missing
  const sellingPrice = parseNumber(mapped.sellingPrice, mrp);
  const purchasePrice = parseNumber(mapped.purchasePrice, mrp ? Math.max(mrp * 0.78, 0) : null);

  for (const field of LIST_FIELDS) {
    if (typeof mapped[field] === 'string') {
      mapped[field] = mapped[field].split(/[|,;]/).map(item => item.trim()).filter(Boolean);
    } else if (!Array.isArray(mapped[field])) {
      mapped[field] = [];
    }
  }

  const product = {
    ...mapped,
    name,
    nameBn: mapped.nameBn ? String(mapped.nameBn).trim() : '',
    genericName: mapped.genericName ? String(mapped.genericName).trim() : '',
    manufacturer: mapped.manufacturer ? String(mapped.manufacturer).trim() : '',
    category: mapped.category ? String(mapped.category).trim() : 'General Medicine',
    strength: mapped.strength ? String(mapped.strength).trim() : '',
    dosageForm: mapped.dosageForm ? String(mapped.dosageForm).trim() : 'Tablet',
    packSize: mapped.packSize ? String(mapped.packSize).trim() : '',
    barcode: mapped.barcode ? String(mapped.barcode).trim() : '',
    sku: mapped.sku ? String(mapped.sku).trim() : '',
    mrp,
    sellingPrice,
    purchasePrice,
    stockQuantity: parseInteger(mapped.stockQuantity, 0),
    unitType: mapped.unitType ? String(mapped.unitType).trim() : 'piece',
    batchNumber: mapped.batchNumber ? String(mapped.batchNumber).trim() : '',
    expiryDate: mapped.expiryDate ? String(mapped.expiryDate).trim() : '',
    prescriptionRequired: parseBool(mapped.prescriptionRequired),
    active: parseBool(mapped.active, true),
    imageUrl: mapped.imageUrl ? String(mapped.imageUrl).trim() : '/assets/images/medicine-placeholder.svg',
    mediaId: mapped.mediaId ? String(mapped.mediaId).trim() : '',
    aliases: mapped.aliases || [],
    uses: mapped.uses ? String(mapped.uses).trim() : '',
    dosage: mapped.dosage ? String(mapped.dosage).trim() : '',
    sideEffects: mapped.sideEffects ? String(mapped.sideEffects).trim() : '',
    warnings: mapped.warnings ? String(mapped.warnings).trim() : '',
    storage: mapped.storage ? String(mapped.storage).trim() : '',
    alternatives: mapped.alternatives || [],
    slug: mapped.slug || slugify(`${name}-${mapped.strength || ''}-${mapped.manufacturer || ''}`),
    categorySlug: slugify(mapped.category || 'General Medicine'),
    brandSlug: slugify(mapped.manufacturer || ''),
    importedSource: sourceName || 'custom-csv',
  };

  if (!product.sku) {
    const basis = `${product.name}-${product.strength}-${product.manufacturer}`.toUpperCase();
    product.sku = `MB-${basis.replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42)}`;
  }

  return { product };
}

function findExistingDuplicate(product, existingProducts) {
  const name = product.name.toLowerCase();
  const strength = String(product.strength || '').toLowerCase();
  const manufacturer = String(product.manufacturer || '').toLowerCase();
  
  return existingProducts.find(ep =>
    (String(ep.name || '').toLowerCase() === name &&
      String(ep.strength || '').toLowerCase() === strength &&
      String(ep.manufacturer || '').toLowerCase() === manufacturer) ||
    (product.barcode && ep.barcode === product.barcode) ||
    (product.sku && ep.sku === product.sku)
  );
}

function parseProductImport(filePath, originalName, existingProducts = [], options = {}) {
  const sourceName = options.sourceName || 'custom-csv';
  const rows = readRows(filePath, originalName, options.isApiJson, options.jsonData);
  
  const validRows = [];
  const invalidRows = [];
  const duplicates = [];
  const updatedRows = [];
  const seen = [];

  rows.forEach((row, index) => {
    const normalized = normalizeRow(row, index, sourceName);
    if (normalized.error) {
      invalidRows.push(normalized.error);
      return;
    }
    const product = normalized.product;
    
    // Check against existing database products
    const dbDuplicate = findExistingDuplicate(product, existingProducts);
    
    if (dbDuplicate) {
      // Safe update logic for existing duplicates
      if (options.updateDuplicates) {
        const updatedProduct = { ...dbDuplicate };
        if (product.mrp !== null) updatedProduct.mrp = product.mrp;
        if (product.sellingPrice !== null) updatedProduct.sellingPrice = product.sellingPrice;
        if (product.stockQuantity > 0) updatedProduct.stockQuantity = product.stockQuantity;
        if (product.genericName && !updatedProduct.genericName) updatedProduct.genericName = product.genericName;
        updatedRows.push(updatedProduct);
      } else {
        duplicates.push({ row: index + 2, data: row, reason: 'Duplicate in database' });
      }
      return;
    }
    
    // Check against current batch
    const batchDuplicate = findExistingDuplicate(product, seen);
    if (batchDuplicate) {
      duplicates.push({ row: index + 2, data: row, reason: 'Duplicate in current import batch' });
      return;
    }

    seen.push(product);
    validRows.push(product);
  });

  return {
    rows,
    validRows,
    updatedRows,
    invalidRows,
    duplicates,
    newProducts: validRows,
  };
}

module.exports = { parseProductImport, slugify };
