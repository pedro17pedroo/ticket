# Otimização de Logs para Produção

## Problema Identificado

O backend possui muitos `console.log()` e `console.error()` diretos no código, que podem afetar o desempenho em produção:

1. **Console logs são síncronos** - Bloqueiam o event loop
2. **Não respeitam níveis de log** - Sempre executam, mesmo em produção
3. **Não são estruturados** - Difícil de filtrar e analisar
4. **Não têm rotação** - Podem encher o disco em produção

## Solução Implementada

### 1. Debug Logger Utility (`src/utils/debugLogger.js`)

Criado um wrapper que:
- ✅ Usa Winston logger (já configurado)
- ✅ Respeita `NODE_ENV` e `LOG_LEVEL`
- ✅ Em produção, `debug()` não faz nada (zero overhead)
- ✅ Logs estruturados e com timestamp
- ✅ Rotação automática de arquivos (5MB, 5 arquivos)

### 2. Níveis de Log

| Nível | Desenvolvimento | Produção | Uso |
|-------|----------------|----------|-----|
| `debug()` | Console + Arquivo | **Silencioso** | Logs de debug detalhados |
| `info()` | Console + Arquivo | Apenas Arquivo | Informações importantes |
| `warn()` | Console + Arquivo | Apenas Arquivo | Avisos |
| `error()` | Console + Arquivo | Apenas Arquivo | Erros |

### 3. Configuração do Logger

**Desenvolvimento** (`NODE_ENV=development`):
```env
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=true
```

**Produção** (`NODE_ENV=production`):
```env
NODE_ENV=production
LOG_LEVEL=info
DEBUG=false
```

## Como Usar

### Importar o Debug Logger

```javascript
// ❌ ANTES (não usar)
console.log('🔍 Debug info:', data);
console.error('❌ Erro:', error);

// ✅ DEPOIS (usar)
import { debug, info, warn, error } from '../utils/debugLogger.js';

debug('🔍 Debug info:', data);
info('✅ Operação concluída');
warn('⚠️ Aviso importante');
error('❌ Erro:', error);
```

### Exemplos de Uso

```javascript
import { debug, info, error } from '../utils/debugLogger.js';

// Debug detalhado (apenas em dev)
debug('📥 Request body:', req.body);
debug('🔍 Query params:', req.query);

// Informações importantes (sempre loga)
info('✅ Usuário criado:', user.email);
info('📧 Email enviado para:', recipient);

// Erros (sempre loga)
error('❌ Erro ao criar usuário:', err);
```

## Arquivos com Console.log Identificados

### Controllers (Alta Prioridade)
- `src/modules/saas/saasController.js` - 15+ console.log
- `src/modules/catalog/catalogControllerV2.js` - 10+ console.log
- `src/modules/auth/authController.js` - 5+ console.log
- `src/modules/users/userController.js` - 1 console.log
- `src/modules/departments/departmentController.js` - 2 console.log
- `src/modules/directions/directionController.js` - 2 console.log
- `src/modules/subscriptions/subscriptionController.js` - 2 console.log
- `src/modules/plans/planController.js` - 3 console.log

### Routes (Média Prioridade)
- `src/routes/debugRoutes.js` - 5+ console.log (OK - é debug route)

### Models (Baixa Prioridade)
- `src/modules/tickets/ticketModel.js` - 1 console.log

### Scripts (OK - Manter)
Scripts de migração e manutenção podem manter `console.log` pois são executados manualmente.

## Plano de Migração

### Fase 1: Controllers Críticos (Imediato)
1. ✅ `saasController.js` - Criação de organizações
2. ✅ `catalogControllerV2.js` - Criação de tickets
3. ✅ `authController.js` - Login

### Fase 2: Outros Controllers (Curto Prazo)
4. `userController.js`
5. `departmentController.js`
6. `directionController.js`
7. `subscriptionController.js`
8. `planController.js`

### Fase 3: Models e Outros (Médio Prazo)
9. `ticketModel.js`
10. Outros arquivos conforme necessário

## Script de Substituição Automática

```bash
# Substituir console.log por debug logger em um arquivo
node backend/scripts/replace-console-logs.js <arquivo>

# Exemplo:
node backend/scripts/replace-console-logs.js src/modules/saas/saasController.js
```

## Benefícios

### Performance
- ✅ **Zero overhead em produção** para logs de debug
- ✅ **Logs assíncronos** não bloqueiam event loop
- ✅ **Rotação automática** previne disco cheio

### Manutenibilidade
- ✅ **Logs estruturados** fáceis de filtrar
- ✅ **Timestamps automáticos**
- ✅ **Níveis de severidade** claros

### Operações
- ✅ **Fácil de desabilitar** logs verbosos em produção
- ✅ **Fácil de habilitar** debug quando necessário
- ✅ **Integração com ferramentas** de monitoramento (Datadog, New Relic, etc)

## Variáveis de Ambiente

### .env (Desenvolvimento)
```env
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=true
```

### .env.production (Produção)
```env
NODE_ENV=production
LOG_LEVEL=info
DEBUG=false
```

## Monitoramento em Produção

### Habilitar Debug Temporariamente
```bash
# Sem reiniciar o servidor
export DEBUG=true

# Ou via .env
echo "DEBUG=true" >> .env
pm2 restart backend
```

### Visualizar Logs
```bash
# Logs de erro
tail -f backend/logs/error.log

# Todos os logs
tail -f backend/logs/combined.log

# Filtrar por nível
grep "level\":\"error" backend/logs/combined.log
```

## Checklist de Produção

Antes de fazer deploy em produção:

- [ ] Verificar `NODE_ENV=production` no .env
- [ ] Verificar `LOG_LEVEL=info` (ou `warn`)
- [ ] Verificar `DEBUG=false`
- [ ] Testar que logs de debug não aparecem
- [ ] Configurar rotação de logs no sistema operacional
- [ ] Configurar monitoramento de logs (opcional)

## Próximos Passos

1. ✅ Criar `debugLogger.js` utility
2. ✅ Atualizar configuração do logger
3. ⏳ Substituir console.log nos controllers críticos
4. ⏳ Criar script de substituição automática
5. ⏳ Documentar para equipe
6. ⏳ Adicionar ao CI/CD (lint rule para proibir console.log)

---

**Data**: 30 de Janeiro de 2026
**Sistema**: T-Desk
**Prioridade**: Alta (Performance em Produção)
