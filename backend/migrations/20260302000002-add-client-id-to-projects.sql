-- Migration: Add client_id column to projects table
-- Date: 2026-03-02
-- Description: Adiciona coluna client_id para associar projetos a clientes B2B

-- Add client_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'client_id'
    ) THEN
        ALTER TABLE projects 
        ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
        
        -- Add comment
        COMMENT ON COLUMN projects.client_id IS 'Client associated with this project (null for internal projects)';
        
        -- Create index
        CREATE INDEX idx_projects_client_id ON projects(client_id);
        
        RAISE NOTICE 'Column client_id added to projects table';
    ELSE
        RAISE NOTICE 'Column client_id already exists in projects table';
    END IF;
END $$;
