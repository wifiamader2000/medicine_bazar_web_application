const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');
const DataService = require('../services/DataService');

router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const blogs = DataService.get('blogs').findAll({}).filter(b => b.published);
  blogs.sort((a, b) => (b.publishedAt || b.createdAt || '').localeCompare(a.publishedAt || a.createdAt || ''));
  const total = blogs.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const data = blogs.slice((p - 1) * l, p * l);
  res.json({ success: true, data, pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const blog = DataService.get('blogs').findOne({ slug: req.params.slug, published: true });
  if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
  DataService.get('blogs').update(blog.id, { views: (blog.views || 0) + 1 });
  res.json({ success: true, data: blog });
}));

router.get('/admin/all', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const blogs = DataService.get('blogs').findAll({});
  blogs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: blogs });
}));

router.post('/', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { title, titleBn, slug, content, contentBn, excerpt, excerptBn, featuredImage, tags, published } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title required' });
  const blog = DataService.get('blogs').create({
    title, titleBn: titleBn || '', slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    content: content || '', contentBn: contentBn || '',
    excerpt: excerpt || '', excerptBn: excerptBn || '',
    featuredImage: featuredImage || '', tags: tags || [],
    published: published || false, publishedAt: published ? new Date().toISOString() : null,
    author: req.user.name, authorId: req.user.id, views: 0,
  });
  res.status(201).json({ success: true, data: blog });
}));

router.put('/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  if (req.body.published && !DataService.get('blogs').findById(req.params.id)?.publishedAt) {
    req.body.publishedAt = new Date().toISOString();
  }
  const updated = DataService.get('blogs').update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Blog not found' });
  res.json({ success: true, data: updated });
}));

router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  DataService.get('blogs').delete(req.params.id);
  res.json({ success: true, message: 'Blog deleted' });
}));

module.exports = router;
