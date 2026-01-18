# Requirements Document

## Introduction

O sistema de base de dados de desenvolvimento local perdeu várias tabelas devido a migrações não executadas ou executadas incorretamente. Este documento define os requisitos para recuperar a base de dados e implementar proteções contra perda de dados no futuro.

## Glossary

- **Database_Recovery_System**: Sistema responsável por restaurar a base de dados a partir de backups
- **Migration_Manager**: Sistema que gerencia e executa migrações de forma segura
- **Backup_System**: Sistema que cria backups automáticos antes de operações críticas
- **Development_Database**: Base de dados PostgreSQL local usada para desenvolvimento (tatuticket)
- **Migration_File**: Arquivo SQL ou JavaScript que define mudanças na estrutura da base de dados
- **SequelizeMeta**: Tabela que rastreia quais migrações foram executadas

## Requirements

### Requirement 1: Recuperação Imediata da Base de Dados

**User Story:** Como desenvolvedor, quero recuperar a base de dados de desenvolvimento, para que eu possa continuar trabalhando sem perder dados importantes.

#### Acceptance Criteria

1. WHEN o sistema detecta tabelas faltando, THEN THE Database_Recovery_System SHALL identificar quais tabelas estão ausentes
2. WHEN um backup válido existe, THEN THE Database_Recovery_System SHALL restaurar a base de dados a partir do backup mais recente
3. WHEN a restauração é concluída, THEN THE Database_Recovery_System SHALL verificar a integridade de todas as tabelas
4. IF a restauração falhar, THEN THE Database_Recovery_System SHALL reportar o erro e manter a base de dados no estado anterior

### Requirement 2: Análise de Migrações Pendentes

**User Story:** Como desenvolvedor, quero identificar quais migrações não foram executadas, para que eu possa aplicá-las corretamente.

#### Acceptance Criteria

1. WHEN o sistema analisa migrações, THEN THE Migration_Manager SHALL listar todas as migrações disponíveis nos diretórios
2. WHEN o sistema compara migrações, THEN THE Migration_Manager SHALL identificar quais migrações estão na SequelizeMeta
3. WHEN migrações pendentes são encontradas, THEN THE Migration_Manager SHALL listar as migrações que faltam executar
4. WHEN há conflitos de ordem, THEN THE Migration_Manager SHALL alertar sobre possíveis problemas de dependência

### Requirement 3: Execução Segura de Migrações

**User Story:** Como desenvolvedor, quero executar migrações pendentes de forma segura, para que a base de dados seja atualizada sem perda de dados.

#### Acceptance Criteria

1. WHEN uma migração será executada, THEN THE Backup_System SHALL criar um backup automático da base de dados
2. WHEN o backup é criado, THEN THE Migration_Manager SHALL executar a migração
3. IF a migração falhar, THEN THE Migration_Manager SHALL restaurar o backup automaticamente
4. WHEN a migração é bem-sucedida, THEN THE Migration_Manager SHALL registrar a migração na SequelizeMeta
5. WHEN todas as migrações são executadas, THEN THE Migration_Manager SHALL verificar a integridade da base de dados

### Requirement 4: Proteção Contra Perda de Dados

**User Story:** Como desenvolvedor, quero que o sistema me proteja contra operações perigosas, para que eu não perca dados acidentalmente.

#### Acceptance Criteria

1. WHEN um comando perigoso é detectado (sync force, drop), THEN THE Database_Recovery_System SHALL solicitar confirmação explícita
2. WHEN testes são executados, THEN THE Migration_Manager SHALL garantir que usam uma base de dados separada
3. WHEN a base de dados de desenvolvimento é acessada, THEN THE Database_Recovery_System SHALL verificar se não é um ambiente de teste
4. IF um teste tenta usar a base de dados de desenvolvimento, THEN THE Migration_Manager SHALL bloquear a operação e reportar erro

### Requirement 5: Backup Automático

**User Story:** Como desenvolvedor, quero que backups sejam criados automaticamente, para que eu possa recuperar dados em caso de problemas.

#### Acceptance Criteria

1. WHEN uma operação crítica será executada, THEN THE Backup_System SHALL criar um backup com timestamp
2. WHEN um backup é criado, THEN THE Backup_System SHALL verificar se o backup foi criado corretamente
3. WHEN backups antigos existem, THEN THE Backup_System SHALL manter os últimos 5 backups e remover os mais antigos
4. WHEN um backup falha, THEN THE Backup_System SHALL reportar o erro e cancelar a operação crítica

### Requirement 6: Relatório de Estado da Base de Dados

**User Story:** Como desenvolvedor, quero visualizar o estado atual da base de dados, para que eu possa identificar problemas rapidamente.

#### Acceptance Criteria

1. WHEN o relatório é solicitado, THEN THE Database_Recovery_System SHALL listar todas as tabelas existentes
2. WHEN o relatório é gerado, THEN THE Database_Recovery_System SHALL mostrar quais migrações foram executadas
3. WHEN o relatório é exibido, THEN THE Database_Recovery_System SHALL identificar migrações pendentes
4. WHEN problemas são detectados, THEN THE Database_Recovery_System SHALL destacar tabelas faltando ou inconsistências
