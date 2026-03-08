-- Migration: Criar tabelas To-Do V2 com suporte multi-tenant e colaboração cross-tenant
-- Data: 2026-02-21
-- Descrição: Sistema de tarefas que permite organizações convidarem usuários de clientes

-- Tabela principal de To-Dos V2
CREATE TABLE IF NOT EXISTS todos_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('organization', 'client')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP,
  "order" INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(7),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_todos_v2_organization_id ON todos_v2(organization_id);
CREATE INDEX IF NOT EXISTS idx_todos_v2_owner ON todos_v2(owner_id, owner_type);
CREATE INDEX IF NOT EXISTS idx_todos_v2_status ON todos_v2(status);
CREATE INDEX IF NOT EXISTS idx_todos_v2_due_date ON todos_v2(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_v2_org_status ON todos_v2(organization_id, status);

-- Comentários
COMMENT ON TABLE todos_v2 IS 'Sistema de tarefas V2 com suporte multi-tenant e colaboração cross-tenant';
COMMENT ON COLUMN todos_v2.organization_id IS 'Organização dona do todo (segregação multi-tenant)';
COMMENT ON COLUMN todos_v2.owner_id IS 'ID do usuário dono (pode ser org ou client user)';
COMMENT ON COLUMN todos_v2.owner_type IS 'Tipo do dono: organization ou client';
COMMENT ON COLUMN todos_v2.color IS 'Cor hex para identificação visual (#FF5733)';

-- Tabela de colaboradores V2
CREATE TABLE IF NOT EXISTS todo_collaborators_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('organization', 'client')),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(todo_id, user_id, user_type)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_todo_collaborators_v2_todo_id ON todo_collaborators_v2(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_collaborators_v2_user ON todo_collaborators_v2(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_todo_collaborators_v2_client_id ON todo_collaborators_v2(client_id);

-- Comentários
COMMENT ON TABLE todo_collaborators_v2 IS 'Colaboradores de tarefas - suporta org e client users';
COMMENT ON COLUMN todo_collaborators_v2.user_id IS 'ID do colaborador (pode ser org ou client user)';
COMMENT ON COLUMN todo_collaborators_v2.user_type IS 'Tipo do colaborador: organization ou client';
COMMENT ON COLUMN todo_collaborators_v2.client_id IS 'Se userType=client, qual cliente pertence (para filtros)';
COMMENT ON COLUMN todo_collaborators_v2.can_edit IS 'Se pode editar a tarefa ou apenas visualizar';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_todos_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_todos_v2_updated_at
  BEFORE UPDATE ON todos_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_todos_v2_updated_at();

CREATE TRIGGER trigger_update_todo_collaborators_v2_updated_at
  BEFORE UPDATE ON todo_collaborators_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_todos_v2_updated_at();

-- Dados de exemplo (opcional - comentado por padrão)
-- INSERT INTO todos_v2 (organization_id, owner_id, owner_type, title, description, priority, status)
-- VALUES 
--   ('org-uuid-here', 'user-uuid-here', 'organization', 'Exemplo de Tarefa', 'Descrição da tarefa', 'high', 'todo');

COMMENT ON TRIGGER trigger_update_todos_v2_updated_at ON todos_v2 IS 'Atualiza automaticamente o campo updated_at';
COMMENT ON TRIGGER trigger_update_todo_collaborators_v2_updated_at ON todo_collaborators_v2 IS 'Atualiza automaticamente o campo updated_at';
