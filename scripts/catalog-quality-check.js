const DataService = require('../backend/services/DataService');

const productsStore = DataService.get('products');
const products = productsStore.findAll({});

let missingGeneric = 0;
let missingManufacturer = 0;
let missingCategory = 0;
let missingPrice = 0;
let missingStock = 0;
let missingDosageForm = 0;
let missingStrength = 0;
let missingImage = 0;
let brokenBangla = 0;
let brokenAliases = 0;

let updatedCount = 0;

products.forEach(p => {
    let updated = false;

    if (!p.genericName) missingGeneric++;
    if (!p.manufacturer) missingManufacturer++;
    
    if (!p.category || p.category.trim() === '') {
        missingCategory++;
        p.category = 'General Medicine';
        updated = true;
    }

    if (p.mrp === null || p.mrp === undefined || p.mrp === 0) {
        missingPrice++;
    }

    if (p.stockQuantity === null || p.stockQuantity === undefined) {
        missingStock++;
        p.stockQuantity = 0;
        updated = true;
    }

    if (!p.dosageForm) missingDosageForm++;
    if (!p.strength) missingStrength++;

    if (!p.imageUrl || p.imageUrl.trim() === '') {
        missingImage++;
        p.imageUrl = '/assets/images/medicine-placeholder.svg';
        updated = true;
    }

    if (p.nameBn && p.nameBn.includes('?')) {
        brokenBangla++;
    }

    if (p.aliases && Array.isArray(p.aliases) && p.aliases.some(a => a.includes('?'))) {
        brokenAliases++;
    }

    if (updated) {
        productsStore.update(p.id, p);
        updatedCount++;
    }
});

console.log('--- Catalog Quality Report ---');
console.log('Total Products:', products.length);
console.log('Missing Generic:', missingGeneric);
console.log('Missing Manufacturer:', missingManufacturer);
console.log('Missing Category:', missingCategory);
console.log('Missing Price (MRP 0/null):', missingPrice);
console.log('Missing Stock:', missingStock);
console.log('Missing Dosage Form:', missingDosageForm);
console.log('Missing Strength:', missingStrength);
console.log('Missing Image:', missingImage);
console.log('Broken Bangla:', brokenBangla);
console.log('Broken Aliases:', brokenAliases);
console.log('Total Auto-Fixed:', updatedCount);

// Generate Top 100 list
const top100 = products.slice(0, 100).map(p => `${p.name} ${p.strength} (${p.dosageForm}) - ${p.manufacturer}`);
const fs = require('fs');
fs.writeFileSync('../docs/TOP_100_IMAGE_NEEDED.md', '# Top 100 Products Needing Real Images\n\n' + top100.map((t, i) => `${i+1}. [ ] ${t}`).join('\n'));

console.log('Generated Top 100 image list at docs/TOP_100_IMAGE_NEEDED.md');
