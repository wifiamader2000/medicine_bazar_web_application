const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const { prescriptionUpload } = require('../middleware/upload');
const DataService = require('../services/DataService');
const config = require('../config');

router.post('/upload', authenticate, prescriptionUpload.single('prescription'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const { patientName, doctorName, note } = req.body;

  const prescription = DataService.get('prescriptions').create({
    customerId: req.user.id,
    customerName: req.user.name,
    customerEmail: req.user.email,
    patientName: patientName || req.user.name,
    doctorName: doctorName || '',
    note: note || '',
    fileName: req.file.filename,
    originalName: req.file.originalname,
    filePath: req.file.path,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    status: 'pending',
    statusHistory: [{ status: 'pending', timestamp: new Date().toISOString(), note: 'Uploaded' }],
  });

  logAudit(req, 'prescription_uploaded', { prescriptionId: prescription.id });
  res.status(201).json({ success: true, message: 'Prescription uploaded successfully', messageBn: 'প্রেসক্রিপশন সফলভাবে আপলোড হয়েছে', data: { id: prescription.id, status: prescription.status } });
}));

router.get('/my-prescriptions', authenticate, asyncHandler(async (req, res) => {
  const prescriptions = DataService.get('prescriptions').findAll({})
    .filter(p => p.customerId === req.user.id)
    .map(({ filePath, fileName, ...rest }) => rest);
  prescriptions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: prescriptions });
}));

router.get('/download/:id', authenticate, asyncHandler(async (req, res) => {
  const prescription = DataService.get('prescriptions').findById(req.params.id);
  if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
  if (prescription.customerId !== req.user.id && !['admin', 'pharmacist', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const filePath = prescription.filePath || path.join(config.upload.dir, 'prescriptions', prescription.fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  logAudit(req, 'prescription_downloaded', { prescriptionId: req.params.id });
  res.download(filePath, prescription.originalName || 'prescription');
}));

router.get('/view/:id', authenticate, asyncHandler(async (req, res) => {
  const prescription = DataService.get('prescriptions').findById(req.params.id);
  if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
  if (prescription.customerId !== req.user.id && !['admin', 'pharmacist', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const filePath = prescription.filePath || path.join(config.upload.dir, 'prescriptions', prescription.fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  res.setHeader('Content-Type', prescription.mimeType || 'image/jpeg');
  res.sendFile(filePath);
}));

router.get('/queue', authenticate, authorize('admin', 'pharmacist', 'manager'), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let prescriptions = DataService.get('prescriptions').findAll({});
  if (status) prescriptions = prescriptions.filter(p => p.status === status);
  prescriptions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const total = prescriptions.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const data = prescriptions.slice((p - 1) * l, p * l);
  res.json({ success: true, data, pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } });
}));

router.put('/:id/review', authenticate, authorize('admin', 'pharmacist', 'manager'), asyncHandler(async (req, res) => {
  const { status, pharmacistNote } = req.body;
  const prescription = DataService.get('prescriptions').findById(req.params.id);
  if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
  const history = prescription.statusHistory || [];
  history.push({ status, timestamp: new Date().toISOString(), note: pharmacistNote || '', by: req.user.email });
  DataService.get('prescriptions').update(req.params.id, { status, pharmacistNote, reviewedBy: req.user.email, reviewedAt: new Date().toISOString(), statusHistory: history });
  logAudit(req, 'prescription_reviewed', { prescriptionId: req.params.id, status });
  res.json({ success: true, message: 'Prescription review updated' });
}));

module.exports = router;
