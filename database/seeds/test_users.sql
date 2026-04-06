-- Test Users for GUTMANN System
-- Passwords are bcrypt hashes (salt rounds: 12) of 'Test@1234'
-- Generated via: node scripts/generate_bcrypt_hash.js
-- Run this after the schema migrations (001_initial_schema.sql)

INSERT INTO users (id, email, password_hash, name, role, is_active, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ceo@gutmann.com',        '$2a$12$sWjTioXBjoNBCKoihtRX8e3OI3zmCQViwvAMSUnVj.LK3y7EtBp9e', 'Ahmad Al-Rashid',  'ceo',         true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'sales1@gutmann.com',     '$2a$12$aELGzeI2b4DsT.IsjIWSIO85vLfL2ZRvqLsJz718DPPSVnMFf.Omy', 'Sara Malik',       'salesperson', true, NOW()),
  ('33333333-3333-3333-3333-333333333333', 'sales2@gutmann.com',     '$2a$12$nE70Z3kYVNaJNVXqHbLdzuruIpLP4T5C/v/mGQ2DHSPZubNdEcDMK', 'Omar Farooq',      'salesperson', true, NOW()),
  ('44444444-4444-4444-4444-444444444444', 'qc@gutmann.com',         '$2a$12$ZbJmhcHzljyYF12WZHEcou1WYa7RW9qXSe02oaDFWw.Da7KEX23US', 'Fatima Zahra',     'qc',          true, NOW()),
  ('55555555-5555-5555-5555-555555555555', 'technical@gutmann.com',  '$2a$12$rs5ukwTegIQDQxJSNp8eHOwnCW1vrkZmE/7757kTUYPlKTkc6gm6m', 'Khalid Ibrahim',   'technical',   true, NOW()),
  ('66666666-6666-6666-6666-666666666666', 'estimation@gutmann.com', '$2a$12$1GjJK78ZtPHr7BM0tXvNrOPglNazlye3/jJPM6mSfI01eodVqKn.6', 'Nadia Hassan',     'estimation',  true, NOW()),
  ('77777777-7777-7777-7777-777777777777', 'client1@example.com',    '$2a$12$bLW7N7ROiTDYExuCw6mEFOZocBKFeKgsKlVWbw2R1lLYxMfcGcPIK', 'John Smith',       'client',      true, NOW()),
  ('88888888-8888-8888-8888-888888888888', 'client2@example.com',    '$2a$12$BGD59T9zCo8MGXjLmwfSiurZseevmf7bCh6qjjlyASJrRfBzZwv0i', 'Emily Johnson',    'client',      true, NOW())
ON CONFLICT (id) DO NOTHING;
