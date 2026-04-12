-- Add centralized sales follow-up stage for rejection and coordination handling

ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE inquiries
ADD CONSTRAINT inquiries_status_check
CHECK (
  status IN (
    'received', 'qc_review', 'qc_revision',
    'technical_review', 'technical_revision',
    'estimation', 'ceo_approval', 'sales_followup', 'client_review',
    'approved', 'supply_chain', 'rejected'
  )
);
