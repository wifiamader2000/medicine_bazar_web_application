const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const DataService = require('../services/DataService');

// Get all active banners (public)
router.get('/', async (req, res) => {
  try {
    const banners = await DataService.get('banners').find({ active: true });
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all banners
router.get('/all', authenticate, adminOnly, async (req, res) => {
  try {
    const banners = await DataService.get('banners').find();
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Create banner
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const banner = req.body;
    banner.createdAt = new Date().toISOString();
    const saved = await DataService.get('banners').create(banner);
    res.json({ success: true, banner: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update banner
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const updated = await DataService.get('banners').update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Delete banner
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const deleted = await DataService.get('banners').delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
