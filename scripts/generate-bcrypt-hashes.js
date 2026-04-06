#!/usr/bin/env node
/**
 * generate-bcrypt-hashes.js
 *
 * Helper script to generate bcrypt password hashes (12 rounds) that match
 * what the Gutmann backend stores in public.users.password_hash.
 *
 * Usage (from repo root):
 *   node scripts/generate-bcrypt-hashes.js
 *
 * Or with custom passwords:
 *   node scripts/generate-bcrypt-hashes.js MyPass@1 AnotherPass@2
 *
 * Requires: bcryptjs (installed in backend/)
 *   Run `npm ci` inside the backend/ directory first.
 */

'use strict';

const path = require('path');
// bcryptjs lives in backend/node_modules
const bcrypt = require(path.join(__dirname, '..', 'backend', 'node_modules', 'bcryptjs'));

const SALT_ROUNDS = 12; // must match AuthController.js

const DEFAULT_PASSWORDS = [
  { label: 'ceo',         plain: 'Admin@12345' },
  { label: 'salesperson', plain: 'Sales@12345' },
  { label: 'qc',          plain: 'Qc@12345' },
  { label: 'technical',   plain: 'Tech@12345' },
  { label: 'estimation',  plain: 'Est@12345' },
];

async function main() {
  const args = process.argv.slice(2);
  const entries = args.length
    ? args.map((p, i) => ({ label: `arg[${i}]`, plain: p }))
    : DEFAULT_PASSWORDS;

  console.log(`Generating bcrypt hashes with ${SALT_ROUNDS} rounds...\n`);

  for (const entry of entries) {
    const hash = await bcrypt.hash(entry.plain, SALT_ROUNDS);
    console.log(`Label : ${entry.label}`);
    console.log(`Hash  : ${hash}`);
    console.log('');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
