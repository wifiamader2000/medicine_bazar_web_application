import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Button from '../common/Button';

const PaymentProofUpload = ({ onUpload, file, onRemove }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type (image only)
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG).');
      return;
    }
    // Preview URL
    const previewUrl = URL.createObjectURL(file);
    onUpload({ file, previewUrl });
  };

  return (
    <div className="mt-4">
      <label className="mb-2 block text-sm font-medium text-gray-700">Payment Screenshot / Proof (Optional)</label>
      
      {!file ? (
        <div 
          className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700 text-center">
            Drag & drop your screenshot here
          </p>
          <p className="text-xs text-gray-500 mt-1 mb-4 text-center">
            or click to browse from your device
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Select File
          </Button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            {file.previewUrl ? (
              <img src={file.previewUrl} alt="Proof preview" className="h-16 w-16 object-cover rounded-lg border border-gray-100" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.file.name}</p>
              <p className="text-xs text-gray-500">{(file.file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-alert hover:bg-alert/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentProofUpload;
