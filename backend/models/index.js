const mongoose = require('mongoose');

const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const Prescription = require('./Prescription');
const Banner = require('./Banner');
const Transaction = require('./Transaction');

const createGenericModel = (modelName) => {
  return mongoose.model(modelName, new mongoose.Schema({
    oldId: { type: String, default: null }
  }, { strict: false, timestamps: true }));
};

const Category = createGenericModel('Category');
const Brand = createGenericModel('Brand');
const Manufacturer = createGenericModel('Manufacturer');
const Media = createGenericModel('Media');
const Campaign = createGenericModel('Campaign');
const Payment = createGenericModel('Payment');
const POSSession = createGenericModel('POSSession');
const POSTransaction = createGenericModel('POSTransaction');
const POSReturn = createGenericModel('POSReturn');
const LabTest = createGenericModel('LabTest');
const PharmacyApplication = createGenericModel('PharmacyApplication');
const Blog = createGenericModel('Blog');
const Setting = createGenericModel('Setting');
const AuditLog = createGenericModel('AuditLog');

module.exports = {
  User, Product, Order, Prescription, Banner, Transaction,
  Category, Brand, Manufacturer, Media, Campaign,
  Payment, POSSession, POSTransaction, POSReturn, LabTest,
  PharmacyApplication, Blog, Setting, AuditLog
};
