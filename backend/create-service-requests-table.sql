-- Create service_requests table
-- Date: 2026-01-17
-- Description: Creates the service_requests table for catalog service requests

BEGIN;

CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES organization_users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',
  form_data JSONB DEFAULT '{}'::jsonb,
  requested_for_user_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  approved_by_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMP,
  rejected_by_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_requests_organization_id ON service_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_catalog_item_id ON service_requests(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_ticket_id ON service_requests(ticket_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);

-- Comments
COMMENT ON TABLE service_requests IS 'Service requests from catalog items';
COMMENT ON COLUMN service_requests.organization_id IS 'Organization that owns this request';
COMMENT ON COLUMN service_requests.catalog_item_id IS 'Catalog item being requested';
COMMENT ON COLUMN service_requests.user_id IS 'User who made the request';
COMMENT ON COLUMN service_requests.ticket_id IS 'Associated ticket (if created)';
COMMENT ON COLUMN service_requests.status IS 'Request status: pending, approved, rejected, completed';
COMMENT ON COLUMN service_requests.form_data IS 'Custom form data submitted with the request';
COMMENT ON COLUMN service_requests.requested_for_user_id IS 'User for whom the request is being made (if different from requester)';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_service_requests_updated_at ON service_requests;
CREATE TRIGGER trigger_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_service_requests_updated_at();

COMMIT;

-- Verify
SELECT 'service_requests table created successfully' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_requests'
ORDER BY ordinal_position;
