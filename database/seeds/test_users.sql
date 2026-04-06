-- Test Users for GUTMANN System
-- Passwords are bcrypt-hashed (bcryptjs, salt rounds = 12) to match the backend.
-- See backend/src/controllers/AuthController.js for hashing details.
-- Run this after the schema migrations (001_initial_schema.sql).
--
-- Plain-text passwords (for your reference — do NOT store these in the DB):
--   ceo@gutmann.com         → Admin@123
--   sales1@gutmann.com      → Sales@123
--   sales2@gutmann.com      → Sales@123
--   qc@gutmann.com          → QC@1234
--   technical@gutmann.com   → Tech@123
--   estimation@gutmann.com  → Est@1234
--   client1@example.com     → Client@12
--   client2@example.com     → Client@12
--
-- To regenerate these hashes (e.g., for custom passwords), run:
--   node scripts/gen_password_hash.js
-- from the repository root (requires: cd backend && npm install first).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT '11111111-1111-1111-1111-111111111111',
       'ceo@gutmann.com',
       '$2a$12$MMQYNZ0PvffLBX65iRwqdeXSz3v7hfRBGo0J7MABrs7DJ2iRTNSRi',
       'Ahmad Al-Rashid', 'ceo', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'ceo@gutmann.com');

INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT '22222222-2222-2222-2222-222222222222',
       'sales1@gutmann.com',
       '$2a$12$3G2ts9fH5.q2URCNVT/EaOacjGBme0uzGTXZpkBcTNdi7seKmb7TO',
       'Sara Malik', 'salesperson', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'sales1@gutmann.com');

INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT '33333333-3333-3333-3333-333333333333',
       'sales2@gutmann.com',
       '$2a$12$F7/F3i1PRMhlfeAIKDL7BOucrtMxGecs76etfAU9G2kVVgBxl0Ply',
       'Omar Farooq', 'salesperson', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'sales2@gutmann.com');

INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT '44444444-4444-4444-4444-444444444444',
       'qc@gutmann.com',
       '$2a$12$O5xjNev7LZsAwjTJ5nBaeu4Wtn2ASdz3Jsqe2HwZQOb2QF7lQNEki',
       'Fatima Zahra', 'qc', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'qc@gutmann.com');

INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT '55555555-5555-5555-5555-555555555555',
       'technical@gutmann.com',
       '$2a$12$tbCZB7YK3md3cj4bFpD6N.LGXp2oURpGk5T/ytS0oppCGUNXy5WtW',
       'Khalid Ibrahim', 'technical', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'technical@gutmann.com');

INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT '66666666-6666-6666-6666-666666666666',
       'estimation@gutmann.com',
       '$2a$12$7.z2CbS6TdZfbPGyKlW6NOG.f8LUQuzsyE4h23NCixn8osroHrtrG',
       'Nadia Hassan', 'estimation', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'estimation@gutmann.com');

INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT '77777777-7777-7777-7777-777777777777',
       'client1@example.com',
       '$2a$12$1pHuGSWUlV7fysIhD0c.zOLF5rTuVumP2SurIsWZ0OTQyVoMLvxnS',
       'John Smith', 'client', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'client1@example.com');

INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT '88888888-8888-8888-8888-888888888888',
       'client2@example.com',
       '$2a$12$AFuCpIhGblfuyOJ3htB.meB9BcCPjDQdhHmgYOQ731H2rHMelatee',
       'Emily Johnson', 'client', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'client2@example.com');

-- Verify inserted rows
SELECT email, name, role, is_active, created_at
FROM public.users
WHERE email IN (
  'ceo@gutmann.com',
  'sales1@gutmann.com',
  'sales2@gutmann.com',
  'qc@gutmann.com',
  'technical@gutmann.com',
  'estimation@gutmann.com',
  'client1@example.com',
  'client2@example.com'
)
ORDER BY role, email;
