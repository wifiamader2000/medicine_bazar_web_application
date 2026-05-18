const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_MIMES = [...ALLOWED_IMAGE_MIMES, 'application/pdf'];
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.php', '.jsp', '.asp', '.dll', '.so'];

function createStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(config.upload.dir, subfolder);
      const fs = require('fs');
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = crypto.randomUUID() + ext;
      cb(null, name);
    },
  });
}

function fileFilter(allowedMimes) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      const err = new Error('File type not allowed');
      err.status = 400;
      return cb(err, false);
    }
    if (!allowedMimes.includes(file.mimetype)) {
      const err = new Error(`Invalid file type: ${file.mimetype}`);
      err.status = 400;
      return cb(err, false);
    }
    cb(null, true);
  };
}

const productImageUpload = multer({
  storage: createStorage('products'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: fileFilter(ALLOWED_IMAGE_MIMES),
});

const prescriptionUpload = multer({
  storage: createStorage('prescriptions'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: fileFilter(ALLOWED_DOC_MIMES),
});

const mediaUpload = multer({
  storage: createStorage('media'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: fileFilter(ALLOWED_IMAGE_MIMES),
});

const logoUpload = multer({
  storage: createStorage('logos'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_IMAGE_MIMES),
});

const importUpload = multer({
  storage: createStorage('temp'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.csv', '.txt'];
    if (!allowed.includes(ext)) {
      const err = new Error('Only CSV or tab-delimited TXT files are allowed. Excel import is disabled in the production path.');
      err.status = 400;
      return cb(err, false);
    }
    cb(null, true);
  },
});

const paymentProofUpload = multer({
  storage: createStorage('media'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_IMAGE_MIMES),
});

module.exports = {
  productImageUpload,
  prescriptionUpload,
  mediaUpload,
  logoUpload,
  importUpload,
  paymentProofUpload,
};
