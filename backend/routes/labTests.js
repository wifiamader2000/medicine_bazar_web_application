const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const DataService = require('../services/DataService');

router.get('/', asyncHandler(async (req, res) => {
  const tests = DataService.get('labTests').findAll({}).filter(t => t.active !== false);
  res.json({ success: true, data: tests });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const test = DataService.get('labTests').findById(req.params.id);
  if (!test) return res.status(404).json({ success: false, message: 'Lab test not found' });
  res.json({ success: true, data: test });
}));

router.post('/', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const test = DataService.get('labTests').create({ ...req.body, active: true });
  res.status(201).json({ success: true, data: test });
}));

router.put('/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const updated = DataService.get('labTests').update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Lab test not found' });
  res.json({ success: true, data: updated });
}));

router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  DataService.get('labTests').delete(req.params.id);
  res.json({ success: true, message: 'Lab test deleted' });
}));

router.post('/book', authenticate, asyncHandler(async (req, res) => {
  const { labTestId, patientName, phone, address, preferredDate, note } = req.body;
  if (!labTestId || !patientName || !phone) {
    return res.status(400).json({ success: false, message: 'Lab test, patient name and phone required' });
  }
  const booking = DataService.get('labBookings').create({
    labTestId, customerId: req.user.id, customerEmail: req.user.email,
    patientName, phone, address: address || '', preferredDate: preferredDate || '',
    note: note || '', status: 'pending',
    statusHistory: [{ status: 'pending', timestamp: new Date().toISOString() }],
  });
  res.status(201).json({ success: true, message: 'Lab test booked', messageBn: 'ল্যাব টেস্ট বুক হয়েছে', data: booking });
}));

router.get('/bookings/list', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const bookings = DataService.get('labBookings').findAll({});
  bookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: bookings });
}));

router.put('/bookings/:id/status', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const booking = DataService.get('labBookings').findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  const history = booking.statusHistory || [];
  history.push({ status, timestamp: new Date().toISOString(), note: note || '' });
  DataService.get('labBookings').update(req.params.id, { status, statusHistory: history });
  res.json({ success: true, message: 'Booking status updated' });
}));

module.exports = router;
