-- =====================================================
-- GUTMANN — Create All Role Users
-- =====================================================
-- Run this script in the Supabase SQL Editor to create
-- one user for every application role.
--
-- Password legend (plain-text → bcrypt hash, 12 rounds):
--   ceo@gutmann.com          Admin@123   (CEO)
--   sales@gutmann.com        Sales@123   (Salesperson)
--   qc@gutmann.com           QC@1234     (QC)
--   technical@gutmann.com    Tech@123    (Technical)
--   estimation@gutmann.com   Est@1234    (Estimation)
--   client@gutmann.com       Client@12   (Client)
--
-- Regenerate hashes any time with:
--   node scripts/gen_password_hash.js
--
-- All INSERT statements are idempotent: they skip any
-- email that already exists in the table.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------
-- 1. CEO
-- -------------------------------------------------------
INSERT INTO public.users
    (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'ceo@gutmann.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgRdX3MiTHMpj5V3ZQoNJu',
    'CEO User',
    'ceo',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'ceo@gutmann.com'
);

-- -------------------------------------------------------
-- 2. Salesperson
-- -------------------------------------------------------
INSERT INTO public.users
    (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'sales@gutmann.com',
    '$2a$12$6bFwE.s1zkitvjm2jeasguToA.9uXDKYU74oy4vlMZGoqzhExkhda',
    'Sales Person',
    'salesperson',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'sales@gutmann.com'
);

-- -------------------------------------------------------
-- 3. QC
-- -------------------------------------------------------
INSERT INTO public.users
    (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'qc@gutmann.com',
    '$2a$12$OlI/v/f1pguac6mdY9/Kku6cmtlA0/YF1MOLt73vz9pEjIShUisz6',
    'QC Reviewer',
    'qc',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'qc@gutmann.com'
);

-- -------------------------------------------------------
-- 4. Technical
-- -------------------------------------------------------
INSERT INTO public.users
    (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'technical@gutmann.com',
    '$2a$12$EI4J3zILpyy8kVnacM0/jeVSGZSKteRX5OSxsxXNg.g2eXr3WtO5O',
    'Technical Reviewer',
    'technical',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'technical@gutmann.com'
);

-- -------------------------------------------------------
-- 5. Estimation
-- -------------------------------------------------------
INSERT INTO public.users
    (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'estimation@gutmann.com',
    '$2a$12$6zkLbpPF6wGyPbL2YlcmSu3sxY3WOjfvmJHngl9BWjxeuJuYvb2Wu',
    'Estimator',
    'estimation',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'estimation@gutmann.com'
);

-- -------------------------------------------------------
-- 6. Client
-- -------------------------------------------------------
INSERT INTO public.users
    (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'client@gutmann.com',
    '$2a$12$92JsPGhq3WgEoBpA5DUiDu.Gs1GKQvlSiL.EvuRDR6LFZ7A4TZWCC',
    'Client User',
    'client',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'client@gutmann.com'
);

-- =====================================================
-- Verify all role users were inserted
-- =====================================================
SELECT
    email,
    name,
    role,
    is_active,
    to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at
FROM public.users
WHERE role IN ('ceo', 'salesperson', 'qc', 'technical', 'estimation', 'client')
ORDER BY
    CASE role
        WHEN 'ceo'         THEN 1
        WHEN 'salesperson' THEN 2
        WHEN 'qc'          THEN 3
        WHEN 'technical'   THEN 4
        WHEN 'estimation'  THEN 5
        WHEN 'client'      THEN 6
    END;
