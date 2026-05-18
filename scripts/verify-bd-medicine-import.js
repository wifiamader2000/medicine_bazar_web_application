const fs = require('fs');
const path = require('path');

const BASE = process.env.QA_BASE || 'http://localhost:5050/api/v1';
const fixtureDir = path.join(__dirname, 'fixtures/bd-medicine-sample');

async function api(endpoint, options = {}) {
  const response = await fetch(`${BASE}${endpoint}`, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${endpoint} failed: ${response.status} ${data?.message || ''}`);
  return data;
}

(async () => {
  const login = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@medicinebazar.com', password: 'Admin@MedBazar2024' }),
  });
  const token = login.data.token;
  const beforeProducts = (await api('/products?limit=1')).pagination.total;

  const form = new FormData();
  form.append('mode', 'bd-medicine-dataset');
  for (const name of ['medicine.csv', 'generic.csv', 'manufacturer.csv', 'indication.csv', 'drug_class.csv', 'dosage_form.csv']) {
    const blob = await fs.openAsBlob(path.join(fixtureDir, name), { type: 'text/csv' });
    form.append('files', blob, name);
  }

  const preview = await api('/admin/import/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const commit = await api('/admin/import/commit', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'bd-medicine-dataset', importFiles: preview.data.importFiles }),
  });
  const afterCommit = (await api('/products?limit=1')).pagination.total;
  const suggestion = await api('/search/suggestions?q=Sample%20Para');
  const detail = await api(`/products/${suggestion.data.find(item => item.type === 'product')?.id || commit.data.importHistoryId}`);
  await api(`/admin/import/${commit.data.importHistoryId}/rollback`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const afterRollback = (await api('/products?limit=1')).pagination.total;

  console.log(JSON.stringify({
    preview: {
      newProducts: preview.data.newProducts,
      updates: preview.data.updateProducts,
      failedRows: preview.data.invalidRows,
      duplicates: preview.data.duplicates,
      generics: preview.data.entityCounts.generics,
      manufacturers: preview.data.entityCounts.manufacturers,
    },
    commit: commit.data,
    productCount: { before: beforeProducts, afterCommit, afterRollback },
    searchTypes: suggestion.data.map(item => item.type),
    detailHasClinicalFields: Boolean(detail.data.pharmacology && detail.data.sideEffects && detail.data.monographPdfUrl),
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
