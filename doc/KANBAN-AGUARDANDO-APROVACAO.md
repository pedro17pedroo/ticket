# Status "Aguardando Aprovação" no Kanban

## 🎯 Comportamento Correto

O status **"Aguardando Aprovação"** é um status especial que só deve ser usado para **solicitações de serviço que requerem aprovação**.

---

## ✅ Quando Usar

O status "Aguardando Aprovação" só pode ser usado quando:

1. **O ticket é uma solicitação de serviço** (`catalogItemId` não é nulo)
2. **O serviço requer aprovação** (`catalogItem.requiresApproval = true`)

---

## ❌ Quando NÃO Usar

O sistema **bloqueará** a mudança para "Aguardando Aprovação" quando:

1. **Ticket manual** (não é solicitação de serviço)
   - Mensagem: "Apenas solicitações de serviço podem ter status 'Aguardando Aprovação'"

2. **Serviço não requer aprovação**
   - Mensagem: "Este serviço não requer aprovação. Use status 'Novo' ou 'Em Progresso'."

---

## 🔄 Fluxo Correto

### Para Solicitações COM Aprovação:

```
1. Cliente solicita serviço (requiresApproval = true)
   ↓
2. Ticket criado com status "Aguardando Aprovação"
   ↓
3. Aprovador aprova/rejeita
   ↓
4. Se aprovado: status muda para "Novo"
   Se rejeitado: ticket é fechado
```

### Para Solicitações SEM Aprovação:

```
1. Cliente solicita serviço (requiresApproval = false)
   ↓
2. Ticket criado com status "Novo"
   ↓
3. Técnico atribui e trabalha
   ↓
4. Status: Novo → Em Progresso → Resolvido → Fechado
```

### Para Tickets Manuais:

```
1. Usuário cria ticket manualmente
   ↓
2. Ticket criado com status "Novo"
   ↓
3. Fluxo normal: Novo → Em Progresso → Resolvido → Fechado
```

---

## 🛠️ Configuração de Aprovação

Para configurar se um serviço requer aprovação:

1. Acesse **Catálogo de Serviços**
2. Edite o item/serviço
3. Marque/desmarque **"Requer Aprovação"**

---

## 💡 Dicas

### Para Administradores:
- Use "Aguardando Aprovação" apenas para serviços que realmente precisam de aprovação prévia
- Exemplos: Compra de equipamentos, acesso a sistemas críticos, mudanças de infraestrutura

### Para Técnicos:
- Se tentar mover um ticket para "Aguardando Aprovação" e receber erro, verifique:
  1. É uma solicitação de serviço? (tem badge 📋)
  2. O serviço está configurado para requerer aprovação?
- Use os status corretos:
  - **Novo**: Ticket recém-criado, aguardando atribuição
  - **Em Progresso**: Técnico está trabalhando
  - **Aguardando Cliente**: Esperando resposta do cliente
  - **Resolvido**: Problema resolvido, aguardando confirmação
  - **Fechado**: Ticket finalizado

---

## 🔍 Identificação Visual

### No Kanban:
- Tickets com badge 📋 = Solicitações de serviço
- Tickets sem badge = Tickets manuais

### Na Lista:
- Coluna "Assunto" mostra badge 📋 para solicitações

---

## 📋 Mensagens de Erro

### Erro 1: "Apenas solicitações de serviço podem ter status 'Aguardando Aprovação'"
**Causa**: Tentou mover um ticket manual para aguardando aprovação
**Solução**: Use outro status (Novo, Em Progresso, etc)

### Erro 2: "Este serviço não requer aprovação. Use status 'Novo' ou 'Em Progresso'."
**Causa**: O serviço não está configurado para requerer aprovação
**Solução**: 
- Use status "Novo" ou "Em Progresso"
- OU configure o serviço para requerer aprovação (se necessário)

---

## ✅ Validações Implementadas

O sistema valida automaticamente:

1. **No Backend** (`ticketController.js`):
   ```javascript
   if (status === 'aguardando_aprovacao') {
     - Verifica se tem catalogItemId
     - Verifica se catalogItem.requiresApproval = true
     - Retorna erro 400 se não atender requisitos
   }
   ```

2. **No Frontend** (`TicketsKanban.jsx`):
   ```javascript
   - Captura erro do backend
   - Mostra mensagem amigável
   - Reverte mudança visual
   ```

---

## 🎓 Resumo

**Status "Aguardando Aprovação" = Solicitações de Serviço + Requer Aprovação**

Se o ticket não atende esses dois critérios, use outro status apropriado.
