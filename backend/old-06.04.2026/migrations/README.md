# 📋 Migrações do Banco de Dados

Este diretório contém todas as migrações SQL do projeto TatuTicket.

## 🗂️ Estrutura de Nomenclatura

As migrações seguem o padrão: `YYYYMMDD[HHMMSS]-description.sql`

- **YYYYMMDD**: Data da migração
- **HHMMSS**: Hora (opcional, para múltiplas migrações no mesmo dia)
- **description**: Descrição curta da migração

## 📅 Ordem de Execução

### Fase 1: Multi-tenant Base (Novembro 2025)

1. `20251104000001-update-organizations-multitenant.sql` - Estrutura multi-tenant
2. `20251104000002-create-clients-table.sql` - Tabela de clientes
3. `20251104000003-create-client-users-table.sql` - Usuários de clientes
4. `20251104000004-update-users-remove-client-role.sql` - Remover role cliente de users
5. `20251104000005-update-tickets-add-client-fields.sql` - Campos de cliente em tickets
6. `20251104000006-verify-organization-segregation.sql` - Verificação de segregação
7. `20251104210000-add-permissions-to-users.sql` - Sistema de permissões

### Fase 2: Catálogo de Serviços (Novembro 2025)

8. `20251108000001-add-missing-fields-to-catalog-items.sql` - Campos do catálogo
9. `20251108000002-add-catalog-fields-to-tickets.sql` - Integração catálogo-tickets
10. `20251109000001-add-priority-type-to-catalog-items.sql` - Prioridades no catálogo
11. `20251109000002-add-priority-type-to-tickets.sql` - Prioridades em tickets
12. `add-catalog-tables.sql` - Tabelas do catálogo (sem data)

### Fase 3: SLA e Timer (Novembro 2025)

13. `20251111-add-first-response-at.js` - Campo de primeira resposta
14. `20251111-add-timer-pause-resume.js` - Pausar/retomar cronômetro

### Fase 4: Gestão de Projetos (Janeiro 2026)

15. `20260111000001-create-project-management-tables.sql` - Tabelas de projetos
16. `20260111000002-add-project-permissions.sql` - Permissões de projetos
17. `20260112000001-create-project-reports-table.sql` - Relatórios de projetos
18. `20260114000001-create-catalog-access-control-tables.sql` - Controle de acesso ao catálogo

### Fase 5: Email e Roteamento (Janeiro 2026)

19. `20260116000001-add-email-to-directions-sections.sql` - Emails em direções/seções

### Migrações Sem Data (Executar Manualmente)

- `add-multitenant-security.sql` - Segurança multi-tenant adicional
- `fix-organizational-structure-hierarchy.sql` - Correção de hierarquia
- `migrate-service-requests-to-tickets.sql` - Migração de service requests

## 🚀 Como Executar

### Método 1: Script Automático (Recomendado)

```bash
cd backend
node run-migrations-safe.js
```

Este script:
- Executa migrações em ordem
- Verifica se já foram executadas
- Faz backup antes de executar
- Registra logs de execução

### Método 2: Manual (PostgreSQL)

```bash
# Executar uma migração específica
psql -U postgres -d tatuticket -f migrations/20251104000001-update-organizations-multitenant.sql

# Executar todas em ordem
for file in migrations/*.sql; do
  echo "Executando $file..."
  psql -U postgres -d tatuticket -f "$file"
done
```

### Método 3: Sequelize (JavaScript)

```bash
# Executar migrações JS
npx sequelize-cli db:migrate

# Reverter última migração
npx sequelize-cli db:migrate:undo

# Reverter todas
npx sequelize-cli db:migrate:undo:all
```

## 📊 Status das Migrações

Para verificar quais migrações foram executadas:

```sql
-- Verificar tabela de controle (se existir)
SELECT * FROM sequelize_meta ORDER BY name;

-- Verificar estrutura do banco
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## ⚠️ Avisos Importantes

1. **Sempre faça backup antes de executar migrações**
   ```bash
   pg_dump -U postgres -d tatuticket > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Teste em ambiente de desenvolvimento primeiro**

3. **Migrações são irreversíveis** - Não há rollback automático

4. **Verifique dependências** - Algumas migrações dependem de outras

5. **Ambiente de produção** - Execute em horário de baixo tráfego

## 🔧 Troubleshooting

### Erro: "relation already exists"

A migração já foi executada. Verifique o estado do banco:

```sql
\dt  -- Listar tabelas
\d nome_da_tabela  -- Ver estrutura da tabela
```

### Erro: "column already exists"

O campo já existe. Você pode:
1. Pular a migração
2. Modificar a migração para usar `IF NOT EXISTS`

### Erro: "permission denied"

Verifique as permissões do usuário:

```sql
GRANT ALL PRIVILEGES ON DATABASE tatuticket TO postgres;
```

## 📝 Criar Nova Migração

1. **Criar arquivo com data atual:**
   ```bash
   touch migrations/$(date +%Y%m%d%H%M%S)-description.sql
   ```

2. **Estrutura básica:**
   ```sql
   -- Migration: Description
   -- Date: YYYY-MM-DD
   -- Author: Name
   
   BEGIN;
   
   -- Suas alterações aqui
   
   COMMIT;
   ```

3. **Adicionar ao README** na seção apropriada

## 🔗 Recursos

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Sequelize Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)

## 📞 Suporte

Para dúvidas sobre migrações:
- Consulte a documentação em `/doc`
- Verifique os logs em `/backend/logs`
- Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** 18 de Janeiro de 2026
