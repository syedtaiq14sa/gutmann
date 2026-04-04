-- GUTMANN Project Workflow Management System
-- Initial Database Schema for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ceo', 'salesperson', 'qc', 'technical', 'estimation', 'client')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- INQUIRIES TABLE (Main projects table)
-- =====================================================
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    project_description TEXT,
    location VARCHAR(255),
    contact_info JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'received' CHECK (
        status IN (
            'received', 'qc_review', 'qc_revision',
            'technical_review', 'technical_revision',
            'estimation', 'ceo_approval', 'client_review',
            'approved', 'rejected'
        )
    ),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    bottleneck_flag BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    files JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_by ON inquiries(created_by);
CREATE INDEX IF NOT EXISTS idx_inquiries_bottleneck ON inquiries(bottleneck_flag);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- =====================================================
-- QC REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS qc_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    checklist JSONB DEFAULT '{}',
    remarks TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('approved', 'rejected', 'revision_required')),
    files JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qc_reviews_inquiry ON qc_reviews(inquiry_id);

-- =====================================================
-- TECHNICAL REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS technical_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    system_type VARCHAR(100),
    technical_specs JSONB DEFAULT '{}',
    feasibility VARCHAR(20) CHECK (feasibility IN ('feasible', 'not_feasible', 'conditional')),
    estimated_duration INTEGER,
    remarks TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('approved', 'rejected', 'revision_required')),
    files JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technical_reviews_inquiry ON technical_reviews(inquiry_id);

-- =====================================================
-- QUOTATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    estimator_id UUID NOT NULL REFERENCES users(id),
    boq_items JSONB DEFAULT '[]',
    material_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
    labor_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
    overhead_percentage DECIMAL(5, 2) DEFAULT 15,
    margin_percentage DECIMAL(5, 2) DEFAULT 20,
    estimated_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
    final_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ceo_adjusted BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    notes TEXT,
    validity_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_inquiry ON quotations(inquiry_id);

-- =====================================================
-- PROJECT STATUS TABLE (Stage tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    assigned_to UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_hours INTEGER,
    bottleneck_days INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_status_inquiry ON project_status(inquiry_id);

-- =====================================================
-- WORKFLOW TRANSITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    transitioned_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transitions_inquiry ON workflow_transitions(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_transitions_created_at ON workflow_transitions(created_at DESC);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'task')),
    related_id UUID,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    performed_by UUID REFERENCES users(id),
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_performed_by ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    stage VARCHAR(50),
    parent_id UUID REFERENCES comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_inquiry ON comments(inquiry_id);

-- =====================================================
-- AUTO-UPDATE TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['users', 'inquiries', 'qc_reviews', 'technical_reviews', 'quotations', 'comments']
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = 'trigger_' || tbl || '_updated_at'
        ) THEN
            EXECUTE format('
                CREATE TRIGGER trigger_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
                tbl, tbl);
        END IF;
    END LOOP;
END;
$$;

-- =====================================================
-- SAMPLE DATA (for development/testing)
-- =====================================================
-- Insert a default CEO user (password: Admin@123)
-- Note: Replace the password hash with a proper bcrypt hash in production
INSERT INTO users (email, password_hash, name, role) VALUES
    ('ceo@gutmann.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgRdX3MiTHMpj5V3ZQoNJu', 'CEO User', 'ceo')
ON CONFLICT (email) DO NOTHING;
