require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('./src/config/supabase');

// Canonical test users — must stay in sync with database/seeds/test_users.sql
const seedUsers = [
  { email: 'ceo@gutmann.com',        password: 'Admin@12345', name: 'Ahmad Al-Rashid', role: 'ceo'         },
  { email: 'sales@gutmann.com',       password: 'Sales@12345', name: 'Sara Malik',      role: 'salesperson' },
  { email: 'qc@gutmann.com',          password: 'Qc@12345',    name: 'Fatima Zahra',    role: 'qc'          },
  { email: 'technical@gutmann.com',   password: 'Tech@12345',  name: 'Khalid Ibrahim',  role: 'technical'   },
  { email: 'estimation@gutmann.com',  password: 'Est@12345',   name: 'Nadia Hassan',    role: 'estimation'  },
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
