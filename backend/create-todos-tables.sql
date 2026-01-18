-- Criar tabelas de To-Do para o Portal Cliente

-- Tabela principal de tarefas
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  "order" INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de colaboradores de tarefas
CREATE TABLE IF NOT EXISTS todo_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(todo_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_todos_client_id ON todos(client_id);
CREATE INDEX IF NOT EXISTS idx_todos_owner_id ON todos(owner_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);

CREATE INDEX IF NOT EXISTS idx_todo_collaborators_todo_id ON todo_collaborators(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_collaborators_user_id ON todo_collaborators(user_id);

-- Comentários
COMMENT ON TABLE todos IS 'Tarefas (To-Do) dos usuários clientes';
COMMENT ON TABLE todo_collaborators IS 'Colaboradores que podem visualizar/editar tarefas';

COMMENT ON COLUMN todos.owner_id IS 'Usuário dono da tarefa';
COMMENT ON COLUMN todos.color IS 'Cor hex para identificação visual';
COMMENT ON COLUMN todo_collaborators.can_edit IS 'Se o colaborador pode editar a tarefa';

-- Verificar tabelas criadas
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('todos', 'todo_collaborators')
ORDER BY table_name;
