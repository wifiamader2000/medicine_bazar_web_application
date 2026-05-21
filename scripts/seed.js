const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const DataService = require('../backend/services/DataService');

async function seed() {
  console.log('Seeding Medicine Bazar database...\n');

  // Admin user
  if (!process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_STAFF_PASSWORD) {
    throw new Error('Set SEED_ADMIN_PASSWORD and SEED_STAFF_PASSWORD before running seed.');
  }
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12);
  const existingAdmin = DataService.get('users').findOne({ email: 'admin@medicinebazar.com' });
  if (!existingAdmin) {
    DataService.get('users').create({
      name: 'Admin',
      email: 'admin@medicinebazar.com',
      password: adminPassword,
      phone: '01602444532',
      role: 'admin',
      active: true,
      emailVerified: true,
    });
    console.log('Admin user created: admin@medicinebazar.com');
  }

  // Sample staff users
  const staffPassword = await bcrypt.hash(process.env.SEED_STAFF_PASSWORD, 12);
  const staffUsers = [
    { name: 'Cashier', email: 'cashier@medicinebazar.com', role: 'cashier' },
    { name: 'Pharmacist', email: 'pharmacist@medicinebazar.com', role: 'pharmacist' },
    { name: 'Manager', email: 'manager@medicinebazar.com', role: 'manager' },
  ];
  for (const staff of staffUsers) {
    if (!DataService.get('users').findOne({ email: staff.email })) {
      DataService.get('users').create({ ...staff, password: staffPassword, phone: '', active: true, emailVerified: true });
      console.log(`Staff user created: ${staff.email} (${staff.role})`);
    }
  }

  // Categories
  const categories = [
    { name: 'Pain & Fever', nameBn: 'ব্যথা ও জ্বর', slug: 'pain-fever' },
    { name: 'Cold & Cough', nameBn: 'সর্দি ও কাশি', slug: 'cold-cough' },
    { name: 'Diabetes', nameBn: 'ডায়াবেটিস', slug: 'diabetes' },
    { name: 'Heart & Blood Pressure', nameBn: 'হার্ট ও রক্তচাপ', slug: 'heart-blood-pressure' },
    { name: 'Antibiotics', nameBn: 'অ্যান্টিবায়োটিক', slug: 'antibiotics' },
    { name: 'Vitamins & Supplements', nameBn: 'ভিটামিন ও সাপ্লিমেন্ট', slug: 'vitamins-supplements' },
    { name: 'Gastrointestinal', nameBn: 'গ্যাস্ট্রোইন্টেস্টাইনাল', slug: 'gastrointestinal' },
    { name: 'Skin Care', nameBn: 'ত্বকের যত্ন', slug: 'skin-care' },
    { name: 'Eye & Ear', nameBn: 'চোখ ও কান', slug: 'eye-ear' },
    { name: 'Respiratory', nameBn: 'শ্বাসতন্ত্র', slug: 'respiratory' },
    { name: 'Women\'s Health', nameBn: 'মহিলাদের স্বাস্থ্য', slug: 'womens-health' },
    { name: 'Baby & Child', nameBn: 'শিশু ও বাচ্চা', slug: 'baby-child' },
    { name: 'Mental Health', nameBn: 'মানসিক স্বাস্থ্য', slug: 'mental-health' },
    { name: 'Allergy', nameBn: 'এলার্জি', slug: 'allergy' },
    { name: 'Sexual Health', nameBn: 'যৌন স্বাস্থ্য', slug: 'sexual-health' },
    { name: 'Personal Care', nameBn: 'পার্সোনাল কেয়ার', slug: 'personal-care' },
    { name: 'Medical Devices', nameBn: 'মেডিকেল ডিভাইস', slug: 'medical-devices' },
    { name: 'Herbal & Ayurvedic', nameBn: 'হারবাল ও আয়ুর্বেদিক', slug: 'herbal-ayurvedic' },
  ];

  const existingCats = DataService.get('categories').findAll({});
  if (existingCats.length === 0) {
    for (const cat of categories) {
      DataService.get('categories').create({ ...cat, active: true, sortOrder: 0 });
    }
    console.log(`${categories.length} categories created`);
  }

  // Brands
  const brands = [
    'Square Pharmaceuticals', 'Beximco Pharmaceuticals', 'Incepta Pharmaceuticals',
    'Renata Limited', 'Opsonin Pharma', 'ACI Limited', 'Eskayef Pharmaceuticals',
    'Aristopharma', 'Drug International', 'Healthcare Pharmaceuticals',
    'Acme Laboratories', 'Popular Pharmaceuticals', 'Ibn Sina Pharmaceuticals',
    'General Pharmaceuticals', 'Navana Pharmaceuticals', 'Orion Pharma',
    'Sharif Pharmaceuticals', 'Globe Pharmaceuticals', 'Jayson Pharmaceuticals',
    'Silva Pharmaceuticals', 'Sun Pharmaceutical', 'Nuvista Pharma',
    'Sanofi Bangladesh', 'GlaxoSmithKline Bangladesh', 'Novartis Bangladesh',
  ];

  const existingBrands = DataService.get('brands').findAll({});
  if (existingBrands.length === 0) {
    for (const brand of brands) {
      DataService.get('brands').create({
        name: brand, nameBn: '', slug: brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        active: true, country: 'Bangladesh',
      });
    }
    console.log(`${brands.length} brands created`);
  }

  // Settings
  const existingSettings = DataService.get('settings').findAll({});
  if (existingSettings.length === 0) {
    DataService.get('settings').create({
      siteName: 'Medicine Bazar',
      siteNameBn: 'মেডিসিন বাজার',
      tagline: 'Your Trusted Pharmacy Partner',
      taglineBn: 'আপনার বিশ্বস্ত ফার্মেসি পার্টনার',
      supportPhone: '01602444532',
      whatsapp: '01602444532',
      facebook: 'https://facebook.com/medicinebazar24',
      youtube: 'https://www.youtube.com/@MedicineBazar24',
      whatsappChannel: 'https://whatsapp.com/channel/0029Vb8A8KwAYlUGFxSkXy01',
      headerLogo: '',
      footerLogo: '',
      favicon: '',
      footerText: '© 2024 Medicine Bazar. All rights reserved.',
      footerTextBn: '© ২০২৪ মেডিসিন বাজার। সর্বস্বত্ব সংরক্ষিত।',
    });
    console.log('Settings created');
  }

  // Sample Lab Tests
  const existingLabTests = DataService.get('labTests').findAll({});
  if (existingLabTests.length === 0) {
    const labTests = [
      { name: 'Complete Blood Count (CBC)', nameBn: 'সম্পূর্ণ রক্ত পরীক্ষা', price: 500, description: 'Measures different components of blood' },
      { name: 'Blood Sugar (Fasting)', nameBn: 'রক্তের সুগার (খালি পেটে)', price: 200, description: 'Measures fasting blood glucose level' },
      { name: 'Blood Sugar (Random)', nameBn: 'রক্তের সুগার (যেকোনো সময়)', price: 200, description: 'Measures random blood glucose level' },
      { name: 'HbA1c', nameBn: 'এইচবিএওয়ানসি', price: 800, description: 'Average blood sugar over 3 months' },
      { name: 'Lipid Profile', nameBn: 'লিপিড প্রোফাইল', price: 1000, description: 'Cholesterol and triglycerides test' },
      { name: 'Liver Function Test', nameBn: 'লিভার ফাংশন টেস্ট', price: 1200, description: 'Tests liver enzyme levels' },
      { name: 'Kidney Function Test', nameBn: 'কিডনি ফাংশন টেস্ট', price: 1000, description: 'Tests kidney health markers' },
      { name: 'Thyroid Function Test', nameBn: 'থাইরয়েড ফাংশন টেস্ট', price: 1500, description: 'Measures thyroid hormones' },
      { name: 'Urine R/M/E', nameBn: 'ইউরিন আর/এম/ই', price: 300, description: 'Routine urine examination' },
      { name: 'Chest X-Ray', nameBn: 'বুকের এক্স-রে', price: 600, description: 'Imaging of chest area' },
    ];
    for (const test of labTests) {
      DataService.get('labTests').create({ ...test, active: true });
    }
    console.log(`${labTests.length} lab tests created`);
  }

  // Sample Banners
  const existingBanners = DataService.get('banners').findAll({});
  if (existingBanners.length === 0) {
    DataService.get('banners').create({
      title: 'Welcome to Medicine Bazar',
      titleBn: 'মেডিসিন বাজারে স্বাগতম',
      subtitle: 'Your Trusted Pharmacy Partner',
      subtitleBn: 'আপনার বিশ্বস্ত ফার্মেসি পার্টনার',
      imageUrl: '',
      link: '/shop',
      active: true,
      sortOrder: 0,
    });
    DataService.get('banners').create({
      title: 'Upload Prescription',
      titleBn: 'প্রেসক্রিপশন আপলোড করুন',
      subtitle: 'Get your medicines delivered at home',
      subtitleBn: 'ঘরে বসে ওষুধ পান',
      imageUrl: '',
      link: '/prescription-upload',
      active: true,
      sortOrder: 1,
    });
    console.log('Banners created');
  }

  // Sample Blog Posts
  const existingBlogs = DataService.get('blogs').findAll({});
  if (existingBlogs.length === 0) {
    const blogs = [
      {
        title: 'How to Manage Diabetes Effectively',
        titleBn: 'কীভাবে কার্যকরভাবে ডায়াবেটিস নিয়ন্ত্রণ করবেন',
        slug: 'manage-diabetes-effectively',
        excerpt: 'Learn about lifestyle changes and medications for diabetes management.',
        excerptBn: 'ডায়াবেটিস নিয়ন্ত্রণের জন্য জীবনযাত্রার পরিবর্তন ও ওষুধ সম্পর্কে জানুন।',
        content: '<h2>Understanding Diabetes</h2><p>Diabetes is a chronic condition that affects how your body processes blood sugar. With proper management, you can live a healthy life.</p><h3>Key Tips</h3><ul><li>Monitor blood sugar regularly</li><li>Take prescribed medications on time</li><li>Maintain a balanced diet</li><li>Exercise regularly</li><li>Regular check-ups with your doctor</li></ul><p><strong>Disclaimer:</strong> This article is for informational purposes only. Always consult your doctor for medical advice.</p>',
        published: true,
        publishedAt: new Date().toISOString(),
        author: 'Medicine Bazar',
        tags: ['diabetes', 'health', 'medicine'],
      },
      {
        title: 'Common Cold: Prevention and Treatment',
        titleBn: 'সাধারণ সর্দি: প্রতিরোধ ও চিকিৎসা',
        slug: 'common-cold-prevention-treatment',
        excerpt: 'Everything you need to know about preventing and treating the common cold.',
        excerptBn: 'সাধারণ সর্দি প্রতিরোধ ও চিকিৎসা সম্পর্কে যা জানা দরকার।',
        content: '<h2>About Common Cold</h2><p>The common cold is a viral infection of the upper respiratory tract. While usually harmless, it can be uncomfortable.</p><h3>Prevention</h3><ul><li>Wash hands frequently</li><li>Avoid close contact with sick people</li><li>Maintain good hygiene</li></ul><h3>Treatment</h3><ul><li>Rest and stay hydrated</li><li>Over-the-counter medications for symptoms</li><li>Consult a doctor if symptoms persist</li></ul>',
        published: true,
        publishedAt: new Date().toISOString(),
        author: 'Medicine Bazar',
        tags: ['cold', 'health', 'prevention'],
      },
    ];
    for (const blog of blogs) {
      DataService.get('blogs').create({ ...blog, views: 0 });
    }
    console.log(`${blogs.length} blog posts created`);
  }

  console.log('\nSeed complete!');
  console.log(`Products: ${DataService.get('products').count()}`);
  console.log(`Categories: ${DataService.get('categories').count()}`);
  console.log(`Brands: ${DataService.get('brands').count()}`);
  console.log(`Users: ${DataService.get('users').count()}`);
}

seed().catch(console.error);
