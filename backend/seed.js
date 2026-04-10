require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('./src/config/supabase');

const seedUsers = [
  { email: 'ceo@gutmann.com', password: 'Admin@123', name: 'CEO User', role: 'ceo' },
  { email: 'sales@gutmann.com', password: 'Sales@123', name: 'Sales Person', role: 'salesperson' },
  { email: 'qc@gutmann.com', password: 'QC@1234', name: 'QC Reviewer', role: 'qc' },
  { email: 'technical@gutmann.com', password: 'Tech@123', name: 'Technical Reviewer', role: 'technical' },
  { email: 'estimation@gutmann.com', password: 'Est@1234', name: 'Estimator', role: 'estimation' }
];

async function seed() {
  console.log('Seeding database...');
  for (const user of seedUsers) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const { error } = await supabaseAdmin
      .from('users')
      .upsert(
        { email: user.email, password_hash: passwordHash, name: user.name, role: user.role, is_active: true },
        { onConflict: 'email' }
      );
    if (error) {
      console.error(`Failed to seed user ${user.email}:`, error.message);
    } else {
      console.log(`✅ Seeded user: ${user.email} (${user.role})`);
    }
  }
  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
