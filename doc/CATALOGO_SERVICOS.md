# 📋 Sistema de Catálogo de Serviços

## 🎯 Visão Geral

O **Catálogo de Serviços** é um componente essencial de um Service Desk moderno, permitindo que clientes solicitem serviços de forma organizada, padronizada e rastreável.

---

## 🏗️ Estrutura do Sistema

### **1. Categorias do Catálogo**
Organizam os serviços em grupos lógicos.

**Exemplos:**
- 🖥️ **Hardware** - Equipamentos e periféricos
- 💻 **Software** - Instalações e licenças  
- 🔐 **Acesso** - Permissões e credenciais
- 📞 **Telecomunicações** - Telefonia e redes
- 🛠️ **Manutenção** - Reparos e atualizações

**Campos:**
```javascript
{
  name: "Hardware",
  description: "Solicitação de equipamentos",
  icon: "Monitor", // ícone Lucide
  order: 1,
  isActive: true
}
```

---

### **2. Itens do Catálogo (Serviços)**
Serviços específicos que podem ser solicitados.

**Exemplos de Serviços:**

#### **Hardware**
- Solicitar novo computador
- Requisitar monitor adicional
- Pedir mouse/teclado
- Solicitar impressora

#### **Software**
- Instalar Microsoft Office
- Solicitar licença Adobe
- Acesso a software específico
- Atualização de sistema

#### **Acesso**
- Criar conta de usuário
- Reset de senha
- Acesso a pastas compartilhadas
- VPN

#### **Telecomunicações**
- Ramal telefônico
- Número de celular corporativo
- Acesso Wi-Fi guest

---

### **3. Campos Personalizados (Dynamic Forms)**
Cada serviço pode ter formulário único.

**Tipos de Campo Suportados:**
- `text` - Texto simples
- `textarea` - Texto longo
- `number` - Números
- `select` - Lista dropdown
- `checkbox` - Sim/Não
- `date` - Data

**Exemplo: Solicitar Computador**
```javascript
customFields: [
  {
    name: "tipo_equipamento",
    type: "select",
    label: "Tipo de Equipamento",
    required: true,
    options: [
      { value: "desktop", label: "Desktop" },
      { value: "laptop", label: "Laptop" },
      { value: "workstation", label: "Workstation" }
    ]
  },
  {
    name: "specs",
    type: "select",
    label: "Especificações",
    required: true,
    options: [
      { value: "basico", label: "Básico (Office)" },
      { value: "intermediario", label: "Intermediário (Design)" },
      { value: "avancado", label: "Avançado (Dev/3D)" }
    ]
  },
  {
    name: "justificativa",
    type: "textarea",
    label: "Justificativa",
    required: true,
    placeholder: "Explique a necessidade..."
  },
  {
    name: "data_necessaria",
    type: "date",
    label: "Data Necessária",
    required: false
  }
]
```

---

### **4. Service Requests (Solicitações)**
Quando cliente solicita um serviço.

**Fluxo:**
1. Cliente escolhe serviço do catálogo
2. Preenche formulário customizado
3. Sistema cria `ServiceRequest`
4. Se requer aprovação → aguarda
5. Se não requer → cria ticket automaticamente
6. Após aprovação → cria ticket
7. Ticket vinculado à solicitação

---

## 🔄 Fluxos de Uso

### **Cenário 1: Sem Aprovação**
```
Cliente → Catálogo → "Solicitar Reset de Senha"
↓
Preenche formulário: {
  usuario: "joao.silva",
  novo_email: "joao@empresa.com"
}
↓
[Enviar] → ServiceRequest criada
↓
✅ Ticket criado automaticamente
↓
Status: "em_progresso"
↓
Agente atende ticket
↓
Ticket concluído → ServiceRequest: "completed"
```

---

### **Cenário 2: Com Aprovação**
```
Cliente → Catálogo → "Solicitar Laptop Dell XPS"
↓
Preenche formulário: {
  modelo: "Dell XPS 15",
  specs: "i7, 32GB RAM, 1TB SSD",
  justificativa: "Desenvolvimento mobile",
  custo_estimado: "€2.500"
}
↓
[Enviar para Aprovação]
↓
ServiceRequest criada
Status: "pending_approval"
Aprovador: gestor_ti@empresa.com
↓
❓ Aguarda aprovação...
↓
Gestor acessa painel de aprovações
Opções:
  ✅ Aprovar (pode ajustar custo)
  ❌ Rejeitar (com justificativa)
↓
Se APROVADO:
  → Ticket criado automaticamente
  → Status: "in_progress"
  → Departamento TI notificado
  
Se REJEITADO:
  → Status: "rejected"
  → Cliente notificado
  → Pode criar nova solicitação
```

---

## 📊 Configuração de Serviços

### **Exemplo Completo: Instalação de Software**

```javascript
{
  // Básico
  name: "Instalação de Software",
  shortDescription: "Solicite a instalação de software autorizado",
  fullDescription: "Utilize este serviço para requisitar a instalação de software aprovado pela empresa.",
  icon: "Download",
  
  // Categoria
  categoryId: "uuid-software",
  
  // SLA e Prioridade
  slaId: "uuid-sla-padrao", // 24h resposta, 72h resolução
  defaultPriority: "media",
  
  // Aprovação
  requiresApproval: true,
  defaultApproverId: "uuid-gestor-ti",
  
  // Atribuição
  assignedDepartmentId: "uuid-depto-ti",
  
  // Custos
  estimatedCost: 0.00, // Gratuito (licença empresarial)
  estimatedDeliveryTime: 4, // 4 horas
  
  // Formulário
  customFields: [
    {
      name: "software",
      type: "select",
      label: "Software",
      required: true,
      options: [
        { value: "office365", label: "Microsoft Office 365" },
        { value: "adobe_reader", label: "Adobe Acrobat Reader" },
        { value: "7zip", label: "7-Zip" },
        { value: "chrome", label: "Google Chrome" },
        { value: "outro", label: "Outro (especifique abaixo)" }
      ]
    },
    {
      name: "outro_software",
      type: "text",
      label: "Especifique outro software",
      required: false,
      placeholder: "Nome do software..."
    },
    {
      name: "justificativa",
      type: "textarea",
      label: "Justificativa de Uso",
      required: true,
      rows: 4,
      placeholder: "Explique para que precisa deste software..."
    },
    {
      name: "urgente",
      type: "checkbox",
      label: "Necessário com urgência",
      required: false
    }
  ],
  
  // Visibilidade
  isActive: true,
  isPublic: true
}
```

---

## 🎨 Interface do Cliente

### **Tela Principal do Catálogo**

```
┌─────────────────────────────────────────────────┐
│ 🔍 [Buscar serviços...]                         │
├─────────────────────────────────────────────────┤
│ [Todos] [Hardware] [Software] [Acesso] [...]   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ 💻       │  │ 🔐       │  │ 📞       │     │
│  │ Novo     │  │ Reset    │  │ Ramal    │     │
│  │ Laptop   │  │ Senha    │  │ Telefone │     │
│  │          │  │          │  │          │     │
│  │ ⏱️ 48h   │  │ ⏱️ 2h    │  │ ⏱️ 24h   │     │
│  │ 💰 2.5k  │  │ 💰 0€    │  │ 💰 0€    │     │
│  │ ✅ Aprov.│  │          │  │          │     │
│  │          │  │          │  │          │     │
│  │[Solicitar│  │[Solicitar│  │[Solicitar│     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### **Modal de Solicitação**

```
┌────────────────────────────────────────┐
│ Solicitar: Novo Laptop                 │ ✕
├────────────────────────────────────────┤
│ Equipamento para trabalho remoto       │
│                                        │
│ Tipo de Equipamento *                  │
│ [Laptop            ▼]                  │
│                                        │
│ Especificações *                       │
│ [Intermediário     ▼]                  │
│                                        │
│ Justificativa *                        │
│ ┌──────────────────────────────────┐  │
│ │Necessário para desenvolvimento   │  │
│ │de aplicações mobile              │  │
│ │                                  │  │
│ └──────────────────────────────────┘  │
│                                        │
│ Data Necessária                        │
│ [15/11/2025]                          │
│                                        │
├────────────────────────────────────────┤
│ [Cancelar] [Enviar para Aprovação]    │
└────────────────────────────────────────┘
```

---

## 🔧 Interface de Administração

### **Portal da Organização**

#### **1. Gestão de Categorias**
```
[+ Nova Categoria]

📋 Categorias do Catálogo
┌────────────────────────────────────┐
│ 🖥️  Hardware            [Editar][X]│
│     10 serviços                     │
├────────────────────────────────────┤
│ 💻  Software            [Editar][X]│
│     15 serviços                     │
├────────────────────────────────────┤
│ 🔐  Acesso             [Editar][X]│
│     8 serviços                      │
└────────────────────────────────────┘
```

#### **2. Gestão de Serviços**
```
[+ Novo Serviço]  [Importar] [Exportar]

Filtros: [Categoria ▼] [Status ▼] [🔍 Buscar...]

┌──────────────────────────────────────────────┐
│ Solicitar Computador                    [Ações▼]│
│ Categoria: Hardware | SLA: 48h | Aprovação: Sim │
│ 45 solicitações | Última: 2 dias atrás         │
│ ⚙️ Editar | 📊 Estatísticas | ❌ Desativar     │
├──────────────────────────────────────────────┤
│ Reset de Senha                          [Ações▼]│
│ Categoria: Acesso | SLA: 2h | Aprovação: Não   │
│ 230 solicitações | Última: 1 hora atrás        │
└──────────────────────────────────────────────┘
```

#### **3. Painel de Aprovações**
```
⏳ Aguardando Aprovação (5)

┌──────────────────────────────────────────┐
│ 💻 Laptop Dell XPS 15              2.500€│
│ Solicitante: João Silva                  │
│ Departamento: Desenvolvimento            │
│ Data: 24/10/2025 15:30                  │
│                                          │
│ Justificativa:                           │
│ "Necessário para desenvolvimento mobile  │
│  com emuladores Android/iOS"            │
│                                          │
│ [✅ Aprovar] [❌ Rejeitar] [👁️ Ver Mais]  │
└──────────────────────────────────────────┘
```

---

## 📈 Estatísticas e Relatórios

### **Dashboard de Catálogo**

```
┌──────────────────────────────────────┐
│ 📊 Visão Geral do Catálogo          │
├──────────────────────────────────────┤
│ Total de Serviços:        45        │
│ Solicitações (mês):       234       │
│ Aguardando aprovação:     5         │
│ Taxa de aprovação:        92%       │
└──────────────────────────────────────┘

🔥 Serviços Mais Solicitados
1. Reset de Senha           89x
2. Instalação Office        45x  
3. Acesso VPN              32x
4. Novo Mouse/Teclado      28x
5. Ramal Telefônico        21x

📈 Solicitações por Categoria
Hardware:      45 (19%)
Software:      89 (38%)
Acesso:        67 (29%)
Telecom:       33 (14%)

⏱️ Tempo Médio de Atendimento
Reset Senha:        1.5h
Install Software:   4.2h
Novo Equipamento:   48h
```

---

## 🔗 Integração com Tickets

### **Ticket Criado a partir do Catálogo**

```
Ticket #2025-1234
[Catálogo] Instalação de Software

Status: Em Andamento
Prioridade: Média
SLA: 72h (28h restantes)
Categoria: Software
Departamento: TI

─────────────────────────────────
📋 Solicitação de Serviço: Instalação de Software

Instalação de software autorizado pela empresa

**Dados fornecidos:**
- **Software:** Microsoft Office 365
- **Outro software:** -
- **Justificativa de Uso:** Necessário para criação de documentos e planilhas corporativas
- **Necessário com urgência:** Não

─────────────────────────────────
🔗 Service Request: #SR-2025-456
Status: Em Progresso
Solicitante: Maria Santos
Aprovador: Gestor TI
Data Solicitação: 24/10/2025 10:00
Data Aprovação: 24/10/2025 10:15
─────────────────────────────────
```

---

## 💡 Casos de Uso Práticos

### **1. Onboarding de Novo Funcionário**

**Serviço: "Pacote Novo Colaborador"**
```javascript
{
  name: "Onboarding - Novo Colaborador",
  customFields: [
    { name: "nome_completo", type: "text", required: true },
    { name: "email_pessoal", type: "text", required: true },
    { name: "departamento", type: "select", required: true },
    { name: "cargo", type: "text", required: true },
    { name: "data_inicio", type: "date", required: true },
    { name: "necessidades_especiais", type: "textarea", required: false }
  ],
  requiresApproval: true,
  estimatedDeliveryTime: 24 // horas antes do 1º dia
}
```

**O que cria automaticamente:**
- Conta de email corporativo
- Acesso aos sistemas necessários
- Ramal telefônico
- Equipamento (computador, mouse, teclado)
- Acesso físico (cartão)

---

### **2. Mudança de Departamento**

**Serviço: "Transferência Interdepartamental"**
```javascript
{
  name: "Mudança de Departamento",
  customFields: [
    { name: "departamento_atual", type: "select", required: true },
    { name: "departamento_novo", type: "select", required: true },
    { name: "data_mudanca", type: "date", required: true },
    { name: "observacoes", type: "textarea" }
  ],
  requiresApproval: true,
  defaultApproverId: "uuid-rh-manager"
}
```

**Ações automáticas:**
- Atualizar permissões de acesso
- Mover arquivos/pastas
- Atualizar organograma
- Notificar equipes envolvidas

---

### **3. Manutenção Preventiva**

**Serviço: "Agendar Manutenção de Equipamento"**
```javascript
{
  name: "Manutenção Preventiva",
  customFields: [
    { name: "tipo_equipamento", type: "select", required: true },
    { name: "numero_patrimonio", type: "text", required: true },
    { name: "problema_descricao", type: "textarea", required: false },
    { name: "data_preferencial", type: "date", required: true },
    { name: "periodo", type: "select", 
      options: [
        { value: "manha", label: "Manhã" },
        { value: "tarde", label: "Tarde" }
      ]
    }
  ],
  requiresApproval: false,
  estimatedDeliveryTime: 48
}
```

---

## 🎯 Benefícios do Sistema

### **Para o Cliente:**
✅ Interface intuitiva e organizada  
✅ Formulários guiados  
✅ Transparência no processo  
✅ Rastreamento de solicitações  
✅ Histórico de pedidos  
✅ Estimativas claras de tempo/custo  

### **Para a Organização:**
✅ Padronização de serviços  
✅ Automação de criação de tickets  
✅ Workflow de aprovações  
✅ Métricas e estatísticas  
✅ Controle de custos  
✅ Catálogo sempre atualizado  
✅ Redução de tickets mal formatados  

### **Para o Service Desk:**
✅ Tickets bem estruturados  
✅ Informações completas desde o início  
✅ SLAs apropriados aplicados  
✅ Roteamento automático  
✅ Templates prontos  
✅ Menos retrabalho  

---

## 🚀 Implementação

### **1. Backend Completo**
- ✅ Models: CatalogCategory, CatalogItem, ServiceRequest
- ✅ Controller com CRUD completo
- ✅ Validação de formulários dinâmicos
- ✅ Workflow de aprovações
- ✅ Criação automática de tickets
- ✅ Estatísticas e relatórios

### **2. Frontend Portal Cliente**
- ✅ Página de catálogo com busca e filtros
- ✅ Renderização dinâmica de formulários
- ✅ Modal de solicitação
- ✅ Integração com tickets
- ✅ Feedback visual

### **3. APIs Disponíveis**
```
GET    /api/catalog/categories
POST   /api/catalog/categories
PUT    /api/catalog/categories/:id
DELETE /api/catalog/categories/:id

GET    /api/catalog/items
GET    /api/catalog/items/:id
POST   /api/catalog/items
PUT    /api/catalog/items/:id
DELETE /api/catalog/items/:id

POST   /api/catalog/requests
GET    /api/catalog/requests
POST   /api/catalog/requests/:id/approve

GET    /api/catalog/statistics
```

---

## 📝 Próximos Passos

### **Melhorias Futuras:**
1. **Templates pré-configurados** de serviços comuns
2. **Importação/Exportação** de catálogo
3. **Versioning** de serviços
4. **Multi-idioma** no catálogo
5. **Campos condicionais** (mostrar/ocultar baseado em respostas)
6. **Cálculo automático de custos** baseado em fórmulas
7. **Notificações personalizadas** por tipo de serviço
8. **Dashboard para aprovadores** dedicado
9. **Relatórios avançados** (Excel, PDF)
10. **API pública** para integrações externas

---

## ✅ Sistema Pronto para Uso!

O Catálogo de Serviços está completamente funcional e integrado com todo o sistema TatuTicket! 🎉
