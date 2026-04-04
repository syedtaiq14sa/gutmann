-- GUTMANN Test Users Seed
-- Inserts one user per role for development and QA testing.
--
-- Passwords (bcrypt, cost 12):
--   ceo@gutmann.com        -> Admin@123
--   sales@gutmann.com      -> Sales@123
--   qc@gutmann.com         -> QC@12345
--   tech@gutmann.com       -> Tech@123
--   estimation@gutmann.com -> Est@1234
--   client@gutmann.com     -> Client@12
--
-- IMPORTANT: These are test-only credentials.
--            Change all passwords before deploying to production.

INSERT INTO users (email, password_hash, name, role, is_active) VALUES
    (
        'ceo@gutmann.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgRdX3MiTHMpj5V3ZQoNJu',
        'CEO User',
        'ceo',
        TRUE
    ),
    (
        'sales@gutmann.com',
        '$2a$12$eImiTXuWVxfM37uY4JANjQ==.hashed.placeholder.sales',
        'Sales User',
        'salesperson',
        TRUE
    ),
    (
        'qc@gutmann.com',
        '$2a$12$eImiTXuWVxfM37uY4JANjQ==.hashed.placeholder.qc',
        'QC User',
        'qc',
        TRUE
    ),
    (
        'tech@gutmann.com',
        '$2a$12$eImiTXuWVxfM37uY4JANjQ==.hashed.placeholder.tech',
        'Technical User',
        'technical',
        TRUE
    ),
    (
        'estimation@gutmann.com',
        '$2a$12$eImiTXuWVxfM37uY4JANjQ==.hashed.placeholder.estimation',
        'Estimation User',
        'estimation',
        TRUE
    ),
    (
        'client@gutmann.com',
        '$2a$12$eImiTXuWVxfM37uY4JANjQ==.hashed.placeholder.client',
        'Client User',
        'client',
        TRUE
    )
ON CONFLICT (email) DO NOTHING;

-- -------------------------------------------------------
-- NOTE: The password_hash values above are placeholder
-- hashes for the non-CEO roles. To generate real bcrypt
-- hashes for each password run the following Node.js
-- snippet locally (requires bcryptjs or bcrypt):
--
--   node -e "
--     const bcrypt = require('bcryptjs');
--     const pairs = [
--       ['Sales@123',  'sales'],
--       ['QC@12345',   'qc'],
--       ['Tech@123',   'tech'],
--       ['Est@1234',   'estimation'],
--       ['Client@12',  'client'],
--     ];
--     pairs.forEach(([pw, role]) => {
--       console.log(role, bcrypt.hashSync(pw, 12));
--     });
--   "
--
-- Then replace the placeholder hashes above with the
-- generated values and re-run this script.
-- -------------------------------------------------------
