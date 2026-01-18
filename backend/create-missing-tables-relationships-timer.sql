-- Create Missing Tables: ticket_relationships and time_entries
-- These tables are referenced by the application but don't exist in the database

-- ============================================================================
-- TICKET RELATIONSHIPS TABLE
-- ============================================================================
-- For linking related tickets (duplicates, blocks, relates to, etc.)

CREATE TABLE IF NOT EXISTS ticket_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  related_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL,
  -- Types: 'duplicates', 'blocks', 'is_blocked_by', 'relates_to', 'parent_of', 'child_of'
  created_by UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate relationships
  CONSTRAINT unique_ticket_relationship UNIQUE (ticket_id, related_ticket_id, relationship_type),
  -- Prevent self-referencing
  CONSTRAINT no_self_reference CHECK (ticket_id != related_ticket_id)
);

-- Indexes for performance
CREATE INDEX idx_ticket_relationships_ticket_id ON ticket_relationships(ticket_id);
CREATE INDEX idx_ticket_relationships_related_ticket_id ON ticket_relationships(related_ticket_id);
CREATE INDEX idx_ticket_relationships_type ON ticket_relationships(relationship_type);

-- ============================================================================
-- TIME ENTRIES TABLE (Timer/Cronômetro)
-- ============================================================================
-- For tracking time spent on tickets

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES organization_users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Time tracking
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0, -- seconds
  
  -- Pause/Resume functionality
  total_paused_time INTEGER DEFAULT 0, -- seconds
  pause_count INTEGER DEFAULT 0,
  last_pause_at TIMESTAMP WITH TIME ZONE,
  last_resume_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'running', -- 'running', 'paused', 'stopped'
  
  -- Optional fields
  description TEXT,
  billable BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Business rules
  CONSTRAINT valid_time_range CHECK (end_time IS NULL OR end_time >= start_time),
  CONSTRAINT valid_duration CHECK (duration >= 0),
  CONSTRAINT valid_paused_time CHECK (total_paused_time >= 0)
);

-- Indexes for performance
CREATE INDEX idx_time_entries_ticket_id ON time_entries(ticket_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_organization_id ON time_entries(organization_id);
CREATE INDEX idx_time_entries_is_active ON time_entries(is_active);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);

-- Only one active timer per user per ticket
CREATE UNIQUE INDEX idx_one_active_timer_per_user_ticket 
  ON time_entries(ticket_id, user_id) 
  WHERE is_active = true AND status = 'running';

-- ============================================================================
-- VERIFY
-- ============================================================================

-- Check ticket_relationships
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'ticket_relationships' 
ORDER BY ordinal_position;

-- Check time_entries
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
ORDER BY ordinal_position;

-- Check constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  tc.table_name
FROM information_schema.table_constraints AS tc
WHERE tc.table_name IN ('ticket_relationships', 'time_entries')
ORDER BY tc.table_name, tc.constraint_type;

SELECT '✅ Tables created successfully!' as status;
