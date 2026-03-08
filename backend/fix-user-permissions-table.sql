-- Criar tabela user_permissions se não existir
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  granted_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_granted ON user_permissions(granted);

-- Comentários
COMMENT ON TABLE user_permissions IS 'Permissões específicas concedidas a usuários individuais';
COMMENT ON COLUMN user_permissions.user_id IS 'ID do usuário (pode ser de qualquer tabela de usuários)';
COMMENT ON COLUMN user_permissions.permission_id IS 'ID da permissão';
COMMENT ON COLUMN user_permissions.granted IS 'Se a permissão está concedida (true) ou revogada (false)';
COMMENT ON COLUMN user_permissions.granted_by IS 'ID do usuário que concedeu a permissão';
COMMENT ON COLUMN user_permissions.expires_at IS 'Data de expiração da permissão (NULL = sem expiração)';
