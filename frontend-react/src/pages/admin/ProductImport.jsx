import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Database } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';

const ProductImport = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreview(null);
    setError('');
    setSuccess('');
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', 'bd-medicine-dataset');

    try {
      const response = await api.post('/admin/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreview(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse import file.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview || !preview.importFiles || preview.importFiles.length === 0) {
      setError('No preview data available to commit.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/admin/import/commit', {
        mode: 'bd-medicine-dataset',
        importFiles: preview.importFiles
      });
      setSuccess(response.data.message || 'Import successful!');
      setPreview(null);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to commit import.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Database size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legal Data Importer</h1>
          <p className="text-sm text-gray-500">Import CSV files from bd-medicine-scraper/Kaggle datasets.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} className="shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-100">
          <CheckCircle size={20} className="shrink-0" />
          <p className="font-medium text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Step 1: Upload CSV File</h2>
        <p className="text-sm text-gray-600 mb-6">
          Upload <code>medicine.csv</code>, <code>generic.csv</code>, <code>manufacturer.csv</code>, etc. 
          Use only legal/official datasets. Fake data is strictly prohibited.
        </p>

        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-primary/10 file:text-primary
              hover:file:bg-primary/20 transition-colors"
          />
          <Button onClick={handlePreview} disabled={!file || loading} className="shrink-0">
            {loading && !preview ? 'Parsing...' : 'Preview Import'}
          </Button>
        </div>
      </div>

      {preview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Step 2: Review & Commit</h2>
            <p className="text-sm text-gray-600 mb-4">{preview.formatNote}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Total Rows</div>
                <div className="text-2xl font-bold text-gray-900">{preview.totalRows}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="text-sm text-green-600 mb-1">Valid Records</div>
                <div className="text-2xl font-bold text-green-700">{preview.validRows}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="text-sm text-red-600 mb-1">Invalid Rows</div>
                <div className="text-2xl font-bold text-red-700">{preview.invalidRows}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="text-sm text-orange-600 mb-1">Duplicates</div>
                <div className="text-2xl font-bold text-orange-700">{preview.duplicates}</div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleCommit} disabled={loading} size="lg" className="w-full justify-center">
                <Upload size={20} className="mr-2" />
                {loading ? 'Committing...' : `Commit ${preview.validRows} Records`}
              </Button>
              <Button variant="outline" onClick={() => setPreview(null)} disabled={loading} size="lg" className="w-full justify-center">
                Cancel
              </Button>
            </div>
          </div>

          {preview.invalidRows > 0 && (
            <div>
              <h3 className="text-md font-bold text-red-700 mb-3 flex items-center gap-2">
                <AlertCircle size={18} /> First {Math.min(preview.invalidRows, 50)} Invalid Rows
              </h3>
              <div className="bg-red-50 rounded-lg p-4 max-h-60 overflow-y-auto border border-red-100">
                <ul className="text-sm text-red-800 space-y-2">
                  {preview.invalidDetails?.map((err, i) => (
                    <li key={i} className="border-b border-red-200/50 pb-2 last:border-0 last:pb-0">
                      <strong>Row {err.row} ({err.file}):</strong> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {preview.preview?.length > 0 && (
            <div>
              <h3 className="text-md font-bold text-gray-900 mb-3">Preview First {preview.preview.length} Valid Records</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="p-3 font-semibold">Name</th>
                      <th className="p-3 font-semibold">Generic</th>
                      <th className="p-3 font-semibold">Manufacturer</th>
                      <th className="p-3 font-semibold">Strength</th>
                      <th className="p-3 font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.preview.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{item.name}</td>
                        <td className="p-3 text-gray-600">{item.genericName || '-'}</td>
                        <td className="p-3 text-gray-600">{item.manufacturer || '-'}</td>
                        <td className="p-3 text-gray-600">{item.strength || '-'}</td>
                        <td className="p-3 text-gray-600">{item.medicineType || item.dosageForm || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImport;
