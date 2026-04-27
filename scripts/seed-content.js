/**
 * Seed blog posts and lab tests for Medicine Bazar
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const DataService = require('../backend/services/DataService');

const blogPosts = [
  {
    title: 'How to Manage Diabetes at Home',
    titleBn: 'ঘরে বসে ডায়াবেটিস কিভাবে নিয়ন্ত্রণ করবেন',
    slug: 'how-to-manage-diabetes-at-home',
    category: 'Diabetes Care',
    excerpt: 'Diabetes is a chronic condition that requires daily management. Learn how to monitor blood sugar, take medications properly, and maintain a healthy lifestyle.',
    excerptBn: 'ডায়াবেটিস একটি দীর্ঘমেয়াদী রোগ যা প্রতিদিন নিয়ন্ত্রণ করা প্রয়োজন। রক্তের শর্করা পরীক্ষা, সঠিক ওষুধ সেবন এবং স্বাস্থ্যকর জীবনযাপন সম্পর্কে জানুন।',
    content: `<h2>Understanding Diabetes</h2>
<p>Diabetes mellitus is a metabolic disease characterized by high blood sugar levels. In Bangladesh, approximately 8.4 million adults have diabetes, with numbers rising every year.</p>
<h3>Types of Diabetes</h3>
<ul>
<li><strong>Type 1 Diabetes:</strong> The body doesn't produce insulin. Usually diagnosed in children and young adults.</li>
<li><strong>Type 2 Diabetes:</strong> The body doesn't use insulin properly. Most common type, affecting 90-95% of diabetic patients.</li>
<li><strong>Gestational Diabetes:</strong> Develops during pregnancy and usually goes away after delivery.</li>
</ul>
<h3>Daily Management Tips</h3>
<ol>
<li><strong>Monitor Blood Sugar Regularly:</strong> Check fasting and post-meal blood sugar as advised by your doctor.</li>
<li><strong>Take Medications on Time:</strong> Whether it's Metformin, Glimepiride, or Insulin, never skip doses.</li>
<li><strong>Follow a Balanced Diet:</strong> Include vegetables, lean proteins, and whole grains. Avoid excessive rice and sweets.</li>
<li><strong>Exercise Daily:</strong> Walk for at least 30 minutes every day.</li>
<li><strong>Regular Check-ups:</strong> HbA1c every 3 months, eye exam yearly, kidney function test yearly.</li>
</ol>
<h3>Common Diabetes Medicines in Bangladesh</h3>
<ul>
<li>Metformin (Sugamet, Glucomet) - First-line treatment</li>
<li>Glimepiride (Amaryl) - Helps pancreas produce more insulin</li>
<li>Sitagliptin (Istamet) - DPP-4 inhibitor</li>
<li>Empagliflozin (Jardiance) - SGLT2 inhibitor with heart benefits</li>
<li>Insulin (NovoRapid, Lantus) - For advanced cases</li>
</ul>
<p><strong>Disclaimer:</strong> Always consult your doctor before starting or changing any medication. This article is for educational purposes only.</p>`,
    author: 'Dr. Medicine Bazar',
    tags: ['diabetes', 'blood sugar', 'health tips', 'medicine'],
    featured: true,
    published: true,
    active: true,
    views: 245,
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Understanding High Blood Pressure: Prevention and Treatment',
    titleBn: 'উচ্চ রক্তচাপ: প্রতিরোধ ও চিকিৎসা',
    slug: 'understanding-high-blood-pressure',
    category: 'Heart Health',
    excerpt: 'High blood pressure is a silent killer. Learn about causes, symptoms, prevention, and common medications used in Bangladesh.',
    excerptBn: 'উচ্চ রক্তচাপ একটি নীরব ঘাতক। কারণ, লক্ষণ, প্রতিরোধ এবং বাংলাদেশে ব্যবহৃত সাধারণ ওষুধ সম্পর্কে জানুন।',
    content: `<h2>What is High Blood Pressure?</h2>
<p>Blood pressure is the force of blood pushing against the walls of your arteries. Normal blood pressure is below 120/80 mmHg. High blood pressure (hypertension) is when this force is consistently too high.</p>
<h3>Blood Pressure Categories</h3>
<ul>
<li><strong>Normal:</strong> Less than 120/80 mmHg</li>
<li><strong>Elevated:</strong> 120-129/less than 80 mmHg</li>
<li><strong>Stage 1 Hypertension:</strong> 130-139/80-89 mmHg</li>
<li><strong>Stage 2 Hypertension:</strong> 140/90 mmHg or higher</li>
</ul>
<h3>Prevention</h3>
<ol>
<li>Reduce salt intake (less than 5g per day)</li>
<li>Exercise regularly (30 minutes daily)</li>
<li>Maintain healthy weight</li>
<li>Quit smoking</li>
<li>Limit alcohol</li>
<li>Manage stress</li>
</ol>
<h3>Common BP Medicines</h3>
<ul>
<li>Amlodipine (Amcard) - Calcium channel blocker</li>
<li>Losartan (Losar) - ARB</li>
<li>Atenolol (Tenormin) - Beta blocker</li>
<li>Ramipril - ACE inhibitor</li>
</ul>
<p><strong>Important:</strong> Never stop BP medication without consulting your doctor, even if you feel fine.</p>`,
    author: 'Dr. Medicine Bazar',
    tags: ['blood pressure', 'heart', 'hypertension', 'health'],
    featured: true,
    published: true,
    active: true,
    views: 189,
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Common Cold and Fever: When to See a Doctor',
    titleBn: 'সর্দি-জ্বর: কখন ডাক্তার দেখাবেন',
    slug: 'common-cold-fever-when-to-see-doctor',
    category: 'General Health',
    excerpt: 'Most colds resolve on their own, but knowing when to seek medical help is important. Learn about symptoms, home remedies, and when medicines are needed.',
    excerptBn: 'বেশিরভাগ সর্দি এমনিতেই সেরে যায়, তবে কখন চিকিৎসা সেবা নিতে হবে তা জানা গুরুত্বপূর্ণ।',
    content: `<h2>Common Cold vs Flu</h2>
<p>The common cold and flu share many symptoms but are caused by different viruses. Understanding the difference helps in proper treatment.</p>
<h3>Cold Symptoms</h3>
<ul>
<li>Runny or stuffy nose</li>
<li>Sore throat</li>
<li>Mild body aches</li>
<li>Sneezing</li>
<li>Low-grade fever (rare in adults)</li>
</ul>
<h3>Flu Symptoms</h3>
<ul>
<li>High fever (38-40°C)</li>
<li>Severe body aches</li>
<li>Extreme fatigue</li>
<li>Dry cough</li>
<li>Headache</li>
</ul>
<h3>Home Remedies</h3>
<ol>
<li>Rest and sleep</li>
<li>Drink plenty of warm fluids</li>
<li>Gargle with warm salt water</li>
<li>Use steam inhalation</li>
<li>Take honey with warm water</li>
</ol>
<h3>When to See a Doctor</h3>
<ul>
<li>Fever above 39°C (102°F) for more than 3 days</li>
<li>Difficulty breathing</li>
<li>Chest pain</li>
<li>Symptoms worsening after initial improvement</li>
<li>In children: high fever, difficulty feeding, unusual irritability</li>
</ul>
<h3>Common OTC Medicines</h3>
<ul>
<li>Paracetamol (Napa, Ace) - For fever and pain</li>
<li>Antihistamines (Fexofenadine, Cetirizine) - For runny nose</li>
<li>Cough syrups - For dry or wet cough</li>
</ul>
<p><strong>Warning:</strong> Do not use antibiotics for viral infections. Only take antibiotics when prescribed by a doctor.</p>`,
    author: 'Dr. Medicine Bazar',
    tags: ['cold', 'fever', 'flu', 'home remedies'],
    featured: false,
    published: true,
    active: true,
    views: 312,
    publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Essential Medicines Every Home Should Have',
    titleBn: 'প্রতিটি ঘরে যেসব ওষুধ রাখা উচিত',
    slug: 'essential-medicines-every-home',
    category: 'Health Tips',
    excerpt: 'A well-stocked home medicine cabinet can help you handle minor health issues. Here\'s a comprehensive list of essential medicines.',
    excerptBn: 'একটি সুসজ্জিত হোম মেডিসিন ক্যাবিনেট ছোটখাটো স্বাস্থ্য সমস্যায় সাহায্য করতে পারে।',
    content: `<h2>Building Your Home Medicine Cabinet</h2>
<p>Having essential medicines at home can save time and provide quick relief for common ailments. Here's what every Bangladeshi household should keep.</p>
<h3>Must-Have Medicines</h3>
<ol>
<li><strong>Paracetamol (Napa/Ace 500mg):</strong> For fever and pain relief</li>
<li><strong>Antacid (Seclo/Maxpro):</strong> For acidity and heartburn</li>
<li><strong>Antihistamine (Fexo/Cetirizine):</strong> For allergies</li>
<li><strong>ORS Saline:</strong> For dehydration from diarrhea or vomiting</li>
<li><strong>Antiseptic Solution (Savlon/Dettol):</strong> For wound cleaning</li>
<li><strong>Band-aids and Gauze:</strong> For minor cuts</li>
<li><strong>Thermometer:</strong> Digital preferred</li>
<li><strong>BP Monitor:</strong> Especially if family has hypertension history</li>
</ol>
<h3>For Children</h3>
<ul>
<li>Paracetamol Syrup (Napa Syrup)</li>
<li>Paracetamol Drops (Napa Drop) for infants</li>
<li>ORS sachets</li>
<li>Zinc tablets</li>
</ul>
<h3>Storage Tips</h3>
<ul>
<li>Store in a cool, dry place away from direct sunlight</li>
<li>Keep out of reach of children</li>
<li>Check expiry dates regularly</li>
<li>Don't store in bathroom (humidity damages medicines)</li>
</ul>
<p><strong>Remember:</strong> Even OTC medicines should be taken as directed. When in doubt, consult a pharmacist.</p>`,
    author: 'Medicine Bazar Team',
    tags: ['home pharmacy', 'essential medicines', 'health tips', 'OTC'],
    featured: true,
    published: true,
    active: true,
    views: 456,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Vitamin D Deficiency: A Growing Problem in Bangladesh',
    titleBn: 'ভিটামিন ডি-এর ঘাটতি: বাংলাদেশে একটি ক্রমবর্ধমান সমস্যা',
    slug: 'vitamin-d-deficiency-bangladesh',
    category: 'Nutrition',
    excerpt: 'Despite abundant sunlight, vitamin D deficiency is surprisingly common in Bangladesh. Learn about symptoms, testing, and treatment.',
    excerptBn: 'প্রচুর সূর্যালোক থাকা সত্ত্বেও বাংলাদেশে ভিটামিন ডি-এর ঘাটতি অবাক করার মতো সাধারণ।',
    content: `<h2>The Sunshine Vitamin</h2>
<p>Vitamin D is essential for bone health, immune function, and overall wellbeing. Despite Bangladesh receiving plenty of sunlight, studies show that 40-80% of Bangladeshis have insufficient vitamin D levels.</p>
<h3>Why is Deficiency So Common?</h3>
<ul>
<li>Indoor lifestyle and office work</li>
<li>Dark skin requires more sun exposure</li>
<li>Air pollution blocks UV rays</li>
<li>Clothing covering most skin</li>
<li>Diet low in vitamin D rich foods</li>
</ul>
<h3>Symptoms of Deficiency</h3>
<ul>
<li>Bone pain and weakness</li>
<li>Muscle cramps</li>
<li>Fatigue and tiredness</li>
<li>Mood changes / depression</li>
<li>Frequent infections</li>
<li>Hair loss</li>
</ul>
<h3>Treatment</h3>
<ul>
<li><strong>Mild deficiency:</strong> D-Rise 2000IU daily or 40000IU weekly</li>
<li><strong>Moderate deficiency:</strong> D-Rise 40000IU twice weekly for 8 weeks</li>
<li><strong>Severe deficiency:</strong> Higher doses as prescribed by doctor</li>
<li><strong>Maintenance:</strong> 1000-2000IU daily after correction</li>
</ul>
<h3>Food Sources</h3>
<ul>
<li>Fatty fish (hilsa, salmon)</li>
<li>Egg yolks</li>
<li>Fortified milk</li>
<li>Mushrooms</li>
</ul>
<p><strong>Tip:</strong> Get 15-20 minutes of morning sunlight (before 10 AM) on your face and arms daily.</p>`,
    author: 'Dr. Medicine Bazar',
    tags: ['vitamin D', 'nutrition', 'bone health', 'deficiency'],
    featured: false,
    published: true,
    active: true,
    views: 178,
    publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Antibiotic Resistance: Why You Should Never Self-Medicate',
    titleBn: 'অ্যান্টিবায়োটিক রেজিস্ট্যান্স: কেন নিজে নিজে ওষুধ খাবেন না',
    slug: 'antibiotic-resistance-self-medication',
    category: 'Awareness',
    excerpt: 'Antibiotic resistance is a global health crisis. Learn why completing the full course and avoiding self-medication is critical.',
    excerptBn: 'অ্যান্টিবায়োটিক রেজিস্ট্যান্স একটি বৈশ্বিক স্বাস্থ্য সংকট। সম্পূর্ণ কোর্স শেষ করা এবং স্ব-ওষুধ এড়ানো কেন গুরুত্বপূর্ণ তা জানুন।',
    content: `<h2>The Silent Pandemic</h2>
<p>Antibiotic resistance occurs when bacteria change in response to the use of antibiotics, making them harder to treat. Bangladesh is particularly vulnerable due to widespread over-the-counter antibiotic sales.</p>
<h3>Common Mistakes</h3>
<ol>
<li>Taking antibiotics for viral infections (cold, flu)</li>
<li>Not completing the full prescribed course</li>
<li>Using leftover antibiotics from previous illness</li>
<li>Sharing antibiotics with others</li>
<li>Demanding antibiotics from doctors when not needed</li>
</ol>
<h3>What You Can Do</h3>
<ul>
<li>Only take antibiotics when prescribed by a qualified doctor</li>
<li>Complete the full course even if you feel better</li>
<li>Never share or use someone else's antibiotics</li>
<li>Practice good hygiene to prevent infections</li>
<li>Get vaccinated as recommended</li>
</ul>
<p><strong>Remember:</strong> Antibiotics don't work against viruses. A cold or flu will not get better with antibiotics.</p>`,
    author: 'Dr. Medicine Bazar',
    tags: ['antibiotics', 'resistance', 'awareness', 'public health'],
    featured: false,
    published: true,
    active: true,
    views: 134,
    publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Pregnancy Care: Essential Supplements and Checkups',
    titleBn: 'গর্ভকালীন যত্ন: প্রয়োজনীয় সাপ্লিমেন্ট ও চেকআপ',
    slug: 'pregnancy-care-supplements-checkups',
    category: "Women's Health",
    excerpt: 'Proper nutrition and regular checkups during pregnancy are crucial for both mother and baby. Learn about essential supplements and when to visit your doctor.',
    excerptBn: 'গর্ভাবস্থায় সঠিক পুষ্টি এবং নিয়মিত চেকআপ মা ও শিশু উভয়ের জন্য অত্যন্ত গুরুত্বপূর্ণ।',
    content: `<h2>Pregnancy Nutrition Guide</h2>
<h3>Essential Supplements</h3>
<ol>
<li><strong>Folic Acid:</strong> Start before conception and continue through first trimester. Prevents neural tube defects.</li>
<li><strong>Iron + Folic Acid (Ferogen):</strong> Prevents anemia. Take throughout pregnancy.</li>
<li><strong>Calcium + Vitamin D (Ostobon D):</strong> For baby's bone development. Take from second trimester.</li>
<li><strong>DHA/Omega-3:</strong> For baby's brain development.</li>
</ol>
<h3>Important Checkups</h3>
<ul>
<li>First trimester: Blood tests, ultrasound, blood pressure</li>
<li>Second trimester: Anomaly scan (18-22 weeks), glucose tolerance test</li>
<li>Third trimester: Growth scan, non-stress test, blood pressure monitoring</li>
</ul>
<h3>Warning Signs</h3>
<ul>
<li>Severe headache or vision changes</li>
<li>Heavy bleeding</li>
<li>Severe abdominal pain</li>
<li>Reduced baby movement</li>
<li>High fever</li>
</ul>
<p><strong>Important:</strong> Always consult your OB-GYN before taking any medication during pregnancy.</p>`,
    author: 'Dr. Medicine Bazar',
    tags: ['pregnancy', 'women health', 'supplements', 'prenatal'],
    featured: true,
    published: true,
    active: true,
    views: 223,
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Monsoon Health: Staying Safe During Rainy Season',
    titleBn: 'বর্ষায় স্বাস্থ্য: বৃষ্টির মৌসুমে সুস্থ থাকুন',
    slug: 'monsoon-health-rainy-season',
    category: 'Seasonal Health',
    excerpt: 'The monsoon season brings relief from heat but also increases the risk of waterborne diseases, dengue, and skin infections.',
    excerptBn: 'বর্ষা মৌসুম গরম থেকে স্বস্তি দেয় কিন্তু পানিবাহিত রোগ, ডেঙ্গু এবং ত্বকের সংক্রমণের ঝুঁকিও বাড়ায়।',
    content: `<h2>Common Monsoon Illnesses</h2>
<h3>1. Dengue Fever</h3>
<ul>
<li>Spread by Aedes mosquito</li>
<li>Symptoms: High fever, severe headache, body pain, rash</li>
<li>Treatment: Paracetamol only (NO aspirin or ibuprofen), plenty of fluids</li>
<li>Prevention: Use mosquito nets, remove stagnant water</li>
</ul>
<h3>2. Diarrhea & Typhoid</h3>
<ul>
<li>Caused by contaminated water and food</li>
<li>Always drink boiled or filtered water</li>
<li>Use ORS for dehydration</li>
</ul>
<h3>3. Skin Infections</h3>
<ul>
<li>Fungal infections are common in humid weather</li>
<li>Keep skin dry, use antifungal powder</li>
<li>Change wet clothes immediately</li>
</ul>
<h3>Monsoon Medicine Kit</h3>
<ul>
<li>ORS sachets</li>
<li>Paracetamol</li>
<li>Antihistamines</li>
<li>Antifungal cream</li>
<li>Mosquito repellent</li>
<li>Water purification tablets</li>
</ul>`,
    author: 'Medicine Bazar Team',
    tags: ['monsoon', 'dengue', 'rainy season', 'waterborne diseases'],
    featured: false,
    published: true,
    active: true,
    views: 167,
    publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const labTests = [
  { name: 'Complete Blood Count (CBC)', nameBn: 'কমপ্লিট ব্লাড কাউন্ট (সিবিসি)', description: 'Measures red blood cells, white blood cells, hemoglobin, and platelets. Essential for diagnosing infections, anemia, and other conditions.', descriptionBn: 'লোহিত রক্তকণিকা, শ্বেত রক্তকণিকা, হিমোগ্লোবিন এবং প্লেটলেট পরিমাপ করে।', category: 'Hematology', price: 350, sampleType: 'Blood', preparationRequired: false, preparation: 'No fasting required', turnaroundTime: 'Same day', active: true },
  { name: 'Blood Sugar (Fasting)', nameBn: 'ব্লাড সুগার (ফাস্টিং)', description: 'Measures blood glucose after 8-12 hours of fasting. Used to diagnose diabetes and pre-diabetes.', descriptionBn: '৮-১২ ঘণ্টা উপবাসের পর রক্তের গ্লুকোজ পরিমাপ করে। ডায়াবেটিস নির্ণয়ে ব্যবহৃত হয়।', category: 'Biochemistry', price: 200, sampleType: 'Blood', preparationRequired: true, preparation: 'Fast for 8-12 hours before test', turnaroundTime: 'Same day', active: true },
  { name: 'Blood Sugar (2 Hours ABF)', nameBn: 'ব্লাড সুগার (২ ঘণ্টা এবিএফ)', description: 'Measures blood glucose 2 hours after a meal. Helps assess how well your body processes sugar.', descriptionBn: 'খাবারের ২ ঘণ্টা পর রক্তের গ্লুকোজ পরিমাপ করে।', category: 'Biochemistry', price: 200, sampleType: 'Blood', preparationRequired: true, preparation: 'Eat normal meal, then wait exactly 2 hours', turnaroundTime: 'Same day', active: true },
  { name: 'HbA1c (Glycated Hemoglobin)', nameBn: 'এইচবিএওয়ানসি', description: 'Shows average blood sugar control over the past 2-3 months. Gold standard for diabetes monitoring.', descriptionBn: 'গত ২-৩ মাসের গড় রক্তের শর্করা নিয়ন্ত্রণ দেখায়। ডায়াবেটিস পর্যবেক্ষণের সেরা পরীক্ষা।', category: 'Biochemistry', price: 800, sampleType: 'Blood', preparationRequired: false, preparation: 'No fasting required', turnaroundTime: '1 day', active: true },
  { name: 'Lipid Profile', nameBn: 'লিপিড প্রোফাইল', description: 'Measures total cholesterol, LDL, HDL, and triglycerides. Important for assessing heart disease risk.', descriptionBn: 'মোট কোলেস্টেরল, LDL, HDL এবং ট্রাইগ্লিসারাইড পরিমাপ করে। হৃদরোগের ঝুঁকি মূল্যায়নে গুরুত্বপূর্ণ।', category: 'Biochemistry', price: 800, sampleType: 'Blood', preparationRequired: true, preparation: 'Fast for 12 hours before test', turnaroundTime: '1 day', active: true },
  { name: 'Thyroid Function Test (TFT)', nameBn: 'থাইরয়েড ফাংশন টেস্ট', description: 'Measures TSH, T3, and T4 levels. Detects hypothyroidism and hyperthyroidism.', descriptionBn: 'TSH, T3, এবং T4 মাত্রা পরিমাপ করে। হাইপোথাইরয়েডিজম এবং হাইপারথাইরয়েডিজম সনাক্ত করে।', category: 'Endocrinology', price: 1200, sampleType: 'Blood', preparationRequired: false, preparation: 'No fasting required, take medicine after sample', turnaroundTime: '1 day', active: true },
  { name: 'Liver Function Test (LFT)', nameBn: 'লিভার ফাংশন টেস্ট', description: 'Measures enzymes and proteins to assess liver health. Includes SGPT, SGOT, bilirubin, albumin.', descriptionBn: 'লিভারের স্বাস্থ্য মূল্যায়নের জন্য এনজাইম এবং প্রোটিন পরিমাপ করে।', category: 'Biochemistry', price: 1000, sampleType: 'Blood', preparationRequired: false, preparation: 'No special preparation needed', turnaroundTime: '1 day', active: true },
  { name: 'Kidney Function Test (KFT)', nameBn: 'কিডনি ফাংশন টেস্ট', description: 'Measures creatinine, BUN, uric acid, and electrolytes to assess kidney health.', descriptionBn: 'কিডনির স্বাস্থ্য মূল্যায়নের জন্য ক্রিয়েটিনিন, BUN, ইউরিক অ্যাসিড পরিমাপ করে।', category: 'Biochemistry', price: 900, sampleType: 'Blood', preparationRequired: false, preparation: 'No special preparation needed', turnaroundTime: '1 day', active: true },
  { name: 'Urine Routine & Microscopy (R/M/E)', nameBn: 'ইউরিন রুটিন ও মাইক্রোস্কোপি', description: 'Examines urine for infections, kidney problems, and diabetes indicators.', descriptionBn: 'সংক্রমণ, কিডনি সমস্যা এবং ডায়াবেটিস নির্দেশকের জন্য প্রস্রাব পরীক্ষা করে।', category: 'Pathology', price: 250, sampleType: 'Urine', preparationRequired: false, preparation: 'Midstream clean-catch urine sample', turnaroundTime: 'Same day', active: true },
  { name: 'Dengue NS1 Antigen', nameBn: 'ডেঙ্গু NS1 অ্যান্টিজেন', description: 'Detects dengue virus in early stages of infection (first 5 days of fever).', descriptionBn: 'সংক্রমণের প্রাথমিক পর্যায়ে (জ্বরের প্রথম ৫ দিন) ডেঙ্গু ভাইরাস সনাক্ত করে।', category: 'Serology', price: 600, sampleType: 'Blood', preparationRequired: false, preparation: 'No fasting required', turnaroundTime: 'Same day', active: true },
  { name: 'Vitamin D (25-OH)', nameBn: 'ভিটামিন ডি', description: 'Measures vitamin D level in blood. Deficiency is very common in Bangladesh.', descriptionBn: 'রক্তে ভিটামিন ডি-এর মাত্রা পরিমাপ করে। বাংলাদেশে ঘাটতি খুবই সাধারণ।', category: 'Biochemistry', price: 1500, sampleType: 'Blood', preparationRequired: false, preparation: 'No fasting required', turnaroundTime: '2 days', active: true },
  { name: 'Vitamin B12', nameBn: 'ভিটামিন বি১২', description: 'Measures vitamin B12 level. Deficiency can cause anemia, nerve problems, and fatigue.', descriptionBn: 'ভিটামিন বি১২ মাত্রা পরিমাপ করে। ঘাটতিতে রক্তস্বল্পতা, স্নায়ু সমস্যা হতে পারে।', category: 'Biochemistry', price: 1200, sampleType: 'Blood', preparationRequired: false, preparation: 'No fasting required', turnaroundTime: '2 days', active: true },
  { name: 'Serum Iron & TIBC', nameBn: 'সিরাম আয়রন ও টিআইবিসি', description: 'Evaluates iron levels and iron-binding capacity. Helps diagnose iron deficiency anemia.', descriptionBn: 'আয়রনের মাত্রা এবং আয়রন-বাইন্ডিং ক্ষমতা মূল্যায়ন করে।', category: 'Biochemistry', price: 800, sampleType: 'Blood', preparationRequired: true, preparation: 'Fast for 8 hours, morning sample preferred', turnaroundTime: '1 day', active: true },
  { name: 'Blood Group & Rh Factor', nameBn: 'ব্লাড গ্রুপ ও আরএইচ ফ্যাক্টর', description: 'Determines ABO blood group and Rh factor. Essential before surgery or blood transfusion.', descriptionBn: 'ABO ব্লাড গ্রুপ এবং Rh ফ্যাক্টর নির্ধারণ করে। অপারেশন বা রক্ত সঞ্চালনের আগে অপরিহার্য।', category: 'Hematology', price: 200, sampleType: 'Blood', preparationRequired: false, preparation: 'No preparation needed', turnaroundTime: 'Same day', active: true },
  { name: 'Hepatitis B Surface Antigen (HBsAg)', nameBn: 'হেপাটাইটিস বি সারফেস অ্যান্টিজেন', description: 'Screens for hepatitis B virus infection.', descriptionBn: 'হেপাটাইটিস বি ভাইরাস সংক্রমণের জন্য স্ক্রিনিং।', category: 'Serology', price: 400, sampleType: 'Blood', preparationRequired: false, preparation: 'No fasting required', turnaroundTime: 'Same day', active: true },
  { name: 'ESR (Erythrocyte Sedimentation Rate)', nameBn: 'ইএসআর', description: 'Non-specific marker of inflammation. Elevated in infections, autoimmune diseases, and cancers.', descriptionBn: 'প্রদাহের অ-নির্দিষ্ট চিহ্নিতকারী। সংক্রমণ, অটোইমিউন রোগে বৃদ্ধি পায়।', category: 'Hematology', price: 200, sampleType: 'Blood', preparationRequired: false, preparation: 'No fasting required', turnaroundTime: 'Same day', active: true },
  { name: 'Chest X-Ray', nameBn: 'বুকের এক্স-রে', description: 'Imaging of lungs and chest area. Used to diagnose pneumonia, TB, and other lung conditions.', descriptionBn: 'ফুসফুস এবং বুকের এলাকার ইমেজিং। নিউমোনিয়া, টিবি নির্ণয়ে ব্যবহৃত।', category: 'Radiology', price: 500, sampleType: 'Imaging', preparationRequired: false, preparation: 'Remove metal jewelry, wear hospital gown', turnaroundTime: 'Same day', active: true },
  { name: 'ECG (Electrocardiogram)', nameBn: 'ইসিজি', description: 'Records heart\'s electrical activity. Detects heart rhythm problems, heart attacks, and other conditions.', descriptionBn: 'হৃদপিণ্ডের বৈদ্যুতিক কার্যকলাপ রেকর্ড করে। হৃদপিণ্ডের ছন্দ সমস্যা সনাক্ত করে।', category: 'Cardiology', price: 400, sampleType: 'Non-invasive', preparationRequired: false, preparation: 'Wear comfortable clothes, relax before test', turnaroundTime: 'Immediate', active: true },
  { name: 'Ultrasound (Whole Abdomen)', nameBn: 'আল্ট্রাসাউন্ড (পুরো পেট)', description: 'Non-invasive imaging of abdominal organs including liver, kidneys, gallbladder, and bladder.', descriptionBn: 'লিভার, কিডনি, পিত্তথলি সহ পেটের অঙ্গগুলির অ-আক্রমণাত্মক ইমেজিং।', category: 'Radiology', price: 1200, sampleType: 'Imaging', preparationRequired: true, preparation: 'Fast for 6-8 hours, drink 4-6 glasses of water 1 hour before', turnaroundTime: 'Same day', active: true },
  { name: 'Pregnancy Test (Beta HCG)', nameBn: 'প্রেগনেন্সি টেস্ট (বেটা এইচসিজি)', description: 'Blood test to confirm pregnancy and measure HCG hormone levels.', descriptionBn: 'গর্ভাবস্থা নিশ্চিত করতে এবং HCG হরমোনের মাত্রা পরিমাপ করতে রক্ত পরীক্ষা।', category: 'Endocrinology', price: 600, sampleType: 'Blood', preparationRequired: false, preparation: 'No fasting required', turnaroundTime: 'Same day', active: true },
];

function seedContent() {
  console.log('Seeding blog posts and lab tests...\n');

  // Seed blog posts
  const blogStore = DataService.get('blogs');
  const existingBlogs = blogStore.findAll({});
  let blogsAdded = 0;

  for (const post of blogPosts) {
    const isDup = existingBlogs.some(b => b.slug === post.slug);
    if (isDup) continue;
    blogStore.create(post);
    blogsAdded++;
  }
  console.log(`Blog posts: added ${blogsAdded}, skipped ${blogPosts.length - blogsAdded} duplicates`);
  console.log(`Total blog posts: ${blogStore.count()}`);

  // Seed lab tests
  const labStore = DataService.get('labTests');
  const existingLabs = labStore.findAll({});
  let labsAdded = 0;

  for (const test of labTests) {
    const isDup = existingLabs.some(l => l.name === test.name);
    if (isDup) continue;
    labStore.create(test);
    labsAdded++;
  }
  console.log(`Lab tests: added ${labsAdded}, skipped ${labTests.length - labsAdded} duplicates`);
  console.log(`Total lab tests: ${labStore.count()}`);

  console.log('\nContent seeding complete!');
}

seedContent();
