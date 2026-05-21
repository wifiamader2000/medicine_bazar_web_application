const path = require('path');
const bcrypt = require('bcryptjs');
const DataService = require('../backend/services/DataService');

const PASSWORDS = {
  'admin@medicinebazar.com': process.env.ADMIN_PASSWORD,
  'cashier@medicinebazar.com': process.env.CASHIER_PASSWORD,
  'pharmacist@medicinebazar.com': process.env.PHARMACIST_PASSWORD,
  'manager@medicinebazar.com': process.env.MANAGER_PASSWORD,
};

async function rotate() {
  const missing = Object.entries(PASSWORDS).filter(([, password]) => !password).map(([email]) => email);
  if (missing.length > 0) {
    throw new Error(`Missing password environment variables for: ${missing.join(', ')}`);
  }

  console.log('Rotating credentials for production soft-launch...\n');
  const userStore = DataService.get('users');
  
  for (const [email, plainTextPassword] of Object.entries(PASSWORDS)) {
    const user = userStore.findOne({ email });
    if (user) {
      const hashedPassword = await bcrypt.hash(plainTextPassword, 12);
      userStore.update(user.id, {
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      });
      console.log(`[ROTATED] ${email} successfully updated.`);
    } else {
      console.log(`[WARNING] User ${email} not found, skipping.`);
    }
  }
  
  console.log('\nCredential rotation complete. Secure credentials stored successfully.');
}

rotate().catch(console.error);
