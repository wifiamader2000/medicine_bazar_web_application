const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const DataService = require('../backend/services/DataService');
const extendedMedicines = require('./medicine-data-extended');
const extendedMedicines2 = require('./medicine-data-extended-2');
const extendedMedicines3 = require('./medicine-data-extended-3');
const extendedMedicines4 = require('./medicine-data-extended-4');

const medicines = [
  // PAIN & FEVER
  { name: 'Napa', nameBn: 'নাপা', genericName: 'Paracetamol', strength: '500mg', dosageForm: 'Tablet', manufacturer: 'Beximco Pharmaceuticals', category: 'Pain & Fever', mrp: 1.20, sellingPrice: 1.10, unitType: 'tablet', packSize: '10 tablets/strip', prescriptionRequired: false, uses: 'Fever, headache, body pain', dosage: '1-2 tablets 3-4 times daily', sideEffects: 'Rare: skin rash, liver damage with overdose', warning: 'Do not exceed 4g per day', storage: 'Store below 30°C', aliases: ['paracetamol', 'acetaminophen'], searchKeywords: ['fever', 'headache', 'pain', 'জ্বর', 'মাথাব্যথা'] },
  { name: 'Napa Extra', nameBn: 'নাপা এক্সট্রা', genericName: 'Paracetamol + Caffeine', strength: '500mg+65mg', dosageForm: 'Tablet', manufacturer: 'Beximco Pharmaceuticals', category: 'Pain & Fever', mrp: 2.50, sellingPrice: 2.30, unitType: 'tablet', packSize: '10 tablets/strip', prescriptionRequired: false, uses: 'Headache, migraine, toothache', dosage: '1-2 tablets every 4-6 hours', sideEffects: 'Insomnia, restlessness', warning: 'Avoid excessive caffeine', storage: 'Store below 30°C', aliases: ['napa extra', 'paracetamol caffeine'] },
  { name: 'Napa Extend', nameBn: 'নাপা এক্সটেন্ড', genericName: 'Paracetamol', strength: '665mg', dosageForm: 'Tablet', manufacturer: 'Beximco Pharmaceuticals', category: 'Pain & Fever', mrp: 3.00, sellingPrice: 2.80, unitType: 'tablet', packSize: '10 tablets/strip', prescriptionRequired: false, uses: 'Extended pain relief', dosage: '2 tablets every 8 hours', sideEffects: 'Rare: liver damage with overdose', warning: 'Do not crush or chew', storage: 'Store below 30°C' },
  { name: 'Napa Syrup', nameBn: 'নাপা সিরাপ', genericName: 'Paracetamol', strength: '120mg/5ml', dosageForm: 'Syrup', manufacturer: 'Beximco Pharmaceuticals', category: 'Baby & Child', mrp: 40, sellingPrice: 38, unitType: 'bottle', packSize: '60ml', prescriptionRequired: false, uses: 'Fever and pain in children', dosage: 'As per age and weight', sideEffects: 'Rare: skin rash', warning: 'Use measuring cup provided', storage: 'Store below 30°C' },
  { name: 'Napa Drop', nameBn: 'নাপা ড্রপ', genericName: 'Paracetamol', strength: '80mg/ml', dosageForm: 'Drop', manufacturer: 'Beximco Pharmaceuticals', category: 'Baby & Child', mrp: 30, sellingPrice: 28, unitType: 'bottle', packSize: '15ml', prescriptionRequired: false, uses: 'Fever in infants', dosage: '0.5-1ml every 4-6 hours', sideEffects: 'Rare', warning: 'Use dropper provided', storage: 'Store below 30°C' },
  { name: 'Ace', nameBn: 'এস', genericName: 'Paracetamol', strength: '500mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Pain & Fever', mrp: 1.20, sellingPrice: 1.10, unitType: 'tablet', packSize: '10 tablets/strip', prescriptionRequired: false, uses: 'Fever, headache, body pain', dosage: '1-2 tablets 3-4 times daily', sideEffects: 'Rare: skin rash', warning: 'Do not exceed 4g per day', storage: 'Store below 30°C', aliases: ['ace tablet'] },
  { name: 'Ace Plus', nameBn: 'এস প্লাস', genericName: 'Paracetamol + Caffeine', strength: '500mg+65mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Pain & Fever', mrp: 2.50, sellingPrice: 2.30, unitType: 'tablet', packSize: '10 tablets/strip', prescriptionRequired: false, uses: 'Headache, migraine', dosage: '1-2 tablets every 4-6 hours', aliases: ['ace plus'] },
  { name: 'Tofacin', nameBn: 'টোফাসিন', genericName: 'Ketorolac', strength: '10mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Pain & Fever', mrp: 5, sellingPrice: 4.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Moderate to severe pain', dosage: '1 tablet every 4-6 hours', sideEffects: 'GI upset, headache', warning: 'Short-term use only (max 5 days)', storage: 'Store below 30°C' },
  { name: 'Ibuprofen', nameBn: 'আইবুপ্রোফেন', genericName: 'Ibuprofen', strength: '400mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Pain & Fever', mrp: 3, sellingPrice: 2.70, unitType: 'tablet', prescriptionRequired: false, uses: 'Pain, inflammation, fever', dosage: '1 tablet 3 times daily after food', sideEffects: 'Stomach upset, dizziness', warning: 'Take with food', storage: 'Store below 30°C' },
  { name: 'Naprosyn', nameBn: 'ন্যাপ্রোসিন', genericName: 'Naproxen', strength: '500mg', dosageForm: 'Tablet', manufacturer: 'Incepta Pharmaceuticals', category: 'Pain & Fever', mrp: 6, sellingPrice: 5.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Arthritis, muscle pain', dosage: '1 tablet twice daily', sideEffects: 'GI bleeding, headache', warning: 'Take with food', storage: 'Store below 30°C' },
  { name: 'Diclofenac', nameBn: 'ডাইক্লোফেনাক', genericName: 'Diclofenac Sodium', strength: '50mg', dosageForm: 'Tablet', manufacturer: 'Opsonin Pharma', category: 'Pain & Fever', mrp: 2.50, sellingPrice: 2.20, unitType: 'tablet', prescriptionRequired: true, uses: 'Joint pain, back pain, arthritis', dosage: '1 tablet 2-3 times daily after food', sideEffects: 'Stomach upset, dizziness', warning: 'Take after food' },
  { name: 'Tramadol', nameBn: 'ট্রামাডল', genericName: 'Tramadol', strength: '50mg', dosageForm: 'Capsule', manufacturer: 'Renata Limited', category: 'Pain & Fever', mrp: 8, sellingPrice: 7.50, unitType: 'capsule', prescriptionRequired: true, uses: 'Moderate to severe pain', dosage: '1 capsule every 6 hours', sideEffects: 'Drowsiness, nausea, constipation', warning: 'May cause dependency' },

  // COLD & COUGH
  { name: 'Fexo', nameBn: 'ফেক্সো', genericName: 'Fexofenadine', strength: '120mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Cold & Cough', mrp: 8, sellingPrice: 7.50, unitType: 'tablet', prescriptionRequired: false, uses: 'Allergy, sneezing, runny nose', dosage: '1 tablet daily', sideEffects: 'Headache, drowsiness', storage: 'Store below 30°C', aliases: ['fexofenadine'] },
  { name: 'Histacin', nameBn: 'হিস্টাসিন', genericName: 'Chlorpheniramine', strength: '4mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Cold & Cough', mrp: 0.60, sellingPrice: 0.50, unitType: 'tablet', prescriptionRequired: false, uses: 'Allergy, cold symptoms', dosage: '1 tablet 3 times daily', sideEffects: 'Drowsiness', warning: 'May cause sleepiness' },
  { name: 'Brodil', nameBn: 'ব্রডিল', genericName: 'Salbutamol', strength: '2mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Respiratory', mrp: 1.50, sellingPrice: 1.30, unitType: 'tablet', prescriptionRequired: true, uses: 'Asthma, bronchospasm', dosage: '1-2 tablets 3-4 times daily', sideEffects: 'Tremor, palpitations' },
  { name: 'Ambrolite-D', nameBn: 'অ্যামব্রোলাইট-ডি', genericName: 'Ambroxol + Dextromethorphan + Guaifenesin', strength: '15mg+10mg+50mg/5ml', dosageForm: 'Syrup', manufacturer: 'Square Pharmaceuticals', category: 'Cold & Cough', mrp: 80, sellingPrice: 75, unitType: 'bottle', packSize: '100ml', prescriptionRequired: false, uses: 'Cough, chest congestion', dosage: '10ml 3 times daily' },
  { name: 'Tusca-D', nameBn: 'টাস্কা-ডি', genericName: 'Dextromethorphan', strength: '10mg/5ml', dosageForm: 'Syrup', manufacturer: 'ACI Limited', category: 'Cold & Cough', mrp: 65, sellingPrice: 60, unitType: 'bottle', packSize: '100ml', prescriptionRequired: false, uses: 'Dry cough', dosage: '10ml every 4-6 hours' },
  { name: 'Montelukast', nameBn: 'মন্টেলুকাস্ট', genericName: 'Montelukast', strength: '10mg', dosageForm: 'Tablet', manufacturer: 'Incepta Pharmaceuticals', category: 'Respiratory', mrp: 10, sellingPrice: 9, unitType: 'tablet', prescriptionRequired: true, uses: 'Asthma prevention, allergic rhinitis', dosage: '1 tablet daily at bedtime' },

  // DIABETES
  { name: 'Metformin', nameBn: 'মেটফরমিন', genericName: 'Metformin', strength: '500mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Diabetes', mrp: 2, sellingPrice: 1.80, unitType: 'tablet', prescriptionRequired: true, uses: 'Type 2 diabetes', dosage: '1 tablet 2-3 times daily with meals', sideEffects: 'Nausea, diarrhea', warning: 'Take with food', aliases: ['metformin', 'glucophage'] },
  { name: 'Comet', nameBn: 'কমেট', genericName: 'Metformin', strength: '850mg', dosageForm: 'Tablet', manufacturer: 'Renata Limited', category: 'Diabetes', mrp: 4, sellingPrice: 3.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Type 2 diabetes', dosage: '1 tablet 2 times daily', sideEffects: 'GI upset, metallic taste' },
  { name: 'Glimepiride', nameBn: 'গ্লিমেপিরাইড', genericName: 'Glimepiride', strength: '2mg', dosageForm: 'Tablet', manufacturer: 'Incepta Pharmaceuticals', category: 'Diabetes', mrp: 5, sellingPrice: 4.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Type 2 diabetes', dosage: '1 tablet daily before breakfast', sideEffects: 'Hypoglycemia', warning: 'Monitor blood sugar' },
  { name: 'Insulin Mixtard', nameBn: 'ইনসুলিন মিক্সটার্ড', genericName: 'Insulin (70/30)', strength: '100IU/ml', dosageForm: 'Injection', manufacturer: 'Novo Nordisk', category: 'Diabetes', mrp: 520, sellingPrice: 500, unitType: 'vial', packSize: '10ml vial', prescriptionRequired: true, uses: 'Diabetes (Type 1 & 2)', dosage: 'As prescribed by doctor', warning: 'Store in refrigerator 2-8°C' },
  { name: 'Gliclazide', nameBn: 'গ্লিক্লাজাইড', genericName: 'Gliclazide', strength: '80mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Diabetes', mrp: 4, sellingPrice: 3.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Type 2 diabetes', dosage: '1 tablet twice daily before meals' },
  { name: 'Sitagliptin', nameBn: 'সিটাগ্লিপটিন', genericName: 'Sitagliptin', strength: '50mg', dosageForm: 'Tablet', manufacturer: 'Aristopharma', category: 'Diabetes', mrp: 18, sellingPrice: 16, unitType: 'tablet', prescriptionRequired: true, uses: 'Type 2 diabetes', dosage: '1 tablet daily' },
  { name: 'Vildagliptin', nameBn: 'ভিল্ডাগ্লিপটিন', genericName: 'Vildagliptin', strength: '50mg', dosageForm: 'Tablet', manufacturer: 'Beximco Pharmaceuticals', category: 'Diabetes', mrp: 15, sellingPrice: 14, unitType: 'tablet', prescriptionRequired: true, uses: 'Type 2 diabetes', dosage: '1 tablet twice daily' },
  { name: 'Empagliflozin', nameBn: 'এমপাগ্লিফ্লোজিন', genericName: 'Empagliflozin', strength: '25mg', dosageForm: 'Tablet', manufacturer: 'Incepta Pharmaceuticals', category: 'Diabetes', mrp: 25, sellingPrice: 23, unitType: 'tablet', prescriptionRequired: true, uses: 'Type 2 diabetes, heart failure', dosage: '1 tablet daily' },

  // HEART & BLOOD PRESSURE
  { name: 'Amlodipine', nameBn: 'অ্যামলোডিপিন', genericName: 'Amlodipine', strength: '5mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Heart & Blood Pressure', mrp: 3, sellingPrice: 2.70, unitType: 'tablet', prescriptionRequired: true, uses: 'High blood pressure, angina', dosage: '1 tablet daily', sideEffects: 'Ankle swelling, flushing', aliases: ['amlodipine', 'norvasc'] },
  { name: 'Losartan', nameBn: 'লোসারটান', genericName: 'Losartan', strength: '50mg', dosageForm: 'Tablet', manufacturer: 'Beximco Pharmaceuticals', category: 'Heart & Blood Pressure', mrp: 5, sellingPrice: 4.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Hypertension', dosage: '1 tablet daily', sideEffects: 'Dizziness, cough' },
  { name: 'Atenolol', nameBn: 'অ্যাটেনোলল', genericName: 'Atenolol', strength: '50mg', dosageForm: 'Tablet', manufacturer: 'Incepta Pharmaceuticals', category: 'Heart & Blood Pressure', mrp: 2, sellingPrice: 1.80, unitType: 'tablet', prescriptionRequired: true, uses: 'High blood pressure, angina', dosage: '1 tablet daily', sideEffects: 'Fatigue, cold extremities' },
  { name: 'Atorvastatin', nameBn: 'অ্যাটরভাস্ট্যাটিন', genericName: 'Atorvastatin', strength: '10mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Heart & Blood Pressure', mrp: 6, sellingPrice: 5.50, unitType: 'tablet', prescriptionRequired: true, uses: 'High cholesterol', dosage: '1 tablet daily at night', sideEffects: 'Muscle pain, headache', aliases: ['lipitor'] },
  { name: 'Clopidogrel', nameBn: 'ক্লোপিডোগ্রেল', genericName: 'Clopidogrel', strength: '75mg', dosageForm: 'Tablet', manufacturer: 'Renata Limited', category: 'Heart & Blood Pressure', mrp: 8, sellingPrice: 7.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Blood clot prevention', dosage: '1 tablet daily', sideEffects: 'Bleeding risk' },
  { name: 'Aspirin', nameBn: 'অ্যাসপিরিন', genericName: 'Aspirin', strength: '75mg', dosageForm: 'Tablet', manufacturer: 'ACI Limited', category: 'Heart & Blood Pressure', mrp: 1, sellingPrice: 0.90, unitType: 'tablet', prescriptionRequired: false, uses: 'Blood thinner, heart protection', dosage: '1 tablet daily', sideEffects: 'GI upset, bleeding', warning: 'Do not take on empty stomach' },
  { name: 'Ramipril', nameBn: 'র‍্যামিপ্রিল', genericName: 'Ramipril', strength: '5mg', dosageForm: 'Tablet', manufacturer: 'Opsonin Pharma', category: 'Heart & Blood Pressure', mrp: 4, sellingPrice: 3.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Hypertension, heart failure', dosage: '1 tablet daily' },
  { name: 'Bisoprolol', nameBn: 'বিসোপ্রোলল', genericName: 'Bisoprolol', strength: '5mg', dosageForm: 'Tablet', manufacturer: 'Healthcare Pharmaceuticals', category: 'Heart & Blood Pressure', mrp: 5, sellingPrice: 4.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Hypertension, heart failure', dosage: '1 tablet daily' },

  // ANTIBIOTICS
  { name: 'Azithromycin', nameBn: 'অ্যাজিথ্রোমাইসিন', genericName: 'Azithromycin', strength: '500mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Antibiotics', mrp: 25, sellingPrice: 23, unitType: 'tablet', prescriptionRequired: true, uses: 'Bacterial infections', dosage: '1 tablet daily for 3 days', sideEffects: 'Diarrhea, nausea', warning: 'Complete the course', aliases: ['zimax', 'azithral'] },
  { name: 'Amoxicillin', nameBn: 'অ্যামোক্সিসিলিন', genericName: 'Amoxicillin', strength: '500mg', dosageForm: 'Capsule', manufacturer: 'Beximco Pharmaceuticals', category: 'Antibiotics', mrp: 5, sellingPrice: 4.50, unitType: 'capsule', prescriptionRequired: true, uses: 'Bacterial infections', dosage: '1 capsule 3 times daily', sideEffects: 'Diarrhea, rash', warning: 'Complete the course' },
  { name: 'Ciprofloxacin', nameBn: 'সিপ্রোফ্লক্সাসিন', genericName: 'Ciprofloxacin', strength: '500mg', dosageForm: 'Tablet', manufacturer: 'Incepta Pharmaceuticals', category: 'Antibiotics', mrp: 6, sellingPrice: 5.50, unitType: 'tablet', prescriptionRequired: true, uses: 'UTI, respiratory infections', dosage: '1 tablet twice daily', sideEffects: 'Nausea, tendon problems' },
  { name: 'Cefixime', nameBn: 'সেফিক্সিম', genericName: 'Cefixime', strength: '200mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Antibiotics', mrp: 18, sellingPrice: 16, unitType: 'tablet', prescriptionRequired: true, uses: 'Respiratory, urinary infections', dosage: '1 tablet twice daily' },
  { name: 'Ceftriaxone', nameBn: 'সেফট্রিয়াক্সোন', genericName: 'Ceftriaxone', strength: '1g', dosageForm: 'Injection', manufacturer: 'Renata Limited', category: 'Antibiotics', mrp: 120, sellingPrice: 110, unitType: 'vial', prescriptionRequired: true, uses: 'Severe bacterial infections', dosage: 'As prescribed by doctor', warning: 'Hospital use' },
  { name: 'Levofloxacin', nameBn: 'লিভোফ্লক্সাসিন', genericName: 'Levofloxacin', strength: '500mg', dosageForm: 'Tablet', manufacturer: 'Eskayef Pharmaceuticals', category: 'Antibiotics', mrp: 15, sellingPrice: 14, unitType: 'tablet', prescriptionRequired: true, uses: 'Respiratory, urinary infections', dosage: '1 tablet daily' },
  { name: 'Doxycycline', nameBn: 'ডক্সিসাইক্লিন', genericName: 'Doxycycline', strength: '100mg', dosageForm: 'Capsule', manufacturer: 'Acme Laboratories', category: 'Antibiotics', mrp: 4, sellingPrice: 3.50, unitType: 'capsule', prescriptionRequired: true, uses: 'Acne, respiratory infections', dosage: '1 capsule twice daily' },
  { name: 'Flucloxacillin', nameBn: 'ফ্লুক্লক্সাসিলিন', genericName: 'Flucloxacillin', strength: '500mg', dosageForm: 'Capsule', manufacturer: 'Drug International', category: 'Antibiotics', mrp: 8, sellingPrice: 7, unitType: 'capsule', prescriptionRequired: true, uses: 'Skin infections', dosage: '1 capsule 4 times daily' },
  { name: 'Metronidazole', nameBn: 'মেট্রোনিডাজল', genericName: 'Metronidazole', strength: '400mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Antibiotics', mrp: 2, sellingPrice: 1.80, unitType: 'tablet', prescriptionRequired: true, uses: 'Anaerobic infections, amoebiasis', dosage: '1 tablet 3 times daily', warning: 'Avoid alcohol' },

  // VITAMINS & SUPPLEMENTS
  { name: 'Calcium + Vitamin D', nameBn: 'ক্যালসিয়াম + ভিটামিন ডি', genericName: 'Calcium Carbonate + Vitamin D3', strength: '500mg+200IU', dosageForm: 'Tablet', manufacturer: 'Renata Limited', category: 'Vitamins & Supplements', mrp: 6, sellingPrice: 5.50, unitType: 'tablet', prescriptionRequired: false, uses: 'Bone health, calcium deficiency', dosage: '1 tablet twice daily' },
  { name: 'Vitamin C', nameBn: 'ভিটামিন সি', genericName: 'Ascorbic Acid', strength: '250mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Vitamins & Supplements', mrp: 2, sellingPrice: 1.80, unitType: 'tablet', prescriptionRequired: false, uses: 'Immunity boost, scurvy prevention', dosage: '1 tablet daily' },
  { name: 'Folic Acid', nameBn: 'ফলিক অ্যাসিড', genericName: 'Folic Acid', strength: '5mg', dosageForm: 'Tablet', manufacturer: 'Incepta Pharmaceuticals', category: 'Vitamins & Supplements', mrp: 1, sellingPrice: 0.80, unitType: 'tablet', prescriptionRequired: false, uses: 'Pregnancy, anemia', dosage: '1 tablet daily' },
  { name: 'Iron + Folic Acid', nameBn: 'আয়রন + ফলিক অ্যাসিড', genericName: 'Ferrous Fumarate + Folic Acid', strength: '200mg+0.5mg', dosageForm: 'Tablet', manufacturer: 'Beximco Pharmaceuticals', category: 'Vitamins & Supplements', mrp: 2, sellingPrice: 1.80, unitType: 'tablet', prescriptionRequired: false, uses: 'Iron deficiency anemia', dosage: '1 tablet daily' },
  { name: 'Vitamin B Complex', nameBn: 'ভিটামিন বি কমপ্লেক্স', genericName: 'Vitamin B Complex', strength: '', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Vitamins & Supplements', mrp: 1.50, sellingPrice: 1.30, unitType: 'tablet', prescriptionRequired: false, uses: 'B vitamin deficiency, nerve health', dosage: '1 tablet daily' },
  { name: 'Zinc', nameBn: 'জিংক', genericName: 'Zinc Sulfate', strength: '20mg', dosageForm: 'Tablet', manufacturer: 'ACI Limited', category: 'Vitamins & Supplements', mrp: 2, sellingPrice: 1.80, unitType: 'tablet', prescriptionRequired: false, uses: 'Zinc deficiency, diarrhea, immunity', dosage: '1 tablet daily' },
  { name: 'Vitamin E', nameBn: 'ভিটামিন ই', genericName: 'Tocopherol', strength: '200mg', dosageForm: 'Capsule', manufacturer: 'Opsonin Pharma', category: 'Vitamins & Supplements', mrp: 5, sellingPrice: 4.50, unitType: 'capsule', prescriptionRequired: false, uses: 'Antioxidant, skin health', dosage: '1 capsule daily' },
  { name: 'Multivitamin', nameBn: 'মাল্টিভিটামিন', genericName: 'Multivitamin + Minerals', strength: '', dosageForm: 'Tablet', manufacturer: 'Aristopharma', category: 'Vitamins & Supplements', mrp: 6, sellingPrice: 5.50, unitType: 'tablet', prescriptionRequired: false, uses: 'General health, nutrient support', dosage: '1 tablet daily' },

  // GASTROINTESTINAL
  { name: 'Omeprazole', nameBn: 'ওমিপ্রাজল', genericName: 'Omeprazole', strength: '20mg', dosageForm: 'Capsule', manufacturer: 'Square Pharmaceuticals', category: 'Gastrointestinal', mrp: 4, sellingPrice: 3.50, unitType: 'capsule', prescriptionRequired: false, uses: 'Acidity, ulcer, GERD', dosage: '1 capsule daily before breakfast', aliases: ['seclo', 'omeprazole', 'গ্যাস্ট্রিক'] },
  { name: 'Esomeprazole', nameBn: 'ইসোমিপ্রাজল', genericName: 'Esomeprazole', strength: '20mg', dosageForm: 'Capsule', manufacturer: 'Incepta Pharmaceuticals', category: 'Gastrointestinal', mrp: 6, sellingPrice: 5.50, unitType: 'capsule', prescriptionRequired: false, uses: 'GERD, peptic ulcer', dosage: '1 capsule daily before meal' },
  { name: 'Ranitidine', nameBn: 'র‍্যানিটিডিন', genericName: 'Ranitidine', strength: '150mg', dosageForm: 'Tablet', manufacturer: 'Beximco Pharmaceuticals', category: 'Gastrointestinal', mrp: 2, sellingPrice: 1.80, unitType: 'tablet', prescriptionRequired: false, uses: 'Acidity, ulcer', dosage: '1 tablet twice daily' },
  { name: 'Antacid Suspension', nameBn: 'অ্যান্টাসিড সাসপেনশন', genericName: 'Aluminium Hydroxide + Magnesium Hydroxide', strength: '', dosageForm: 'Suspension', manufacturer: 'Square Pharmaceuticals', category: 'Gastrointestinal', mrp: 70, sellingPrice: 65, unitType: 'bottle', packSize: '200ml', prescriptionRequired: false, uses: 'Acidity, heartburn', dosage: '15-30ml after meals' },
  { name: 'Domperidone', nameBn: 'ডমপেরিডন', genericName: 'Domperidone', strength: '10mg', dosageForm: 'Tablet', manufacturer: 'Renata Limited', category: 'Gastrointestinal', mrp: 2.50, sellingPrice: 2.20, unitType: 'tablet', prescriptionRequired: false, uses: 'Nausea, vomiting, bloating', dosage: '1 tablet 3 times daily before meals' },
  { name: 'ORS', nameBn: 'ওআরএস', genericName: 'Oral Rehydration Salts', strength: '', dosageForm: 'Sachet', manufacturer: 'Acme Laboratories', category: 'Gastrointestinal', mrp: 8, sellingPrice: 7, unitType: 'sachet', prescriptionRequired: false, uses: 'Dehydration, diarrhea', dosage: '1 sachet in 500ml water', aliases: ['saline', 'স্যালাইন'] },
  { name: 'Pantoprazole', nameBn: 'প্যান্টোপ্রাজল', genericName: 'Pantoprazole', strength: '40mg', dosageForm: 'Tablet', manufacturer: 'Healthcare Pharmaceuticals', category: 'Gastrointestinal', mrp: 5, sellingPrice: 4.50, unitType: 'tablet', prescriptionRequired: false, uses: 'GERD, peptic ulcer', dosage: '1 tablet daily before breakfast' },

  // SKIN CARE
  { name: 'Betamethasone Cream', nameBn: 'বিটামেথাসন ক্রিম', genericName: 'Betamethasone', strength: '0.1%', dosageForm: 'Cream', manufacturer: 'Incepta Pharmaceuticals', category: 'Skin Care', mrp: 35, sellingPrice: 32, unitType: 'tube', packSize: '15g', prescriptionRequired: true, uses: 'Eczema, dermatitis, skin inflammation', dosage: 'Apply thin layer 2 times daily' },
  { name: 'Clotrimazole Cream', nameBn: 'ক্লোট্রিমাজল ক্রিম', genericName: 'Clotrimazole', strength: '1%', dosageForm: 'Cream', manufacturer: 'Square Pharmaceuticals', category: 'Skin Care', mrp: 30, sellingPrice: 28, unitType: 'tube', packSize: '15g', prescriptionRequired: false, uses: 'Fungal infections', dosage: 'Apply 2-3 times daily' },
  { name: 'Fusidic Acid Cream', nameBn: 'ফিউসিডিক অ্যাসিড ক্রিম', genericName: 'Fusidic Acid', strength: '2%', dosageForm: 'Cream', manufacturer: 'Renata Limited', category: 'Skin Care', mrp: 80, sellingPrice: 75, unitType: 'tube', packSize: '15g', prescriptionRequired: true, uses: 'Skin infections', dosage: 'Apply 2-3 times daily' },
  { name: 'Ketoconazole Cream', nameBn: 'কিটোকোনাজল ক্রিম', genericName: 'Ketoconazole', strength: '2%', dosageForm: 'Cream', manufacturer: 'Beximco Pharmaceuticals', category: 'Skin Care', mrp: 40, sellingPrice: 38, unitType: 'tube', packSize: '15g', prescriptionRequired: false, uses: 'Fungal infections, dandruff', dosage: 'Apply 1-2 times daily' },

  // EYE & EAR
  { name: 'Chloramphenicol Eye Drop', nameBn: 'ক্লোরামফেনিকল আই ড্রপ', genericName: 'Chloramphenicol', strength: '0.5%', dosageForm: 'Eye Drop', manufacturer: 'Opsonin Pharma', category: 'Eye & Ear', mrp: 30, sellingPrice: 28, unitType: 'bottle', packSize: '10ml', prescriptionRequired: true, uses: 'Eye infections', dosage: '1-2 drops 3-4 times daily' },
  { name: 'Ciprofloxacin Eye Drop', nameBn: 'সিপ্রোফ্লক্সাসিন আই ড্রপ', genericName: 'Ciprofloxacin', strength: '0.3%', dosageForm: 'Eye Drop', manufacturer: 'Incepta Pharmaceuticals', category: 'Eye & Ear', mrp: 40, sellingPrice: 38, unitType: 'bottle', packSize: '5ml', prescriptionRequired: true, uses: 'Bacterial eye infections', dosage: '1-2 drops 4-6 times daily' },
  { name: 'Artificial Tears', nameBn: 'আর্টিফিশিয়াল টিয়ার্স', genericName: 'Carboxymethylcellulose', strength: '0.5%', dosageForm: 'Eye Drop', manufacturer: 'Aristopharma', category: 'Eye & Ear', mrp: 120, sellingPrice: 110, unitType: 'bottle', packSize: '10ml', prescriptionRequired: false, uses: 'Dry eyes', dosage: '1-2 drops as needed' },

  // ALLERGY
  { name: 'Cetirizine', nameBn: 'সেটিরিজিন', genericName: 'Cetirizine', strength: '10mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Allergy', mrp: 3, sellingPrice: 2.70, unitType: 'tablet', prescriptionRequired: false, uses: 'Allergy, urticaria, rhinitis', dosage: '1 tablet daily', sideEffects: 'Drowsiness', aliases: ['zyrtec', 'cetirizine'] },
  { name: 'Loratadine', nameBn: 'লরাটাডিন', genericName: 'Loratadine', strength: '10mg', dosageForm: 'Tablet', manufacturer: 'Beximco Pharmaceuticals', category: 'Allergy', mrp: 4, sellingPrice: 3.50, unitType: 'tablet', prescriptionRequired: false, uses: 'Allergy, hay fever', dosage: '1 tablet daily' },
  { name: 'Desloratadine', nameBn: 'ডেসলরাটাডিন', genericName: 'Desloratadine', strength: '5mg', dosageForm: 'Tablet', manufacturer: 'Incepta Pharmaceuticals', category: 'Allergy', mrp: 6, sellingPrice: 5.50, unitType: 'tablet', prescriptionRequired: false, uses: 'Chronic allergy, urticaria', dosage: '1 tablet daily' },
  { name: 'Prednisolone', nameBn: 'প্রেডনিসোলন', genericName: 'Prednisolone', strength: '5mg', dosageForm: 'Tablet', manufacturer: 'ACI Limited', category: 'Allergy', mrp: 1.50, sellingPrice: 1.30, unitType: 'tablet', prescriptionRequired: true, uses: 'Severe allergy, inflammation', dosage: 'As prescribed by doctor', warning: 'Do not stop abruptly' },

  // WOMEN'S HEALTH
  { name: 'Norethisterone', nameBn: 'নরইথিস্টেরন', genericName: 'Norethisterone', strength: '5mg', dosageForm: 'Tablet', manufacturer: 'Renata Limited', category: "Women's Health", mrp: 3, sellingPrice: 2.70, unitType: 'tablet', prescriptionRequired: true, uses: 'Menstrual irregularities', dosage: 'As prescribed by doctor' },
  { name: 'Oral Contraceptive', nameBn: 'ওরাল কন্ট্রাসেপটিভ', genericName: 'Levonorgestrel + Ethinyl Estradiol', strength: '0.15mg+0.03mg', dosageForm: 'Tablet', manufacturer: 'Incepta Pharmaceuticals', category: "Women's Health", mrp: 20, sellingPrice: 18, unitType: 'pack', packSize: '21 tablets', prescriptionRequired: true, uses: 'Contraception', dosage: '1 tablet daily for 21 days' },
  { name: 'Misoprostol', nameBn: 'মিসোপ্রস্টল', genericName: 'Misoprostol', strength: '200mcg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: "Women's Health", mrp: 8, sellingPrice: 7, unitType: 'tablet', prescriptionRequired: true, uses: 'Gastric ulcer protection', dosage: 'As prescribed by doctor', warning: 'Not for pregnant women' },

  // MENTAL HEALTH
  { name: 'Sertraline', nameBn: 'সারট্রালিন', genericName: 'Sertraline', strength: '50mg', dosageForm: 'Tablet', manufacturer: 'Square Pharmaceuticals', category: 'Mental Health', mrp: 7, sellingPrice: 6.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Depression, anxiety, OCD', dosage: '1 tablet daily', sideEffects: 'Nausea, insomnia' },
  { name: 'Escitalopram', nameBn: 'ইসিটালোপ্রাম', genericName: 'Escitalopram', strength: '10mg', dosageForm: 'Tablet', manufacturer: 'Incepta Pharmaceuticals', category: 'Mental Health', mrp: 8, sellingPrice: 7.50, unitType: 'tablet', prescriptionRequired: true, uses: 'Depression, anxiety', dosage: '1 tablet daily' },
  { name: 'Clonazepam', nameBn: 'ক্লোনাজেপাম', genericName: 'Clonazepam', strength: '0.5mg', dosageForm: 'Tablet', manufacturer: 'Renata Limited', category: 'Mental Health', mrp: 3, sellingPrice: 2.70, unitType: 'tablet', prescriptionRequired: true, uses: 'Anxiety, seizures', dosage: 'As prescribed by doctor', warning: 'May cause dependency' },

  // PERSONAL CARE
  { name: 'Povidone Iodine Solution', nameBn: 'পোভিডন আয়োডিন সলিউশন', genericName: 'Povidone Iodine', strength: '5%', dosageForm: 'Solution', manufacturer: 'ACI Limited', category: 'Personal Care', mrp: 45, sellingPrice: 42, unitType: 'bottle', packSize: '100ml', prescriptionRequired: false, uses: 'Wound cleaning, antiseptic', dosage: 'Apply to affected area', aliases: ['betadine'] },
  { name: 'Chlorhexidine Mouthwash', nameBn: 'ক্লোরহেক্সিডিন মাউথওয়াশ', genericName: 'Chlorhexidine', strength: '0.2%', dosageForm: 'Mouthwash', manufacturer: 'Square Pharmaceuticals', category: 'Personal Care', mrp: 120, sellingPrice: 110, unitType: 'bottle', packSize: '200ml', prescriptionRequired: false, uses: 'Gum disease, oral hygiene', dosage: 'Rinse 10ml twice daily' },

  // MEDICAL DEVICES
  { name: 'Blood Glucose Test Strip', nameBn: 'ব্লাড গ্লুকোজ টেস্ট স্ট্রিপ', genericName: '', strength: '', dosageForm: 'Strip', manufacturer: 'Accu-Chek', category: 'Medical Devices', mrp: 800, sellingPrice: 750, unitType: 'box', packSize: '50 strips', prescriptionRequired: false, uses: 'Blood sugar monitoring' },
  { name: 'Digital Thermometer', nameBn: 'ডিজিটাল থার্মোমিটার', genericName: '', strength: '', dosageForm: 'Device', manufacturer: 'Omron', category: 'Medical Devices', mrp: 250, sellingPrice: 230, unitType: 'piece', prescriptionRequired: false, uses: 'Temperature measurement' },
  { name: 'Blood Pressure Monitor', nameBn: 'ব্লাড প্রেশার মনিটর', genericName: '', strength: '', dosageForm: 'Device', manufacturer: 'Omron', category: 'Medical Devices', mrp: 3500, sellingPrice: 3200, unitType: 'piece', prescriptionRequired: false, uses: 'Blood pressure monitoring' },
  { name: 'Surgical Mask', nameBn: 'সার্জিক্যাল মাস্ক', genericName: '', strength: '', dosageForm: 'Mask', manufacturer: 'General', category: 'Medical Devices', mrp: 100, sellingPrice: 90, unitType: 'box', packSize: '50 pieces', prescriptionRequired: false, uses: 'Infection protection' },
  { name: 'Nebulizer Machine', nameBn: 'নেবুলাইজার মেশিন', genericName: '', strength: '', dosageForm: 'Device', manufacturer: 'Omron', category: 'Medical Devices', mrp: 3000, sellingPrice: 2800, unitType: 'piece', prescriptionRequired: false, uses: 'Respiratory medication delivery' },

  // HERBAL
  { name: 'Neem Capsule', nameBn: 'নিম ক্যাপসুল', genericName: 'Neem Extract', strength: '500mg', dosageForm: 'Capsule', manufacturer: 'Hamdard', category: 'Herbal & Ayurvedic', mrp: 5, sellingPrice: 4.50, unitType: 'capsule', prescriptionRequired: false, uses: 'Skin health, blood purifier', dosage: '1 capsule twice daily' },
  { name: 'Tulsi Drop', nameBn: 'তুলসি ড্রপ', genericName: 'Tulsi Extract', strength: '', dosageForm: 'Drop', manufacturer: 'Hamdard', category: 'Herbal & Ayurvedic', mrp: 80, sellingPrice: 75, unitType: 'bottle', packSize: '20ml', prescriptionRequired: false, uses: 'Immunity, cough, cold', dosage: '3-5 drops twice daily in water' },
];

function seed() {
  console.log('Seeding medicines...');
  const store = DataService.get('products');
  const existing = store.findAll({});

  if (existing.length >= 400) {
    console.log(`Already have ${existing.length} products. Skipping medicine seed.`);
    console.log('To re-seed, clear the products file first.');
    return;
  }

  let added = 0;
  let skipped = 0;

  const allMedicines = [...medicines, ...extendedMedicines, ...extendedMedicines2, ...extendedMedicines3, ...extendedMedicines4];
  console.log(`Processing ${allMedicines.length} medicine entries...`);

  for (const med of allMedicines) {
    const isDup = existing.some(e =>
      e.name?.toLowerCase() === med.name.toLowerCase() &&
      e.strength === med.strength &&
      e.manufacturer === med.manufacturer
    );
    if (isDup) {
      skipped++;
      continue;
    }

    store.create({
      ...med,
      stockQuantity: Math.floor(Math.random() * 500) + 50,
      batchNumber: 'B' + (Date.now() + added).toString(36).toUpperCase().slice(-6) + added.toString(36).toUpperCase(),
      expiryDate: new Date(Date.now() + (365 + Math.floor(Math.random() * 365)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      active: true,
      featured: Math.random() > 0.7,
      soldCount: Math.floor(Math.random() * 100),
      imageUrl: '/assets/images/medicine-placeholder.svg',
      images: [],
      slug: med.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
    added++;
  }

  console.log(`\nMedicine seed complete!`);
  console.log(`  Added: ${added}`);
  console.log(`  Skipped (duplicates): ${skipped}`);
  console.log(`  Total products now: ${store.count()}`);
  console.log('\n  NOTE: Stock quantities and expiry dates are sample data for development.');
  console.log('  Import real inventory data via Admin > Product Import for production use.');
}

seed();
