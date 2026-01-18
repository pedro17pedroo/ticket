-- Fix Attachments Table Schema
-- Problem: attachments table uses INTEGER for id, ticket_id, comment_id
-- But tickets and comments tables use UUID
-- This causes "invalid input syntax for type integer" errors

-- ============================================================================
-- BACKUP EXISTING DATA (if any)
-- ============================================================================

-- Check if there's any data
SELECT COUNT(*) as attachment_count FROM attachments;

-- ============================================================================
-- FIX ATTACHMENTS TABLE
-- ============================================================================

-- Step 1: Drop foreign key constraints
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_ticket_id_fkey;
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_comment_id_fkey;

-- Step 2: Drop and recreate the table with correct types
DROP TABLE IF EXISTS attachments CASCADE;

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size INTEGER,
  path TEXT NOT NULL,
  
  -- Uploader polimórfico (quem fez upload)
  uploaded_by_id UUID,  -- LEGADO - manter por compatibilidade
  uploaded_by_type VARCHAR(20),  -- 'provider', 'organization', 'client'
  uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_by_org_user_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  uploaded_by_client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_attachments_ticket_id ON attachments(ticket_id);
CREATE INDEX idx_attachments_comment_id ON attachments(comment_id);
CREATE INDEX idx_attachments_uploaded_by_user_id ON attachments(uploaded_by_user_id);
CREATE INDEX idx_attachments_uploaded_by_org_user_id ON attachments(uploaded_by_org_user_id);
CREATE INDEX idx_attachments_uploaded_by_client_user_id ON attachments(uploaded_by_client_user_id);
CREATE INDEX idx_attachments_created_at ON attachments(created_at);

-- ============================================================================
-- VERIFY
-- ============================================================================

-- Check the new schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'attachments' 
ORDER BY ordinal_position;

-- Check foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'attachments' AND tc.constraint_type = 'FOREIGN KEY';

SELECT '✅ Attachments table schema fixed!' as status;
