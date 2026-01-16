-- Migration: Create Project Management Tables
-- Date: 2026-01-11
-- Description: Creates all tables for the Project Management module including
--              projects, phases, tasks, dependencies, stakeholders, tickets association,
--              comments and attachments

BEGIN;

-- ============================================================================
-- 1. PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  methodology VARCHAR(50) NOT NULL DEFAULT 'waterfall',
  status VARCHAR(50) NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  progress INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,
  
  CONSTRAINT valid_methodology CHECK (methodology IN ('waterfall', 'agile', 'scrum', 'kanban', 'hybrid')),
  CONSTRAINT valid_status CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100),
  CONSTRAINT unique_project_code_per_org UNIQUE (organization_id, code)
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_methodology ON projects(methodology);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);

-- Comments for projects
COMMENT ON TABLE projects IS 'Main projects table for project management module';
COMMENT ON COLUMN projects.organization_id IS 'Tenant organization that owns this project';
COMMENT ON COLUMN projects.code IS 'Unique project code within organization (e.g., PRJ-001)';
COMMENT ON COLUMN projects.methodology IS 'Project methodology: waterfall, agile, scrum, kanban, hybrid';
COMMENT ON COLUMN projects.status IS 'Project status: planning, in_progress, on_hold, completed, cancelled';
COMMENT ON COLUMN projects.progress IS 'Overall project progress percentage (0-100)';


-- ============================================================================
-- 2. PROJECT PHASES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_phase_status CHECK (status IN ('pending', 'in_progress', 'completed')),
  CONSTRAINT valid_phase_progress CHECK (progress >= 0 AND progress <= 100)
);

-- Indexes for project_phases
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_status ON project_phases(status);
CREATE INDEX IF NOT EXISTS idx_project_phases_order_index ON project_phases(project_id, order_index);

-- Comments for project_phases
COMMENT ON TABLE project_phases IS 'Project phases that group related tasks';
COMMENT ON COLUMN project_phases.order_index IS 'Order of the phase within the project';
COMMENT ON COLUMN project_phases.progress IS 'Phase progress based on completed tasks percentage';

-- ============================================================================
-- 3. PROJECT TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMP,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  progress INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_task_status CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
  CONSTRAINT valid_task_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_task_progress CHECK (progress >= 0 AND progress <= 100)
);

-- Indexes for project_tasks
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_phase_id ON project_tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_priority ON project_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_order_index ON project_tasks(phase_id, order_index);

-- Comments for project_tasks
COMMENT ON TABLE project_tasks IS 'Individual tasks within project phases';
COMMENT ON COLUMN project_tasks.status IS 'Task status: todo, in_progress, in_review, done';
COMMENT ON COLUMN project_tasks.priority IS 'Task priority: low, medium, high, critical';
COMMENT ON COLUMN project_tasks.estimated_hours IS 'Estimated hours to complete the task';
COMMENT ON COLUMN project_tasks.actual_hours IS 'Actual hours spent on the task';


-- ============================================================================
-- 4. PROJECT TASK DEPENDENCIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) NOT NULL DEFAULT 'finish_to_start',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_dependency_type CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
  CONSTRAINT unique_task_dependency UNIQUE(task_id, depends_on_task_id)
);

-- Indexes for project_task_dependencies
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON project_task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON project_task_dependencies(depends_on_task_id);

-- Comments for project_task_dependencies
COMMENT ON TABLE project_task_dependencies IS 'Task dependencies for scheduling and Gantt chart';
COMMENT ON COLUMN project_task_dependencies.dependency_type IS 'Type of dependency: finish_to_start, start_to_start, finish_to_finish, start_to_finish';

-- ============================================================================
-- 5. PROJECT STAKEHOLDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'team_member',
  type VARCHAR(20) NOT NULL DEFAULT 'internal',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_stakeholder_role CHECK (role IN ('sponsor', 'manager', 'team_member', 'observer', 'client')),
  CONSTRAINT valid_stakeholder_type CHECK (type IN ('internal', 'external'))
);

-- Indexes for project_stakeholders
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_project_id ON project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_user_id ON project_stakeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_role ON project_stakeholders(role);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_type ON project_stakeholders(type);

-- Comments for project_stakeholders
COMMENT ON TABLE project_stakeholders IS 'Project stakeholders (internal users or external contacts)';
COMMENT ON COLUMN project_stakeholders.user_id IS 'Reference to internal user (NULL for external stakeholders)';
COMMENT ON COLUMN project_stakeholders.role IS 'Stakeholder role: sponsor, manager, team_member, observer, client';
COMMENT ON COLUMN project_stakeholders.type IS 'Stakeholder type: internal or external';


-- ============================================================================
-- 6. PROJECT TICKETS TABLE (Association between projects/tasks and tickets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  linked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_project_ticket UNIQUE(project_id, ticket_id)
);

-- Indexes for project_tickets
CREATE INDEX IF NOT EXISTS idx_project_tickets_project_id ON project_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tickets_ticket_id ON project_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_project_tickets_task_id ON project_tickets(task_id);

-- Comments for project_tickets
COMMENT ON TABLE project_tickets IS 'Association table linking tickets to projects and optionally to specific tasks';
COMMENT ON COLUMN project_tickets.task_id IS 'Optional reference to a specific task within the project';

-- ============================================================================
-- 7. PROJECT TASK COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for project_task_comments
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON project_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON project_task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON project_task_comments(created_at);

-- Comments for project_task_comments
COMMENT ON TABLE project_task_comments IS 'Comments on project tasks';

-- ============================================================================
-- 8. PROJECT TASK ATTACHMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size INTEGER,
  path VARCHAR(500) NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for project_task_attachments
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON project_task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON project_task_attachments(uploaded_by);

-- Comments for project_task_attachments
COMMENT ON TABLE project_task_attachments IS 'File attachments for project tasks';


-- ============================================================================
-- 9. TRIGGERS FOR updated_at
-- ============================================================================

-- Trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects
DROP TRIGGER IF EXISTS trigger_projects_updated_at ON projects;
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_tables_updated_at();

-- Trigger for project_phases
DROP TRIGGER IF EXISTS trigger_project_phases_updated_at ON project_phases;
CREATE TRIGGER trigger_project_phases_updated_at
  BEFORE UPDATE ON project_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_project_tables_updated_at();

-- Trigger for project_tasks
DROP TRIGGER IF EXISTS trigger_project_tasks_updated_at ON project_tasks;
CREATE TRIGGER trigger_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_tables_updated_at();

-- Trigger for project_stakeholders
DROP TRIGGER IF EXISTS trigger_project_stakeholders_updated_at ON project_stakeholders;
CREATE TRIGGER trigger_project_stakeholders_updated_at
  BEFORE UPDATE ON project_stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION update_project_tables_updated_at();

-- Trigger for project_task_comments
DROP TRIGGER IF EXISTS trigger_project_task_comments_updated_at ON project_task_comments;
CREATE TRIGGER trigger_project_task_comments_updated_at
  BEFORE UPDATE ON project_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_tables_updated_at();

-- ============================================================================
-- 10. SEQUENCE FOR PROJECT CODE GENERATION
-- ============================================================================

-- Create a sequence for project codes per organization
-- This will be used by the application to generate unique codes like PRJ-001, PRJ-002, etc.
CREATE SEQUENCE IF NOT EXISTS project_code_seq START WITH 1 INCREMENT BY 1;

-- Function to generate project code
CREATE OR REPLACE FUNCTION generate_project_code(org_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  next_num INTEGER;
  new_code VARCHAR(20);
BEGIN
  -- Get the next number for this organization
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM projects
  WHERE organization_id = org_id;
  
  -- Format the code as PRJ-XXX (with leading zeros)
  new_code := 'PRJ-' || LPAD(next_num::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_project_code(UUID) IS 'Generates unique project code for an organization (PRJ-001, PRJ-002, etc.)';

COMMIT;
