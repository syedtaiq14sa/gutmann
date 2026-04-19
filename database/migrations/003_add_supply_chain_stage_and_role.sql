-- Add supply_chain role and workflow stage support

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('ceo', 'salesperson', 'qc', 'technical', 'estimation', 'client', 'supply_chain'));

ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE inquiries
ADD CONSTRAINT inquiries_status_check
CHECK (
  status IN (
    'received', 'qc_review', 'qc_revision',
    'technical_review', 'technical_revision',
    'estimation', 'ceo_approval', 'client_review',
    'approved', 'supply_chain', 'rejected'
  )
);
