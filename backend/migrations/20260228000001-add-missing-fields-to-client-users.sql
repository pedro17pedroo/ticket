-- Migration: Add Missing Fields to client_users
-- Data: 2026-02-28
-- Descrição: Adiciona campos faltantes à tabela client_users para sincronizar com o modelo Sequelize

BEGIN;

-- Adicionar direction_id
ALTER TABLE client_users 
ADD COLUMN IF NOT EXISTS direction_id UUID REFERENCES directions(id) ON DELETE SET NULL;

-- Adicionar department_id  
ALTER TABLE client_users
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Adicionar section_id
ALTER TABLE client_users
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;

-- Adicionar password_reset_token
ALTER TABLE client_users
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);

-- Adicionar password_reset_expires
ALTER TABLE client_users
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_client_users_direction_id ON client_users(direction_id);
CREATE INDEX IF NOT EXISTS idx_client_users_department_id ON client_users(department_id);
CREATE INDEX IF NOT EXISTS idx_client_users_section_id ON client_users(section_id);

-- Adicionar comentários
COMMENT ON COLUMN client_users.direction_id IS 'Direção à qual o usuário cliente pertence (estrutura organizacional)';
COMMENT ON COLUMN client_users.department_id IS 'Departamento ao qual o usuário cliente pertence (estrutura organizacional)';
COMMENT ON COLUMN client_users.section_id IS 'Seção à qual o usuário cliente pertence (estrutura organizacional)';
COMMENT ON COLUMN client_users.password_reset_token IS 'Token para reset de senha';
COMMENT ON COLUMN client_users.password_reset_expires IS 'Data de expiração do token de reset de senha';

COMMIT;
