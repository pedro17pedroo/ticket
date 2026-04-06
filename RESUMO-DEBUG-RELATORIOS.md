# Resumo: Debug Relatórios Não Aparecem

## Problema
Ticket TKT-20260309-4344 tem 10h 3m de tempo trabalhado (visível na interface), mas dashboard de relatórios mostra 0.

## Causa Mais Provável
Sistema tem dois modelos de tempo:
- **`time_entries`** - Modelo novo (usado pelo TimeTracker atual)
- **`time_tracking`** - Modelo antigo (usado pelos relatórios)

Dados estão em `time_entries`, mas relatórios buscam em `time_tracking`.

## Diagnóstico

### Executar script de teste:
```bash
cd backend
node test-relatorios-query.js
```

Este script mostrará:
- ✅ Quantos registros existem
- ✅ Em qual tabela estão os dados
- ✅ Por que a query não retorna resultados

### Verificação rápida no banco:
```sql
-- Ver onde estão os dados
SELECT 'time_tracking' as tabela, COUNT(*) as registros FROM time_tracking
UNION ALL
SELECT 'time_entries' as tabela, COUNT(*) as registros FROM time_entries WHERE status = 'stopped';
```

## Solução

Se dados estão em `time_entries`, atualizar controller de relatórios para buscar da tabela correta.

**Arquivo:** `backend/src/modules/reports/reportsController.js`

Trocar `TimeTracking` por `TimeEntry` e adicionar filtros:
- `status: 'stopped'`
- `isActive: false`

## Arquivos Criados
- `backend/test-relatorios-query.js` - Script de diagnóstico
- `backend/debug-relatorios.sql` - Queries SQL
- `DEBUG-RELATORIOS-NAO-APARECEM.md` - Guia completo

## Próximo Passo
Execute o script de teste para confirmar onde estão os dados:
```bash
cd backend
node test-relatorios-query.js
```
