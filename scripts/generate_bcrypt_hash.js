#!/usr/bin/env node
/**
 * generate_bcrypt_hash.js
 *
 * Generates a bcrypt hash (salt rounds: 12) for a given password.
 * Use this to produce the password_hash values required when inserting
 * users directly into the Supabase SQL Editor.
 *
 * Usage (from repo root):
 *   node scripts/generate_bcrypt_hash.js <password>
 *
 * Example:
 *   node scripts/generate_bcrypt_hash.js Test@1234
 *
 * Requirements:
 *   bcryptjs must be installed — run `npm install` inside the backend/ directory first.
 */

'use strict';

const path = require('path');

// bcryptjs lives in backend/node_modules; resolve it from there so this
// script can be called from the repo root without a separate install step.
const bcrypt = require(require.resolve('bcryptjs', {
  paths: [path.join(__dirname, '..', 'backend')],
}));

const SALT_ROUNDS = 12;

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: node scripts/generate_bcrypt_hash.js <password>');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  console.log(hash);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
