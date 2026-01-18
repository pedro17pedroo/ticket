-- Migration: Add Email Fields to Directions and Sections
-- Date: 2026-01-16
-- Description: Adds email fields to directions and sections tables for organizational email routing

BEGIN;

-- ============================================================================
-- ADD EMAIL COLUMN TO DIRECTIONS TABLE
-- ============================================================================
ALTER TABLE directions
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL;

-- Add email validation constraint for directions
ALTER TABLE directions
ADD CONSTRAINT directions_email_check 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Create index on email column for directions (partial index for non-null values)
CREATE INDEX IF NOT EXISTS idx_directions_email 
ON directions(email) 
WHERE email IS NOT NULL;

-- Add comment for directions email column
COMMENT ON COLUMN directions.email IS 'Email address for automatic ticket routing to this direction';

-- ============================================================================
-- ADD EMAIL COLUMN TO SECTIONS TABLE
-- ============================================================================
ALTER TABLE sections
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL;

-- Add email validation constraint for sections
ALTER TABLE sections
ADD CONSTRAINT sections_email_check 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Create index on email column for sections (partial index for non-null values)
CREATE INDEX IF NOT EXISTS idx_sections_email 
ON sections(email) 
WHERE email IS NOT NULL;

-- Add comment for sections email column
COMMENT ON COLUMN sections.email IS 'Email address for automatic ticket routing to this section';

-- ============================================================================
-- VERIFICATION QUERIES (for testing purposes)
-- ============================================================================

-- Verify directions table has email column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'directions' AND column_name = 'email'
  ) THEN
    RAISE EXCEPTION 'Migration failed: email column not added to directions table';
  END IF;
END $$;

-- Verify sections table has email column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sections' AND column_name = 'email'
  ) THEN
    RAISE EXCEPTION 'Migration failed: email column not added to sections table';
  END IF;
END $$;

-- Verify indexes were created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'directions' AND indexname = 'idx_directions_email'
  ) THEN
    RAISE EXCEPTION 'Migration failed: index idx_directions_email not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'sections' AND indexname = 'idx_sections_email'
  ) THEN
    RAISE EXCEPTION 'Migration failed: index idx_sections_email not created';
  END IF;
END $$;

COMMIT;
