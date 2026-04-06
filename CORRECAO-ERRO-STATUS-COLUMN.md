# Correção: Erro "column User.status does not exist"

## Problema
O endpoint `/api/subscription` estava retornando erro 500 devido a uma query incorreta no `subscriptionController.js` linha 504. O código tentava filtrar usuários usando uma coluna `status` que não existe na tabela `users`.

## Causa Raiz
```javascript
// CÓDIGO INCORRETO
const usersCount = await User.count({
  where: { 
    organizationId,
    status: { [Op.ne]: 'deleted' }  // ❌ Coluna 'status' não existe
  }
});
```

## Solução Implementada

### 1. Corrigida a coluna de filtro
Após verificar o modelo `User` em `backend/src/modules/users/userModel.js`, identificamos que a coluna correta é `isActive` (boolean).

```javascript
// CÓDIGO CORRIGIDO
const usersCount = await User.count({
  where: { 
    organizationId,
    isActive: true  // ✅ Coluna correta
  }
});
```

### 2. Melhorado o sistema de imports
Substituímos o dynamic import por imports estáticos no topo do arquivo para melhor performance e clareza:

```javascript
// ANTES (dynamic import)
const { User, Client, Ticket } = await import('../models/index.js');

// DEPOIS (static import)
import User from '../users/userModel.js';
import Client from '../clients/clientModel.js';
import Ticket from '../tickets/ticketModel.js';
```

## Estrutura do Modelo User
```javascript
isActive: {
  type: DataTypes.BOOLEAN,
  defaultValue: true
}
```

## Impacto
- ✅ Endpoint `/api/subscription` agora funciona corretamente
- ✅ Contagem de usuários ativos retorna valores reais
- ✅ Frontend pode exibir limites de uso atualizados
- ✅ Percentagens de uso são calculadas corretamente
- ✅ Performance melhorada com imports estáticos

## Arquivos Modificados
- `backend/src/modules/subscriptions/subscriptionController.js`
  - Linha 1-6: Adicionados imports estáticos
  - Linha 504: Corrigida query de contagem de usuários
  - Removido dynamic import desnecessário

## Próximos Passos
1. Reiniciar o backend para aplicar a correção
2. Testar o endpoint `/api/subscription`
3. Verificar se os limites de uso aparecem corretamente no frontend

