-- Sample Inquiries for GUTMANN System
-- Covers all workflow stages for testing
-- Run after test_users.sql

INSERT INTO inquiries (
  id, inquiry_number, client_name, client_email, client_phone, client_company,
  project_type, project_description, location, budget_range, status,
  priority, created_by, created_at, updated_at
) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'INQ-20240101-ABCD', 'John Smith', 'client1@example.com', '+1-555-0101', 'Smith Corp',
    'commercial', 'Office building HVAC and electrical installation, 5 floors.',
    'Dubai, UAE', '$500,000 - $750,000', 'received',
    'high', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'INQ-20240102-BCDE', 'Emily Johnson', 'client2@example.com', '+1-555-0102', 'Johnson Ltd',
    'residential', 'Smart home automation and solar panel installation for villa.',
    'Abu Dhabi, UAE', '$100,000 - $200,000', 'qc_review',
    'medium', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'INQ-20240103-CDEF', 'Ahmed Al-Farsi', 'ahmed@example.com', '+971-50-123456', 'Al-Farsi Group',
    'industrial', 'Factory electrical infrastructure upgrade, 10,000 sqm facility.',
    'Sharjah, UAE', '$1,000,000 - $1,500,000', 'technical_review',
    'high', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'INQ-20240104-DEFG', 'Maria Garcia', 'maria@example.com', '+34-91-123456', 'Garcia SA',
    'infrastructure', 'Street lighting and traffic signal system for new development.',
    'Ajman, UAE', '$200,000 - $400,000', 'estimation',
    'medium', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'INQ-20240105-EFGH', 'James Wilson', 'james@example.com', '+44-20-123456', 'Wilson Holdings',
    'commercial', 'Shopping mall complete MEP services, 3 floors, 15,000 sqm.',
    'Dubai, UAE', '$2,000,000 - $3,000,000', 'ceo_approval',
    'high', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'INQ-20240106-FGHI', 'Sophie Chen', 'sophie@example.com', '+86-10-123456', 'Chen Industries',
    'residential', 'Luxury apartment complex, 20 units, full automation.',
    'Ras Al Khaimah, UAE', '$800,000 - $1,200,000', 'client_review',
    'medium', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 days'
  ),
  (
    'gggggggg-gggg-gggg-gggg-gggggggggggg',
    'INQ-20240107-GHIJ', 'Robert Brown', 'robert@example.com', '+1-555-0103', 'Brown & Co',
    'commercial', 'Restaurant chain, 3 locations, kitchen equipment and HVAC.',
    'Dubai, UAE', '$300,000 - $500,000', 'approved',
    'low', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'
  ),
  (
    'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
    'INQ-20240108-HIJK', 'Lisa Anderson', 'lisa@example.com', '+1-555-0104', 'Anderson LLC',
    'industrial', 'Warehouse fire suppression and electrical, 5,000 sqm.',
    'Fujairah, UAE', '$150,000 - $250,000', 'rejected',
    'low', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days'
  )
ON CONFLICT (id) DO NOTHING;


-- Sample quotations for inquiries in estimation/ceo_approval/client_review/approved stages
INSERT INTO quotations (
  id, inquiry_id, estimator_id, estimated_cost, final_price,
  validity_days, payment_terms, status, created_at
) VALUES
  (
    'q1111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '66666666-6666-6666-6666-666666666666',
    280000, 350000, 30, '30% upfront, 70% on completion', 'draft', NOW() - INTERVAL '2 days'
  ),
  (
    'q2222222-2222-2222-2222-222222222222',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '66666666-6666-6666-6666-666666666666',
    1800000, 2400000, 30, '25% upfront, 50% midway, 25% on completion', 'submitted', NOW() - INTERVAL '1 day'
  ),
  (
    'q3333333-3333-3333-3333-333333333333',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '66666666-6666-6666-6666-666666666666',
    720000, 950000, 45, '20% upfront, 40% midway, 40% on delivery', 'approved', NOW() - INTERVAL '5 days'
  ),
  (
    'q4444444-4444-4444-4444-444444444444',
    'gggggggg-gggg-gggg-gggg-gggggggggggg',
    '66666666-6666-6666-6666-666666666666',
    340000, 450000, 30, '30% upfront, 70% on completion', 'accepted', NOW() - INTERVAL '15 days'
  )
ON CONFLICT (id) DO NOTHING;
