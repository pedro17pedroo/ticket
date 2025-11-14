# Sistema de Prioridades - Visão Completa

**Data:** 11/11/2025  
**Status:** ✅ Implementado

---

## 🎯 Três Tipos de Prioridades

O sistema agora exibe claramente **3 prioridades diferentes** para cada ticket:

### 1. 📦 **Prioridade do Item/Serviço** (Catálogo)
- **Origem:** Definida no item/serviço do catálogo
- **Quando:** Configurada pelo admin ao criar/editar o item no catálogo
- **Propósito:** Prioridade padrão sugerida para o tipo de serviço
- **Editável:** Não (apenas visualização no ticket)
- **Exemplo:** "Instalação de Software" → Prioridade "Média"

**Características:**
- Vem da tabela `catalog_items.priority_id`
- Referencia `priorities` table
- Serve como baseline para o serviço
- Exibida apenas se o ticket foi criado via catálogo

---

### 2. 👤 **Prioridade do Cliente**
- **Origem:** Selecionada pelo cliente ao criar o ticket
- **Quando:** Durante a criação do ticket (manual ou via catálogo)
- **Propósito:** Urgência percebida pelo solicitante
- **Editável:** Não (apenas visualização no ticket)
- **Exemplo:** Cliente pode marcar como "Alta" mesmo se o serviço é "Média"

**Características:**
- Armazenada em `tickets.priority` (string)
- Definida pelo solicitante
- Reflete a percepção do cliente
- Sempre exibida

---

### 3. ⚙️ **Prioridade Interna da Organização**
- **Origem:** Definida pela equipe técnica/gestão
- **Quando:** Após análise do ticket
- **Propósito:** Ajustar urgência baseado em critérios internos
- **Editável:** ✅ Sim (por admins e agentes)
- **Exemplo:** Ticket "Média" do cliente → Ajustado para "Alta" internamente

**Características:**
- Armazenada em `tickets.internal_priority` (string)
- Requer justificativa quando diferente da prioridade do cliente
- Permite gestão interna sem alterar a visão do cliente
- Opcional (se não definida, usa prioridade do cliente)

---

## 📊 Interface Visual

### Layout no Ticket

```
┌─────────────────────────────────────────┐
│  📦 Prioridade do Item/Serviço          │
│  ┌────────────┐                         │
│  │   média    │                         │
│  └────────────┘                         │
│  Prioridade definida no catálogo        │
│  para este serviço                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  👤 Prioridade do Cliente               │
│  ┌────────────┐                         │
│  │    alta    │                         │
│  └────────────┘                         │
│  Prioridade selecionada pelo cliente    │
│  ao criar o ticket                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ⚙️ Prioridade Interna da Organização   │
│  ┌──────────────────────────────────┐   │
│  │ Usar prioridade do cliente    ▼ │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ⚠️ Motivo da Alteração (se diferente)  │
│  ┌──────────────────────────────────┐   │
│  │ [textarea]                       │   │
│  └──────────────────────────────────┘   │
│                                         │
│  [ Atualizar Prioridade ]               │
└─────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Prioridades

### Cenário 1: Ticket via Catálogo
```
1. Item "Instalação Antivírus" tem prioridade "Média"
   ↓
2. Cliente cria ticket e seleciona "Alta" (urgente)
   ↓
3. Sistema salva:
   - catalogItem.priority = "Média" (referência)
   - ticket.priority = "Alta" (cliente)
   - ticket.internalPriority = null (ainda não definida)
   ↓
4. Técnico analisa e define interna como "Crítica"
   - Motivo: "Cliente VIP + impacto em produção"
   ↓
5. Sistema mostra as 3 prioridades:
   - Catálogo: Média
   - Cliente: Alta
   - Interna: Crítica ⚡ (ativa para SLA)
```

### Cenário 2: Ticket Manual (sem catálogo)
```
1. Ticket criado manualmente
   ↓
2. Cliente seleciona "Baixa"
   ↓
3. Sistema salva:
   - catalogItem = null (não tem)
   - ticket.priority = "Baixa" (cliente)
   - ticket.internalPriority = null
   ↓
4. Interface mostra:
   - Catálogo: (não exibido)
   - Cliente: Baixa
   - Interna: [dropdown para definir]
```

---

## 💡 Casos de Uso

### Caso 1: Prioridades Alinhadas
```
📦 Catálogo: Média
👤 Cliente: Média
⚙️ Interna: (não definida) → Usa "Média"

Resultado: SLA calculado com "Média"
```

### Caso 2: Cliente Exagera
```
📦 Catálogo: Baixa (troca de mouse)
👤 Cliente: Crítica (marcou errado)
⚙️ Interna: Baixa (ajustada pelo técnico)
         Motivo: "Troca de mouse não é crítica"

Resultado: SLA calculado com "Baixa" (interna)
```

### Caso 3: Urgência Real
```
📦 Catálogo: Média (problema de rede)
👤 Cliente: Média
⚙️ Interna: Crítica (ajustada)
         Motivo: "Afeta 50+ usuários em produção"

Resultado: SLA calculado com "Crítica" (interna)
```

### Caso 4: Cliente VIP
```
📦 Catálogo: Baixa
👤 Cliente: Baixa
⚙️ Interna: Alta
         Motivo: "Cliente estratégico - CEO"

Resultado: SLA calculado com "Alta" (interna)
```

---

## 🎨 Cores por Prioridade

```css
Baixa    → Cinza   (bg-gray-100)
Média    → Azul    (bg-blue-100)
Alta     → Laranja (bg-orange-100)
Crítica  → Vermelho (bg-red-100)
```

---

## 🔧 Implementação Técnica

### Backend

**Modelo Ticket:**
```javascript
{
  catalogItemId: UUID,        // Referência ao item do catálogo
  priority: STRING,           // Prioridade do cliente
  internalPriority: STRING,   // Prioridade interna
  // ...
}
```

**Modelo CatalogItem:**
```javascript
{
  priorityId: UUID,           // Referência à prioridade padrão
  // ...
}
```

**API Response (`GET /tickets/:id`):**
```json
{
  "ticket": {
    "id": "uuid",
    "priority": "alta",
    "internalPriority": "critica",
    "catalogItem": {
      "id": "uuid",
      "name": "Instalação Antivírus",
      "priority": {
        "id": "uuid",
        "name": "media",
        "level": 2
      }
    }
  }
}
```

### Frontend

**Componente:** `InternalPriorityManager.jsx`

**Props:**
```javascript
{
  ticketId: String,
  clientPriority: String,           // Prioridade do cliente
  internalPriority: String,         // Prioridade interna atual
  catalogItemPriority: String,      // Prioridade do item (se existir)
  onUpdate: Function
}
```

**Lógica de Exibição:**
```javascript
1. Se catalogItemPriority existe → Mostra seção "Prioridade do Item/Serviço"
2. Sempre mostra "Prioridade do Cliente"
3. Sempre mostra "Prioridade Interna da Organização" (editável)
```

---

## ⚠️ Validações e Regras

### 1. Mudança de Prioridade Interna
```javascript
// Regra: Se mudar prioridade interna, motivo é obrigatório
if (newPriority !== currentPriority) {
  if (!reason.trim()) {
    throw Error("Motivo obrigatório");
  }
}
```

### 2. Cálculo de SLA
```javascript
// Prioridade efetiva para SLA
const effectivePriority = ticket.internalPriority || ticket.priority;

// Buscar SLA baseado na prioridade efetiva
const sla = await SLA.findOne({
  where: { priority: effectivePriority }
});
```

### 3. Permissões
- **Cliente:** ❌ Não pode alterar prioridades
- **Agente:** ✅ Pode definir prioridade interna
- **Admin:** ✅ Pode definir prioridade interna

---

## 📝 Histórico e Auditoria

Toda mudança de prioridade interna é registrada:

```json
{
  "action": "updated",
  "field": "internalPriority",
  "oldValue": "media",
  "newValue": "critica",
  "description": "Prioridade interna alterada de 'Média' para 'Crítica'",
  "userId": "uuid-tecnico",
  "reason": "Afeta 50+ usuários em produção",
  "timestamp": "2025-11-11T18:30:00Z"
}
```

---

## 🎯 Benefícios

### Para o Cliente:
- ✅ Transparência total sobre sua solicitação
- ✅ Vê a prioridade que selecionou preservada
- ✅ Entende a classificação do serviço

### Para a Organização:
- ✅ Flexibilidade para ajustar urgência
- ✅ Gestão baseada em critérios internos
- ✅ SLA calculado de forma precisa
- ✅ Histórico completo de mudanças
- ✅ Justificativas documentadas

### Para Gestão:
- ✅ Visibilidade das 3 dimensões de prioridade
- ✅ Métricas mais precisas
- ✅ Identificação de padrões (clientes que exageram, etc)
- ✅ Tomada de decisão informada

---

## 📊 Relatórios Possíveis

1. **Divergência Cliente vs Catálogo**
   - Quantos tickets o cliente marcou diferente do catálogo?
   
2. **Ajustes Internos**
   - Quantos tickets foram re-priorizados?
   - Motivos mais comuns?
   
3. **SLA por Prioridade Efetiva**
   - Performance considerando ajustes internos

4. **Clientes que Exageram**
   - Identificar clientes que marcam tudo como "Crítico"

---

## 🔄 Migração de Dados Existentes

Para tickets antigos sem `catalogItemId`:
- Prioridade do Item: (não exibida)
- Prioridade do Cliente: Mantida
- Prioridade Interna: null (pode ser definida)

---

**Sistema de prioridades completo e funcional!** ✅
