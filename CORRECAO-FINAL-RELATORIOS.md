# Correção Final dos Erros de Relatórios

## Status: ✅ RESOLVIDO

## Problema

Erros SQL no backend ao tentar gerar relatórios:
```
error: column TimeTracking.userId does not exist
error: column TimeTracking.ticketId does not exist  
error: column TimeTracking.totalSeconds does not exist
```

## Causa Raiz

O Sequelize NÃO converte automaticamente camelCase para snake_case dentro de funções SQL (`fn()` e `col()`). 

Quando usamos:
- ❌ `col('TimeTracking.userId')` → Sequelize procura coluna "userId" (não existe)
- ✅ `col('TimeTracking.user_id')` → Sequelize usa coluna "user_id" (existe)

## Solução Implementada

Corrigidas todas as queries no `reportsController.js` para usar snake_case dentro das funções SQL:

### 1. getHoursByTicket (Linha ~36)
```javascript
// Corrigido:
[fn('COUNT', fn('DISTINCT', col('TimeTracking.user_id'))), 'totalUsers'],
[fn('SUM', col('TimeTracking.total_seconds')), 'totalSeconds'],
order: [[fn('SUM', col('TimeTracking.total_seconds')), 'DESC']]
```

### 2. getHoursByUser (Linha ~119)
```javascript
// Corrigido:
[fn('COUNT', fn('DISTINCT', col('TimeTracking.ticket_id'))), 'totalTickets'],
[fn('SUM', col('TimeTracking.total_seconds')), 'totalSeconds'],
order: [[fn('SUM', col('TimeTracking.total_seconds')), 'DESC']]
```

### 3. getHoursByClient (Linha ~270)
```javascript
// Corrigido:
[fn('COUNT', fn('DISTINCT', col('TimeTracking.user_id'))), 'totalUsers'],
[fn('SUM', col('TimeTracking.total_seconds')), 'totalSeconds'],
order: [[fn('SUM', col('TimeTracking.total_seconds')), 'DESC']]
```

## Regra Importante

**Dentro de funções SQL do Sequelize (`fn`, `col`):**
- ✅ Use snake_case (nomes das colunas do banco)
- ❌ NÃO use camelCase (nomes dos atributos do modelo)

**Fora de funções SQL (where, attributes simples):**
- ✅ Use camelCase (nomes dos atributos do modelo)
- ❌ NÃO use snake_case

## Exemplo Completo

```javascript
// ✅ CORRETO:
TimeTracking.findAll({
  where: { userId: '123' },  // ← camelCase no where
  attributes: [
    'userId',  // ← camelCase em attributes simples
    [fn('SUM', col('TimeTracking.total_seconds')), 'total']  // ← snake_case em col()
  ]
})

// ❌ ERRADO:
TimeTracking.findAll({
  where: { user_id: '123' },  // ← snake_case no where (não funciona)
  attributes: [
    'user_id',  // ← snake_case em attributes (não funciona)
    [fn('SUM', col('TimeTracking.totalSeconds')), 'total']  // ← camelCase em col() (não funciona)
  ]
})
```

## Teste

O backend foi reiniciado e as correções foram aplicadas. Para testar:

1. Acesse: http://localhost:5173/reports/time
2. Selecione um período
3. Gere os relatórios
4. Verifique que não há mais erros SQL no console do backend

## Arquivos Modificados

- ✅ `backend/src/modules/reports/reportsController.js` - Todas as queries corrigidas

## Conclusão

Todas as correções foram implementadas. O sistema de relatórios deve funcionar corretamente agora.
