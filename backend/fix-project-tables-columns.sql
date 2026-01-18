-- Fix missing columns in project tables
-- Date: 2026-01-17
-- Description: Ensures all project tables have the necessary columns

BEGIN;

-- ============================================================================
-- 1. PROJECT_TASKS - Add created_by if not exists
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_tasks' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE project_tasks 
        ADD COLUMN created_by UUID REFERENCES organization_users(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_project_tasks_created_by ON project_tasks(created_by);
        
        COMMENT ON COLUMN project_tasks.created_by IS 'Usuário que criou a tarefa';
    END IF;
END $$;

-- ============================================================================
-- 2. PROJECT_PHASES - Verify all columns exist
-- ============================================================================
DO $$ 
BEGIN
    -- Add created_by if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_phases' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE project_phases 
        ADD COLUMN created_by UUID REFERENCES organization_users(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_project_phases_created_by ON project_phases(created_by);
        
        COMMENT ON COLUMN project_phases.created_by IS 'Usuário que criou a fase';
    END IF;
END $$;

-- ============================================================================
-- 3. PROJECT_STAKEHOLDERS - Verify all columns exist
-- ============================================================================
DO $$ 
BEGIN
    -- Ensure user_id references organization_users instead of users
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_stakeholders' AND column_name = 'user_id'
    ) THEN
        -- Drop old constraint if exists
        ALTER TABLE project_stakeholders DROP CONSTRAINT IF EXISTS project_stakeholders_user_id_fkey;
        
        -- Add new constraint to organization_users
        ALTER TABLE project_stakeholders 
        ADD CONSTRAINT project_stakeholders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES organization_users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 4. PROJECT_TASK_COMMENTS - Verify user_id references organization_users
-- ============================================================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_task_comments' AND column_name = 'user_id'
    ) THEN
        -- Drop old constraint if exists
        ALTER TABLE project_task_comments DROP CONSTRAINT IF EXISTS project_task_comments_user_id_fkey;
        
        -- Add new constraint to organization_users
        ALTER TABLE project_task_comments 
        ADD CONSTRAINT project_task_comments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES organization_users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 5. PROJECT_TASK_ATTACHMENTS - Verify uploaded_by references organization_users
-- ============================================================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_task_attachments' AND column_name = 'uploaded_by'
    ) THEN
        -- Drop old constraint if exists
        ALTER TABLE project_task_attachments DROP CONSTRAINT IF EXISTS project_task_attachments_uploaded_by_fkey;
        
        -- Add new constraint to organization_users
        ALTER TABLE project_task_attachments 
        ADD CONSTRAINT project_task_attachments_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES organization_users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 6. PROJECT_TICKETS - Verify linked_by references organization_users
-- ============================================================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_tickets' AND column_name = 'linked_by'
    ) THEN
        -- Drop old constraint if exists
        ALTER TABLE project_tickets DROP CONSTRAINT IF EXISTS project_tickets_linked_by_fkey;
        
        -- Add new constraint to organization_users
        ALTER TABLE project_tickets 
        ADD CONSTRAINT project_tickets_linked_by_fkey 
        FOREIGN KEY (linked_by) REFERENCES organization_users(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'project_tasks columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'project_tasks' 
AND column_name IN ('created_by', 'assigned_to')
ORDER BY column_name;

SELECT 'project_phases columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'project_phases' 
AND column_name = 'created_by';
