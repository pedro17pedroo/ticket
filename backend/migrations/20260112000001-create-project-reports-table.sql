-- Migration: Create Project Reports Table
-- Date: 2026-01-12
-- Description: Creates table for storing project report history

BEGIN;

-- ============================================================================
-- PROJECT REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  format VARCHAR(20) NOT NULL DEFAULT 'pdf',
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  options JSONB DEFAULT '{}',
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_report_type CHECK (type IN (
    'project_charter',
    'project_closure',
    'status_report',
    'schedule_report',
    'task_report',
    'stakeholder_report',
    'executive_summary'
  )),
  CONSTRAINT valid_report_format CHECK (format IN ('pdf', 'excel'))
);

-- Indexes for project_reports
CREATE INDEX IF NOT EXISTS idx_project_reports_organization_id ON project_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_reports_project_id ON project_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reports_type ON project_reports(type);
CREATE INDEX IF NOT EXISTS idx_project_reports_generated_by ON project_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_project_reports_generated_at ON project_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_project_reports_expires_at ON project_reports(expires_at);

-- Comments for project_reports
COMMENT ON TABLE project_reports IS 'History of generated project reports';
COMMENT ON COLUMN project_reports.organization_id IS 'Tenant organization that owns this report';
COMMENT ON COLUMN project_reports.project_id IS 'Project for which the report was generated';
COMMENT ON COLUMN project_reports.type IS 'Type of report: project_charter, project_closure, status_report, schedule_report, task_report, stakeholder_report, executive_summary';
COMMENT ON COLUMN project_reports.format IS 'File format: pdf or excel';
COMMENT ON COLUMN project_reports.filename IS 'Generated filename for download';
COMMENT ON COLUMN project_reports.file_path IS 'Path to the stored file';
COMMENT ON COLUMN project_reports.file_size IS 'File size in bytes';
COMMENT ON COLUMN project_reports.options IS 'Report generation options (filters, period, etc.)';
COMMENT ON COLUMN project_reports.generated_by IS 'User who generated the report';
COMMENT ON COLUMN project_reports.generated_at IS 'Timestamp when report was generated';
COMMENT ON COLUMN project_reports.expires_at IS 'Timestamp when report expires and can be cleaned up';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_project_reports_updated_at ON project_reports;
CREATE TRIGGER trigger_project_reports_updated_at
  BEFORE UPDATE ON project_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_project_tables_updated_at();

COMMIT;
