# 📝 Exemplo de Integração com Suporte Offline

Este documento mostra como integrar o suporte offline nas funções existentes do Desktop Agent.

---

## 🎯 Conceito

O sistema de offline queue permite que ações sejam executadas mesmo sem conexão. Quando offline, as ações são armazenadas em uma fila e sincronizadas automaticamente quando a conexão é restaurada.

---

## 📦 Funções Disponíveis

### 1. `executeWithOfflineSupport(action, apiCall, data, metadata)`

Wrapper que executa uma ação com suporte offline automático.

**Parâmetros:**
- `action` (string): Tipo de ação ('create_ticket', 'send_message', etc.)
- `apiCall` (function): Função que executa a chamada à API
- `data` (object): Dados da ação
- `metadata` (object): Metadados adicionais (opcional)

**Retorno:**
- Se online: Resultado da API
- Se offline: `{ success: true, queued: true }`

### 2. `addToOfflineQueue(action, data, metadata)`

Adiciona uma ação diretamente à fila offline.

**Parâmetros:**
- `action` (string): Tipo de ação
- `data` (object): Dados da ação
- `metadata` (object): Metadados adicionais (opcional)

**Retorno:**
- `itemId` (string): ID do item na fila

---

## 💡 Exemplos de Integração

### Exemplo 1: Criar Ticket com Suporte Offline

**Antes:**
```javascript
async function handleCreateTicket() {
  const subject = document.getElementById('ticketSubject').value;
  const description = document.getElementById('ticketDescription').value;
  
  try {
    showLoading('Criando ticket...');
    const { success, ticket, error } = await window.electronAPI.createTicket({
      subject,
      description,
      priorityId: priorityId || null,
      typeId: typeId || null,
      categoryId
    });
    
    if (!success) {
      showNotification('error', error || 'Erro ao criar ticket');
      return;
    }
    
    showNotification('success', 'Ticket criado com sucesso!');
    await loadTickets();
  } catch (error) {
    showNotification('error', 'Erro ao criar ticket');
  } finally {
    hideLoading();
  }
}
```

**Depois (com suporte offline):**
```javascript
async function handleCreateTicket() {
  const subject = document.getElementById('ticketSubject').value;
  const description = document.getElementById('ticketDescription').value;
  
  const ticketData = {
    subject,
    description,
    priorityId: priorityId || null,
    typeId: typeId || null,
    categoryId
  };
  
  try {
    showLoading('Criando ticket...');
    
    // Usar wrapper com suporte offline
    const result = await executeWithOfflineSupport(
      'create_ticket',
      () => window.electronAPI.createTicket(ticketData),
      ticketData,
      { subject } // metadata opcional
    );
    
    if (result.queued) {
      // Ação foi adicionada à fila (modo offline)
      showNotification('info', 'Ticket será criado quando a conexão for restaurada.');
      // Limpar formulário mesmo offline
      document.getElementById('newTicketForm')?.remove();
    } else if (result.success) {
      // Ação executada com sucesso (modo online)
      showNotification('success', 'Ticket criado com sucesso!');
      await loadTickets();
    } else {
      showNotification('error', result.error || 'Erro ao criar ticket');
    }
  } catch (error) {
    // Erro já foi tratado pelo wrapper (adicionado à fila)
    console.error('Erro ao criar ticket:', error);
  } finally {
    hideLoading();
  }
}
```

---

### Exemplo 2: Enviar Mensagem com Suporte Offline

**Antes:**
```javascript
async function sendTicketMessage(ticketId, message) {
  try {
    const result = await window.electronAPI.sendMessage(ticketId, message);
    if (result.success) {
      showNotification('success', 'Mensagem enviada!');
      await loadTicketMessages(ticketId);
    }
  } catch (error) {
    showNotification('error', 'Erro ao enviar mensagem');
  }
}
```

**Depois (com suporte offline):**
```javascript
async function sendTicketMessage(ticketId, message) {
  const messageData = { ticketId, message };
  
  try {
    const result = await executeWithOfflineSupport(
      'send_message',
      () => window.electronAPI.sendMessage(ticketId, message),
      messageData,
      { ticketId, preview: message.substring(0, 50) }
    );
    
    if (result.queued) {
      showNotification('info', 'Mensagem será enviada quando a conexão for restaurada.');
      // Adicionar mensagem localmente com indicador "pendente"
      addPendingMessageToUI(ticketId, message);
    } else if (result.success) {
      showNotification('success', 'Mensagem enviada!');
      await loadTicketMessages(ticketId);
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
}
```

---

### Exemplo 3: Solicitar Item do Catálogo com Suporte Offline

**Antes:**
```javascript
async function requestCatalogItem(itemId, justification) {
  try {
    showLoading('Enviando solicitação...');
    const result = await window.electronAPI.requestCatalogItem(itemId, {
      justification
    });
    
    if (result.success) {
      showNotification('success', 'Solicitação enviada!');
      navigateTo('tickets');
    }
  } catch (error) {
    showNotification('error', 'Erro ao enviar solicitação');
  } finally {
    hideLoading();
  }
}
```

**Depois (com suporte offline):**
```javascript
async function requestCatalogItem(itemId, justification) {
  const requestData = { itemId, requestData: { justification } };
  
  try {
    showLoading('Enviando solicitação...');
    
    const result = await executeWithOfflineSupport(
      'request_catalog_item',
      () => window.electronAPI.requestCatalogItem(itemId, { justification }),
      requestData,
      { itemId, justification: justification.substring(0, 50) }
    );
    
    if (result.queued) {
      showNotification('info', 'Solicitação será enviada quando a conexão for restaurada.');
      // Fechar modal mesmo offline
      closeCatalogRequestModal();
    } else if (result.success) {
      showNotification('success', 'Solicitação enviada!');
      navigateTo('tickets');
    }
  } catch (error) {
    console.error('Erro ao enviar solicitação:', error);
  } finally {
    hideLoading();
  }
}
```

---

### Exemplo 4: Adicionar Diretamente à Fila (Sem Tentar Online)

Útil quando você sabe que a operação não é crítica e pode esperar:

```javascript
async function incrementArticleViews(articleId) {
  // Não precisa de feedback ao usuário, apenas adicionar à fila
  await addToOfflineQueue(
    'increment_article_views',
    { articleId },
    { articleId }
  );
}
```

---

## 🎨 Feedback Visual para Usuário

### Indicadores de Estado

1. **Online:**
   - Indicador verde "Online"
   - Ações executam normalmente
   - Sem fila visível

2. **Offline:**
   - Indicador vermelho "Offline"
   - Banner amarelo no topo: "Modo Offline - Suas ações serão sincronizadas..."
   - Indicador de fila com contador: "📤 3"

3. **Sincronizando:**
   - Loading: "Sincronizando..."
   - Notificação: "3 ações sincronizadas com sucesso!"

### Mensagens Recomendadas

**Ação adicionada à fila:**
```javascript
showNotification('info', 'Ação adicionada à fila. Será sincronizada quando a conexão for restaurada.');
```

**Sincronização bem-sucedida:**
```javascript
showNotification('success', `${count} ação(ões) sincronizada(s) com sucesso!`);
```

**Sincronização parcial:**
```javascript
showNotification('warning', `${processed} sincronizada(s), ${failed} falharam.`);
```

---

## 🔧 Tipos de Ações Suportadas

| Ação | Descrição | Dados Necessários |
|------|-----------|-------------------|
| `create_ticket` | Criar novo ticket | `{ subject, description, priorityId, typeId, categoryId }` |
| `send_message` | Enviar mensagem em ticket | `{ ticketId, message }` |
| `update_ticket` | Atualizar ticket | `{ ticketId, updates }` |
| `request_catalog_item` | Solicitar item do catálogo | `{ itemId, requestData }` |
| `mark_notification_read` | Marcar notificação como lida | `{ notificationId }` |
| `increment_article_views` | Incrementar views de artigo | `{ articleId }` |

---

## 📋 Checklist de Integração

Para cada função que você deseja adicionar suporte offline:

- [ ] Identificar a ação (tipo)
- [ ] Extrair dados necessários
- [ ] Substituir chamada direta por `executeWithOfflineSupport()`
- [ ] Adicionar tratamento para `result.queued`
- [ ] Adicionar feedback visual apropriado
- [ ] Testar em modo offline
- [ ] Testar sincronização ao reconectar

---

## 🧪 Como Testar

### 1. Testar Modo Offline

```javascript
// No console do DevTools:
// Simular perda de conexão
window.electronAPI.connectionGetStatus().then(console.log);

// Criar ticket offline
// (usar interface normalmente)

// Verificar fila
window.electronAPI.offlineQueueGetAll().then(console.log);
```

### 2. Testar Sincronização

```javascript
// Restaurar conexão (reconectar rede)
// Aguardar sincronização automática

// Ou sincronizar manualmente:
window.electronAPI.offlineQueueProcess().then(console.log);
```

### 3. Verificar Estatísticas

```javascript
window.electronAPI.offlineQueueGetStats().then(console.log);
// { total: 3, pending: 2, failed: 1 }
```

---

## 💡 Boas Práticas

1. **Sempre use `executeWithOfflineSupport()` para ações críticas**
   - Criar tickets
   - Enviar mensagens
   - Solicitar itens

2. **Use `addToOfflineQueue()` diretamente para ações não críticas**
   - Incrementar visualizações
   - Marcar notificações como lidas
   - Analytics

3. **Forneça feedback claro ao usuário**
   - Mostre quando está offline
   - Indique quantas ações estão na fila
   - Confirme quando sincronizar

4. **Permita visualização e gestão da fila**
   - Botão para ver fila
   - Botão para sincronizar manualmente
   - Botão para limpar falhados

5. **Teste extensivamente**
   - Desconectar durante operações
   - Reconectar e verificar sincronização
   - Testar com múltiplas ações na fila

---

## 🎯 Resultado Esperado

Com o suporte offline integrado:

✅ Usuário pode trabalhar sem conexão  
✅ Ações são armazenadas automaticamente  
✅ Sincronização automática ao reconectar  
✅ Feedback visual claro  
✅ Gestão manual da fila disponível  
✅ Sistema robusto com retentativas  

---

**Desenvolvido por:** Kiro AI Assistant  
**Data:** 06 de Dezembro de 2024  
**Versão:** 1.0.0

