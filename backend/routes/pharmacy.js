const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const { prescriptionUpload } = require('../middleware/upload');
const DataService = require('../services/DataService');

router.post('/apply', prescriptionUpload.single('license'), asyncHandler(async (req, res) => {
  const { pharmacyName, ownerName, phone, email, address, note } = req.body;
  if (!pharmacyName || !ownerName || !phone) {
    return res.status(400).json({ success: false, message: 'Pharmacy name, owner name and phone required' });
  }
  const application = DataService.get('pharmacyApplications').create({
    pharmacyName, ownerName, phone, email: email || '',
    address: address || '', note: note || '',
    licenseFile: req.file ? req.file.filename : null,
    status: 'pending',
    statusHistory: [{ status: 'pending', timestamp: new Date().toISOString() }],
  });
  res.status(201).json({ success: true, message: 'Application submitted', messageBn: 'আবেদন জমা হয়েছে', data: { id: application.id, status: 'pending' } });
}));

router.get('/applications', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const apps = DataService.get('pharmacyApplications').findAll({});
  apps.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: apps });
}));

router.put('/applications/:id/review', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const app = DataService.get('pharmacyApplications').findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  const history = app.statusHistory || [];
  history.push({ status, timestamp: new Date().toISOString(), note: note || '', by: req.user.email });
  DataService.get('pharmacyApplications').update(req.params.id, { status, statusHistory: history });
  logAudit(req, 'pharmacy_application_reviewed', { applicationId: req.params.id, status });
  res.json({ success: true, message: 'Application reviewed' });
}));

module.exports = router;
