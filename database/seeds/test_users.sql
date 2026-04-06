-- Test Users for GUTMANN System
-- Passwords are hashed versions of 'Test@1234' using bcrypt
-- Run this after the schema migrations

INSERT INTO users (id, email, name, role, is_active, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ceo@gutmann.com',         'Ahmad Al-Rashid',   'ceo',         true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'sales1@gutmann.com',      'Sara Malik',        'salesperson', true, NOW()),
  ('33333333-3333-3333-3333-333333333333', 'sales2@gutmann.com',      'Omar Farooq',       'salesperson', true, NOW()),
  ('44444444-4444-4444-4444-444444444444', 'qc@gutmann.com',          'Fatima Zahra',      'qc',          true, NOW()),
  ('55555555-5555-5555-5555-555555555555', 'technical@gutmann.com',   'Khalid Ibrahim',    'technical',   true, NOW()),
  ('66666666-6666-6666-6666-666666666666', 'estimation@gutmann.com',  'Nadia Hassan',      'estimation',  true, NOW()),
  ('77777777-7777-7777-7777-777777777777', 'client1@example.com',     'John Smith',        'client',      true, NOW()),
  ('88888888-8888-8888-8888-888888888888', 'client2@example.com',     'Emily Johnson',     'client',      true, NOW())
ON CONFLICT (id) DO NOTHING;
