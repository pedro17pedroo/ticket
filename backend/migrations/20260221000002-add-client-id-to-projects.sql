-- Migration: Add clientId to projects table
-- Date: 2026-02-21
-- Description: Add client_id column to projects table to distinguish between internal and client projects

-- Add client_id column
ALTER TABLE projects 
ADD COLUMN client_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE projects
ADD CONSTRAINT fk_projects_client
FOREIGN KEY (client_id) 
REFERENCES clients(id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_projects_client_id ON projects(client_id);

-- Add comment
COMMENT ON COLUMN projects.client_id IS 'Client associated with this project (null for internal projects)';
