const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { slugify } = require('./ProductImportService');

const SOURCE = 'bd-medicine-scraper/kaggle';
const FALLBACK_IMAGE = '/assets/images/medicine-placeholder.svg';

const TYPE_ALIASES = {
  medicine: ['medicine', 'medicines'],
  manufacturer: ['manufacturer', 'manufacturers', 'company', 'companies'],
  generic: ['generic', 'generics'],
  indication: ['indication', 'indications'],
  drugClass: ['drug_class', 'drug class', 'drugclass', 'drug-classes', 'drug classes'],
  dosageForm: ['dosage_form', 'dosage form', 'dosageform', 'dosage-forms', 'dosage forms'],
};

const FIELD_ALIASES = {
  name: ['name', 'brand name', 'brand_name', 'medicine name', 'medicine_name'],
  medicineType: ['medicine type', 'medicine_type', 'type'],
  genericName: ['generic', 'generic name', 'generic_name'],
  strength: ['strength'],
  manufacturer: ['manufacturer', 'manufacturer name', 'manufacturer_name', 'company'],
  packageContainer: ['package container', 'package_container', 'container', 'pack info', 'pack_info'],
  packageSize: ['package size', 'package_size', 'pack size', 'pack_size'],
  unitPrice: ['unit price', 'unit_price', 'price', 'mrp'],
  dosageForm: ['dosage form', 'dosage form name', 'dosage_form', 'dosage_form_name', 'form'],
  drugClass: ['drug class', 'drug class name', 'drug_class', 'drug_class_name', 'class'],
  indication: ['indication', 'indication name', 'indications', 'uses'],
  monographPdfUrl: ['monographic link', 'monograph link', 'monograph pdf link', 'monograph_pdf_link', 'pdf url', 'pdf_url'],
  indicationDescription: ['indication description', 'indication_description'],
  pharmacology: ['pharmacology description', 'pharmacology_description', 'pharmacology'],
  dosage: ['dosage & administration', 'dosage and administration', 'dosage & administration description', 'dosage_administration', 'dosage'],
  sideEffects: ['side effects', 'side effect', 'side_effects', 'side_effect'],
  precautions: ['precautions', 'precaution'],
  contraindications: ['contraindications', 'contraindication'],
  pregnancyWarning: ['pregnancy warning', 'pregnancy_warning', 'pregnancy'],
  lactationWarning: ['lactation warning', 'lactation_warning', 'lactation'],
  storage: ['storage condition', 'storage_condition', 'storage'],
  sku: ['sku'],
  barcode: ['barcode'],
};

function keyName(value) {
  return String(value || '').toLowerCase().trim().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function clean(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizedHeaderMap(row) {
  const map = {};
  for (const key of Object.keys(row || {})) {
    const normalized = keyName(key);
    map[normalized] = key;
  }
  return map;
}

function pick(row, aliases) {
  const map = normalizedHeaderMap(row);
  for (const alias of aliases) {
    const original = map[keyName(alias)];
    if (original !== undefined && clean(row[original])) return clean(row[original]);
  }
  return '';
}

function parseCsv(filePath, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  if (ext === '.txt') return parse(content, { columns: true, delimiter: '\t', skip_empty_lines: true, trim: true, relax_column_count: true });
  return parse(content, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
}

function detectFileType(originalName, rows) {
  const base = path.basename(originalName || '').toLowerCase().replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
  for (const [type, aliases] of Object.entries(TYPE_ALIASES)) {
    if (aliases.some(alias => base === alias || base.includes(alias))) return type;
  }
  const sample = rows[0] || {};
  if (pick(sample, FIELD_ALIASES.monographPdfUrl) || pick(sample, FIELD_ALIASES.pharmacology)) return 'generic';
  if (pick(sample, FIELD_ALIASES.genericName) && pick(sample, FIELD_ALIASES.strength)) return 'medicine';
  if (pick(sample, FIELD_ALIASES.dosageForm)) return 'dosageForm';
  return 'medicine';
}

function parseNullableNumber(value) {
  const raw = clean(value);
  if (!raw) return null;
  const parsed = Number.parseFloat(raw.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function uniqueList(values) {
  return [...new Set(values.flatMap(value => clean(value).split(/[|,;]/)).map(clean).filter(Boolean))];
}

function matchKey(...parts) {
  return parts.map(part => clean(part).toLowerCase()).join('|');
}

function makeEntity(name, extra = {}) {
  return {
    name,
    slug: slugify(name),
    active: true,
    source: SOURCE,
    importedSource: SOURCE,
    ...extra,
  };
}

function normalizeGeneric(row, index, originalName) {
  const name = pick(row, FIELD_ALIASES.name) || pick(row, FIELD_ALIASES.genericName);
  if (!name) return { error: { row: index + 2, file: originalName, error: 'Missing generic name', data: row } };
  return {
    entity: makeEntity(name, {
      genericName: name,
      drugClass: pick(row, FIELD_ALIASES.drugClass),
      indication: pick(row, FIELD_ALIASES.indication),
      indications: uniqueList([pick(row, FIELD_ALIASES.indication)]),
      monographPdfUrl: pick(row, FIELD_ALIASES.monographPdfUrl),
      indicationDescription: pick(row, FIELD_ALIASES.indicationDescription),
      pharmacology: pick(row, FIELD_ALIASES.pharmacology),
      dosage: pick(row, FIELD_ALIASES.dosage),
      sideEffects: pick(row, FIELD_ALIASES.sideEffects),
      precautions: pick(row, FIELD_ALIASES.precautions),
      contraindications: pick(row, FIELD_ALIASES.contraindications),
      pregnancyWarning: pick(row, FIELD_ALIASES.pregnancyWarning),
      lactationWarning: pick(row, FIELD_ALIASES.lactationWarning),
      storage: pick(row, FIELD_ALIASES.storage),
    }),
  };
}

function enrichFromGeneric(product, generic) {
  if (!generic) return product;
  const updates = {
    drugClass: generic.drugClass || product.drugClass || '',
    indication: generic.indication || product.indication || '',
    indications: uniqueList([...(product.indications || []), ...(generic.indications || []), generic.indication]),
    monographPdfUrl: generic.monographPdfUrl || product.monographPdfUrl || '',
    indicationDescription: generic.indicationDescription || product.indicationDescription || '',
    pharmacology: generic.pharmacology || product.pharmacology || '',
    dosage: generic.dosage || product.dosage || '',
    sideEffects: generic.sideEffects || product.sideEffects || '',
    precautions: generic.precautions || product.precautions || '',
    contraindications: generic.contraindications || product.contraindications || '',
    pregnancyWarning: generic.pregnancyWarning || product.pregnancyWarning || '',
    lactationWarning: generic.lactationWarning || product.lactationWarning || '',
    storage: generic.storage || product.storage || '',
  };
  return { ...product, ...updates };
}

function normalizeMedicine(row, index, originalName, genericMap = new Map()) {
  const name = pick(row, FIELD_ALIASES.name);
  if (!name) return { error: { row: index + 2, file: originalName, error: 'Missing brand/name', data: row } };

  const genericName = pick(row, FIELD_ALIASES.genericName);
  const manufacturer = pick(row, FIELD_ALIASES.manufacturer);
  const strength = pick(row, FIELD_ALIASES.strength);
  const packageContainer = pick(row, FIELD_ALIASES.packageContainer);
  const packageSize = pick(row, FIELD_ALIASES.packageSize);
  const unitPrice = parseNullableNumber(pick(row, FIELD_ALIASES.unitPrice));
  const medicineType = pick(row, FIELD_ALIASES.medicineType);
  const dosageForm = pick(row, FIELD_ALIASES.dosageForm) || medicineType || '';
  const generic = genericName ? genericMap.get(genericName.toLowerCase()) : null;

  let product = {
    name,
    genericName,
    strength,
    manufacturer,
    category: medicineType || dosageForm || 'General Medicine',
    medicineType,
    dosageForm,
    unitType: packageContainer || dosageForm || 'unit',
    packInfo: packageContainer,
    packSize: packageSize || packageContainer,
    mrp: unitPrice,
    sellingPrice: unitPrice,
    purchasePrice: null,
    stockQuantity: 0,
    prescriptionRequired: false,
    active: true,
    imageUrl: FALLBACK_IMAGE,
    images: [FALLBACK_IMAGE],
    source: SOURCE,
    importedSource: SOURCE,
    dataSourceNote: 'Imported from bd-medicine-scraper/Kaggle-compatible dataset. Verify clinically before use.',
    sku: pick(row, FIELD_ALIASES.sku),
    barcode: pick(row, FIELD_ALIASES.barcode),
    aliases: uniqueList([name, genericName, manufacturer, strength, dosageForm]),
    searchKeywords: uniqueList([name, genericName, manufacturer, medicineType, dosageForm, generic?.drugClass, generic?.indication]),
    slug: slugify(`${name}-${strength}-${manufacturer}`),
    brandSlug: slugify(manufacturer),
    categorySlug: slugify(medicineType || dosageForm || 'General Medicine'),
  };

  if (!product.sku) {
    product.sku = `MB-${slugify(`${name}-${strength}-${manufacturer}`).toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 48)}`;
  }

  product = enrichFromGeneric(product, generic);
  return { product };
}

function collectEntities(parsedFiles, invalidRows) {
  const generics = [];
  const manufacturers = [];
  const indications = [];
  const drugClasses = [];
  const dosageForms = [];

  for (const file of parsedFiles) {
    file.rows.forEach((row, index) => {
      if (file.type === 'generic') {
        const normalized = normalizeGeneric(row, index, file.originalName);
        if (normalized.error) invalidRows.push(normalized.error);
        else generics.push(normalized.entity);
      } else if (file.type === 'manufacturer') {
        const name = pick(row, FIELD_ALIASES.name) || pick(row, FIELD_ALIASES.manufacturer);
        if (!name) invalidRows.push({ row: index + 2, file: file.originalName, error: 'Missing manufacturer name', data: row });
        else manufacturers.push(makeEntity(name, { country: 'Bangladesh' }));
      } else if (file.type === 'indication') {
        const name = pick(row, FIELD_ALIASES.name) || pick(row, FIELD_ALIASES.indication);
        if (!name) invalidRows.push({ row: index + 2, file: file.originalName, error: 'Missing indication name', data: row });
        else indications.push(makeEntity(name));
      } else if (file.type === 'drugClass') {
        const name = pick(row, FIELD_ALIASES.name) || pick(row, FIELD_ALIASES.drugClass);
        if (!name) invalidRows.push({ row: index + 2, file: file.originalName, error: 'Missing drug class name', data: row });
        else drugClasses.push(makeEntity(name));
      } else if (file.type === 'dosageForm') {
        const name = pick(row, FIELD_ALIASES.name) || pick(row, FIELD_ALIASES.dosageForm);
        if (!name) invalidRows.push({ row: index + 2, file: file.originalName, error: 'Missing dosage form name', data: row });
        else dosageForms.push(makeEntity(name));
      }
    });
  }

  return { generics, manufacturers, indications, drugClasses, dosageForms };
}

function uniqueByName(items) {
  const map = new Map();
  for (const item of items) {
    const key = clean(item.name || item.genericName).toLowerCase();
    if (key && !map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function entityCreateList(incoming, existing) {
  const existingNames = new Set(existing.map(item => clean(item.name || item.genericName).toLowerCase()));
  return uniqueByName(incoming).filter(item => !existingNames.has(clean(item.name || item.genericName).toLowerCase()));
}

function buildGenericMap(incomingGenerics, existingGenerics = []) {
  const map = new Map();
  for (const generic of [...existingGenerics, ...incomingGenerics]) {
    const key = clean(generic.name || generic.genericName).toLowerCase();
    if (key) map.set(key, generic);
  }
  return map;
}

function parseBdMedicineDataset(files, stores) {
  const parsedFiles = files.map(file => {
    const rows = parseCsv(file.path, file.originalname);
    return { path: file.path, filename: file.filename, originalName: file.originalname, rows, type: detectFileType(file.originalname, rows) };
  });

  const invalidRows = [];
  const entities = collectEntities(parsedFiles, invalidRows);
  const existingProducts = stores.products || [];
  const existingGenerics = stores.generics || [];
  const genericMap = buildGenericMap(entities.generics, existingGenerics);
  const medicineFiles = parsedFiles.filter(file => file.type === 'medicine');
  const newProducts = [];
  const updateProducts = [];
  const duplicateRows = [];
  const seenKeys = new Set();
  const existingByComposite = new Map(existingProducts.map(p => [matchKey(p.name, p.strength, p.manufacturer), p]));
  const existingSku = new Map(existingProducts.filter(p => p.sku).map(p => [String(p.sku).toLowerCase(), p]));
  const existingBarcode = new Map(existingProducts.filter(p => p.barcode).map(p => [String(p.barcode).toLowerCase(), p]));

  for (const file of medicineFiles) {
    file.rows.forEach((row, index) => {
      const normalized = normalizeMedicine(row, index, file.originalName, genericMap);
      if (normalized.error) {
        invalidRows.push(normalized.error);
        return;
      }
      const product = normalized.product;
      const composite = matchKey(product.name, product.strength, product.manufacturer);
      const skuMatch = product.sku ? existingSku.get(String(product.sku).toLowerCase()) : null;
      const barcodeMatch = product.barcode ? existingBarcode.get(String(product.barcode).toLowerCase()) : null;
      const existing = existingByComposite.get(composite);

      if ((skuMatch && (!existing || skuMatch.id !== existing.id)) || (barcodeMatch && (!existing || barcodeMatch.id !== existing.id))) {
        invalidRows.push({ row: index + 2, file: file.originalName, error: 'Duplicate SKU/barcode conflicts with another product', data: row });
        return;
      }
      if (seenKeys.has(composite)) {
        duplicateRows.push({ row: index + 2, file: file.originalName, action: 'skipped', reason: 'Duplicate row in import file', product });
        return;
      }
      seenKeys.add(composite);
      if (existing) {
        duplicateRows.push({ row: index + 2, file: file.originalName, action: 'update_existing', reason: 'Same name + strength + manufacturer', productId: existing.id, product });
        updateProducts.push({ id: existing.id, data: product });
      } else {
        newProducts.push(product);
      }
    });
  }

  const manufacturersFromProducts = newProducts.concat(updateProducts.map(item => item.data))
    .map(p => p.manufacturer)
    .filter(Boolean)
    .map(name => makeEntity(name, { country: 'Bangladesh' }));
  const dosageFormsFromProducts = newProducts.concat(updateProducts.map(item => item.data))
    .map(p => p.dosageForm)
    .filter(Boolean)
    .map(name => makeEntity(name));
  const drugClassesFromGenerics = entities.generics.map(g => g.drugClass).filter(Boolean).map(name => makeEntity(name));
  const indicationsFromGenerics = entities.generics.flatMap(g => g.indications || []).filter(Boolean).map(name => makeEntity(name));

  const createEntities = {
    manufacturers: entityCreateList([...entities.manufacturers, ...manufacturersFromProducts], stores.manufacturers || []),
    brands: entityCreateList([...entities.manufacturers, ...manufacturersFromProducts], stores.brands || []),
    generics: entityCreateList(entities.generics, stores.generics || []),
    indications: entityCreateList([...entities.indications, ...indicationsFromGenerics], stores.indications || []),
    drugClasses: entityCreateList([...entities.drugClasses, ...drugClassesFromGenerics], stores.drugClasses || []),
    dosageForms: entityCreateList([...entities.dosageForms, ...dosageFormsFromProducts], stores.dosageForms || []),
  };

  return {
    source: SOURCE,
    files: parsedFiles.map(file => ({ importId: file.filename, sourceName: file.originalName, type: file.type, totalRows: file.rows.length })),
    totalRows: parsedFiles.reduce((sum, file) => sum + file.rows.length, 0),
    medicineRows: medicineFiles.reduce((sum, file) => sum + file.rows.length, 0),
    newProducts,
    updateProducts,
    invalidRows,
    duplicateRows,
    createEntities,
    preview: newProducts.slice(0, 25),
  };
}

module.exports = {
  SOURCE,
  parseBdMedicineDataset,
  enrichFromGeneric,
};
