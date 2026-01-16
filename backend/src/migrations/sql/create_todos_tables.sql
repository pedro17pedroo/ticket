-- Criar tipo ENUM para status do todo
DO $$ BEGIN
    CREATE TYPE todo_status AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tipo ENUM para prioridade do todo
DO $$ BEGIN
    CREATE TYPE todo_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de todos
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status todo_status DEFAULT 'todo' NOT NULL,
    priority todo_priority DEFAULT 'medium' NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    "order" INTEGER DEFAULT 0 NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Criar tabela de colaboradores
CREATE TABLE IF NOT EXISTS todo_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
    can_edit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(todo_id, user_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_todos_client_id ON todos(client_id);
CREATE INDEX IF NOT EXISTS idx_todos_owner_id ON todos(owner_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todo_collaborators_todo_id ON todo_collaborators(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_collaborators_user_id ON todo_collaborators(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_todos_updated_at ON todos;
CREATE TRIGGER trigger_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_todos_updated_at();

DROP TRIGGER IF EXISTS trigger_todo_collaborators_updated_at ON todo_collaborators;
CREATE TRIGGER trigger_todo_collaborators_updated_at
    BEFORE UPDATE ON todo_collaborators
    FOR EACH ROW
    EXECUTE FUNCTION update_todos_updated_at();

-- Comentários
COMMENT ON TABLE todos IS 'Tarefas pessoais dos usuários clientes';
COMMENT ON TABLE todo_collaborators IS 'Colaboradores convidados para tarefas';
COMMENT ON COLUMN todos.owner_id IS 'Usuário dono da tarefa';
COMMENT ON COLUMN todos.color IS 'Cor hex para identificação visual';
COMMENT ON COLUMN todo_collaborators.can_edit IS 'Se o colaborador pode editar a tarefa';
