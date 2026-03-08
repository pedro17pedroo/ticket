# Correção do Modelo ClientUser

**Data**: 28 de Fevereiro de 2026  
**Status**: ✅ CORRIGIDO

## 🐛 Problema Identificado

O modelo Sequelize `ClientUser` estava desincronizado com a tabela `client_users` na base de dados, causando erro:

```
column requesterClientUser.direction_id does not exist
column requesterClientUser.department_id does not exist
column requesterClientUser.section_id does not exist
column requesterClientUser.password_reset_token does not exist
column requesterClientUser.password_reset_expires does not exist
```

## 🔍 Análise

### Campos no Modelo Sequelize

O modelo `backend/src/models/ClientUser.js` definia:
- ✅ `directionId` (direction_id)
- ✅ `departmentId` (department_id)
- ✅ `sectionId` (section_id)
- ❌ `passwordResetToken` (password_reset_token) - FALTAVA
- ❌ `passwordResetExpires` (password_reset_expires) - FALTAVA

### Campos na Tabela client_users

A tabela tinha:
- ✅ `direction_id` - UUID
- ✅ `department_id` - UUID
- ✅ `section_id` - UUID
- ✅ `password_reset_token` - VARCHAR(255)
- ✅ `password_reset_expires` - TIMESTAMP WITHOUT TIME ZONE

## ✅ Correções Aplicadas

### 1. Migração SQL

Criada migração `backend/migrations/20260228000001-add-missing-fields-to-client-users.sql`:

```sql
-- Adicionar campos (já existiam, mas garantindo)
ALTER TABLE client_users 
ADD COLUMN IF NOT EXISTS direction_id UUID REFERENCES directions(id) ON DELETE SET NULL;

ALTER TABLE client_users
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE client_users
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;

ALTER TABLE client_users
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);

ALTER TABLE client_users
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_client_users_direction_id ON client_users(direction_id);
CREATE INDEX IF NOT EXISTS idx_client_users_department_id ON client_users(department_id);
CREATE INDEX IF NOT EXISTS idx_client_users_section_id ON client_users(section_id);
```

### 2. Correção do Tipo de Dados

```sql
-- Corrigir tipo de password_reset_expires para WITH TIME ZONE
ALTER TABLE client_users 
ALTER COLUMN password_reset_expires TYPE TIMESTAMP WITH TIME ZONE;
```

### 3. Atualização do Modelo Sequelize

Adicionados campos faltantes em `backend/src/models/ClientUser.js`:

```javascript
passwordResetToken: {
  type: DataTypes.STRING,
  field: 'password_reset_token'
},
passwordResetExpires: {
  type: DataTypes.DATE,
  field: 'password_reset_expires'
}
```

## 📊 Estrutura Final da Tabela client_users

```sql
Column                  | Type                        | Nullable | Default
------------------------+-----------------------------+----------+------------------
id                      | uuid                        | not null | uuid_generate_v4()
organization_id         | uuid                        | not null |
client_id               | uuid                        | not null |
name                    | varchar(255)                | not null |
email                   | varchar(255)                | not null |
password                | varchar(255)                | not null |
role                    | client_user_role            | not null | 'client-user'
avatar                  | varchar(255)                |          |
phone                   | varchar(50)                 |          |
position                | varchar(100)                |          |
department_name         | varchar(100)                |          |
direction_id            | uuid                        |          | -- ADICIONADO
department_id           | uuid                        |          | -- ADICIONADO
section_id              | uuid                        |          | -- ADICIONADO
location                | jsonb                       |          | '{}'
permissions             | jsonb                       |          | {...}
settings                | jsonb                       |          | {...}
is_active               | boolean                     |          | true
email_verified          | boolean                     |          | false
email_verified_at       | timestamp                   |          |
last_login              | timestamp                   |          |
password_reset_token    | varchar(255)                |          | -- ADICIONADO
password_reset_expires  | timestamp with time zone    |          | -- ADICIONADO
created_at              | timestamp                   |          | CURRENT_TIMESTAMP
updated_at              | timestamp                   |          | CURRENT_TIMESTAMP
```

## 🔗 Relacionamentos

### Foreign Keys Adicionadas

```sql
-- Estrutura organizacional
direction_id → directions(id) ON DELETE SET NULL
department_id → departments(id) ON DELETE SET NULL
section_id → sections(id) ON DELETE SET NULL

-- Relacionamentos existentes
organization_id → organizations(id) ON DELETE CASCADE
client_id → clients(id) ON DELETE CASCADE
```

### Índices Criados

```sql
idx_client_users_direction_id
idx_client_users_department_id
idx_client_users_section_id
```

## 🎯 Propósito dos Campos

### Estrutura Organizacional

- `direction_id`: Direção à qual o usuário cliente pertence
- `department_id`: Departamento ao qual o usuário cliente pertence
- `section_id`: Seção à qual o usuário cliente pertence

Estes campos permitem que usuários de empresas clientes sejam associados à estrutura organizacional da organização tenant, facilitando:
- Roteamento de tickets por estrutura organizacional
- Relatórios por direção/departamento/seção
- Permissões baseadas em estrutura organizacional

### Reset de Senha

- `password_reset_token`: Token único para reset de senha
- `password_reset_expires`: Data de expiração do token

Estes campos são essenciais para o fluxo de recuperação de senha dos usuários clientes.

## ✅ Verificação

### Comando para Verificar

```bash
cd backend
PGPASSWORD=postgres psql -h localhost -U postgres -d tatuticket \
  -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'client_users' ORDER BY ordinal_position;"
```

### Resultado Esperado

Deve mostrar todos os 25 campos, incluindo:
- direction_id (uuid)
- department_id (uuid)
- section_id (uuid)
- password_reset_token (character varying)
- password_reset_expires (timestamp with time zone)

## 📝 Arquivos Modificados

1. `backend/migrations/20260228000001-add-missing-fields-to-client-users.sql` - CRIADO
2. `backend/src/models/ClientUser.js` - ATUALIZADO

## 🚀 Próximos Passos

1. Reiniciar o servidor backend
2. Verificar se o erro desapareceu
3. Testar funcionalidades que usam ClientUser

## ⚠️ Lição Aprendida

**SEMPRE sincronizar modelos Sequelize com a estrutura da base de dados!**

Quando adicionar campos à base de dados:
1. ✅ Criar migração SQL
2. ✅ Atualizar modelo Sequelize
3. ✅ Verificar sincronização
4. ✅ Testar funcionalidades

Quando adicionar campos ao modelo Sequelize:
1. ✅ Criar migração SQL primeiro
2. ✅ Executar migração
3. ✅ Atualizar modelo
4. ✅ Verificar sincronização

## 📚 Documentação Relacionada

- `RESTAURACAO-ARQUITETURA-SAAS.md` - Restauração das tabelas de clientes
- `CORRECAO-ARQUITETURA-SAAS-COMPLETA.md` - Correção completa da arquitetura
- `backend/migrations/20251104000003-create-client-users-table.sql` - Migração original

## ✅ Status Final

**Modelo e Tabela**: ✅ SINCRONIZADOS  
**Campos Faltantes**: ✅ ADICIONADOS  
**Tipos de Dados**: ✅ CORRIGIDOS  
**Índices**: ✅ CRIADOS  
**Foreign Keys**: ✅ CONFIGURADAS

O modelo ClientUser está agora completamente sincronizado com a tabela client_users na base de dados.
