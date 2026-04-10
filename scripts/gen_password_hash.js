#!/usr/bin/env node
/**
 * gen_password_hash.js
 *
 * Generates bcrypt hashes for the GUTMANN test users.
 * The backend (AuthController.js) uses bcryptjs with salt rounds = 12.
 *
 * Usage (local or GitHub Codespaces terminal):
 *   cd <repo-root>
 *   node scripts/gen_password_hash.js
 *
 * To hash a single custom password instead:
 *   node scripts/gen_password_hash.js "MySecret@99"
 *
 * Requirements:
 *   bcryptjs must be installed.  If running outside the backend folder run:
 *     npm install bcryptjs
 *   Or, from the backend folder the package is already listed as a dependency:
 *     cd backend && npm install
 *     node ../scripts/gen_password_hash.js
 */

'use strict';

// Allow the script to be run from repo root (bcryptjs is in backend/node_modules)
// or from backend/ directory.
let bcrypt;
const path = require('path');
// Try loading bcryptjs from several locations so the script works whether run
// from the repo root, from scripts/, or from backend/.
const candidates = [
  'bcryptjs',
  path.join(__dirname, '..', 'backend', 'node_modules', 'bcryptjs'),
  path.join(__dirname, 'node_modules', 'bcryptjs'),
];
for (const candidate of candidates) {
  try {
    bcrypt = require(candidate);
    break;
  } catch { /* try next */ }
}
if (!bcrypt) {
  console.error(
    'ERROR: bcryptjs not found.\n' +
    'Install it with:\n' +
    '  cd backend && npm install\n' +
    'Then re-run from the repo root:\n' +
    '  node scripts/gen_password_hash.js'
  );
  process.exit(1);
}

const SALT_ROUNDS = 12; // must match backend/src/controllers/AuthController.js

/** Default test users — kept in sync with database/seeds/test_users.sql */
const TEST_USERS = [
  { email: 'ceo@gutmann.com',        password: 'Admin@12345', role: 'ceo'         },
  { email: 'sales@gutmann.com',       password: 'Sales@12345', role: 'salesperson' },
  { email: 'qc@gutmann.com',          password: 'Qc@12345',    role: 'qc'          },
  { email: 'technical@gutmann.com',   password: 'Tech@12345',  role: 'technical'   },
  { email: 'estimation@gutmann.com',  password: 'Est@12345',   role: 'estimation'  },
];

async function hashSingle(plain) {
  const hash = await bcrypt.hash(plain, SALT_ROUNDS);
  console.log(`\nbcrypt hash (salt rounds = ${SALT_ROUNDS}):`);
  console.log(hash);
  console.log(`\nCopy the hash value above into your Supabase SQL INSERT statement.`);
}

async function hashAll() {
  console.log(`Generating bcrypt hashes (salt rounds = ${SALT_ROUNDS}) …\n`);

  // Generate all hashes once and cache them.
  const hashes = {};
  for (const u of TEST_USERS) {
    hashes[u.email] = await bcrypt.hash(u.password, SALT_ROUNDS);
  }

  console.log('Email                      | Role         | bcrypt hash');
  console.log('---------------------------|--------------|-------------');
  for (const u of TEST_USERS) {
    console.log(`${u.email.padEnd(27)}| ${u.role.padEnd(13)}| ${hashes[u.email]}`);
  }
  console.log('\n(See TEST_USERS constant in this script for the plain-text passwords.)\n');
  console.log('--- SQL snippet (paste into Supabase SQL Editor) ---\n');

  console.log('CREATE EXTENSION IF NOT EXISTS pgcrypto;\n');
  for (const u of TEST_USERS) {
    console.log(
      `INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)\n` +
      `SELECT gen_random_uuid(), '${u.email}', '${hashes[u.email]}',\n` +
      `       '${u.email.split('@')[0]}', '${u.role}', true, now(), now()\n` +
      `WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = '${u.email}');\n`
    );
  }
}

(async () => {
  const arg = process.argv[2];
  if (arg) {
    await hashSingle(arg);
  } else {
    await hashAll();
  }
})();
