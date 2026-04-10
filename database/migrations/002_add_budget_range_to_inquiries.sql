-- Migration 002: Add missing columns to inquiries table
-- Adds client_email, client_phone, client_company, project_type, and budget_range
-- which are required by the backend InquiryController and seed data.

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS client_email    TEXT,
  ADD COLUMN IF NOT EXISTS client_phone    TEXT,
  ADD COLUMN IF NOT EXISTS client_company  TEXT,
  ADD COLUMN IF NOT EXISTS project_type    TEXT,
  ADD COLUMN IF NOT EXISTS budget_range    TEXT;
