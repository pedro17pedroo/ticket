# Resumo: Dashboard de Relatórios Vazio

## Problema
Dashboard de relatórios mostra 0 em todos os cards, mesmo com 2 tickets criados.

## Causa
✅ **Comportamento correto!** Dashboard mostra apenas tickets com **tempo trabalhado**.

Os tickets foram criados mas nenhum timer foi iniciado/parado, então não há dados na tabela `time_tracking`.

## Solução

### Para Ver Dados no Dashboard:

1. **Abrir um ticket no portal da organização**
2. **Sidebar direita → "Tempo de Trabalho"**
3. **Clicar "Iniciar"** (inicia o timer)
4. **Aguardar alguns segundos** (simular trabalho)
5. **Clicar "Parar"** (salva o tempo)
6. **Recarregar dashboard** → Dados devem aparecer

## Verificação Rápida

```sql
-- Ver se há tempo trabalhado
SELECT COUNT(*) FROM time_tracking WHERE status = 'stopped';

-- Se retornar 0, não há dados para o dashboard
-- Se retornar > 0, dashboard deve mostrar dados
```

## Diferença Entre Páginas

| Página | Mostra |
|--------|--------|
| **Tickets** | Todos os tickets (com ou sem tempo) |
| **Dashboard** | Apenas tickets com tempo trabalhado |

## Conclusão

Não é um bug - dashboard funciona corretamente. Ele é específico para análise de **tempo trabalhado**, não para estatísticas gerais de tickets.

Para popular o dashboard: **trabalhe nos tickets** (inicie e pare timers).
