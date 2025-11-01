-- Migration: Add comment_id column to attachments table
-- Date: 2025-11-01
-- Purpose: Allow attachments to be linked to specific comments

-- Add comment_id column
ALTER TABLE attachments 
ADD COLUMN comment_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE attachments
ADD CONSTRAINT fk_attachments_comment
FOREIGN KEY (comment_id) 
REFERENCES comments(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX attachments_comment_id_idx ON attachments(comment_id);

-- Verification query (optional)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'attachments' 
  AND column_name = 'comment_id';
