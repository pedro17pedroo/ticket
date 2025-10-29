# 🏗️ Diagramas de Arquitetura - TatuTicket

## 📋 Índice
1. [Arquitetura Geral do Sistema](#arquitetura-geral)
2. [Diagrama de Componentes](#diagrama-componentes)
3. [Fluxo de Dados](#fluxo-dados)
4. [Modelo de Base de Dados](#modelo-bd)
5. [Arquitetura de Segurança](#arquitetura-seguranca)
6. [Fluxos de Processo](#fluxos-processo)
7. [Infraestrutura e Deploy](#infraestrutura)

---

## 🌐 Arquitetura Geral do Sistema {#arquitetura-geral}

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TATUTICKET ECOSYSTEM                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           FRONTEND LAYER                               │ │
│  │                                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │ │
│  │  │   Portal Org    │  │ Portal Cliente  │  │    Desktop Agent        │ │ │
│  │  │                 │  │                 │  │                         │ │ │
│  │  │ • Dashboard     │  │ • Autoatendim.  │  │ • Inventário            │ │ │
│  │  │ • Tickets       │  │ • Meus Tickets  │  │ • Acesso Remoto         │ │ │
│  │  │ • Kanban        │  │ • Knowledge     │  │ • Notificações          │ │ │
│  │  │ • Clientes      │  │ • Histórico     │  │ • Sincronização         │ │ │
│  │  │ • Relatórios    │  │                 │  │                         │ │ │
│  │  │                 │  │                 │  │                         │ │ │
│  │  │ React + Vite    │  │ React + Vite    │  │ Electron + Node.js      │ │ │
│  │  │ Port: 5173      │  │ Port: 5174      │  │ Desktop App             │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      │ HTTP/HTTPS + WebSocket                │
│                                      │                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                            API GATEWAY LAYER                           │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    Backend API (Node.js)                       │   │ │
│  │  │                                                                 │   │ │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │   │ │
│  │  │  │   REST API  │ │  WebSocket  │ │ File Upload │ │   Auth    │ │   │ │
│  │  │  │             │ │             │ │             │ │           │ │   │ │
│  │  │  │ • 32+ Endp. │ │ • Real-time │ │ • Multer    │ │ • JWT     │ │   │ │
│  │  │  │ • Express   │ │ • Socket.io │ │ • Validation│ │ • Passport│ │   │ │
│  │  │  │ • Joi Valid.│ │ • Events    │ │ • Security  │ │ • RBAC    │ │   │ │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │   │ │
│  │  │                                                                 │   │ │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │   │ │
│  │  │  │ Middleware  │ │   Logging   │ │  Security   │ │  Modules  │ │   │ │
│  │  │  │             │ │             │ │             │ │           │ │   │ │
│  │  │  │ • Auth      │ │ • Winston   │ │ • Helmet    │ │ • Tickets │ │   │ │
│  │  │  │ • Validation│ │ • Audit     │ │ • Rate Lim. │ │ • Users   │ │   │ │
│  │  │  │ • Error     │ │ • Monitoring│ │ • CORS      │ │ • Inventory│ │   │ │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │   │ │
│  │  │                                                                 │   │ │
│  │  │                        Port: 3000                              │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      │ SQL/NoSQL/Cache                       │
│                                      │                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           DATA LAYER                                   │ │
│  │                                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │ │
│  │  │   PostgreSQL    │  │    MongoDB      │  │        Redis            │ │ │
│  │  │                 │  │                 │  │                         │ │ │
│  │  │ • Dados Princ.  │  │ • Logs          │  │ • Cache                 │ │ │
│  │  │ • Tickets       │  │ • Auditoria     │  │ • Sessões               │ │ │
│  │  │ • Users         │  │ • Monitoring    │  │ • Rate Limiting         │ │ │
│  │  │ • Organizations │  │ • Analytics     │  │ • WebSocket Sessions    │ │ │
│  │  │ • Inventory     │  │                 │  │                         │ │ │
│  │  │                 │  │                 │  │                         │ │ │
│  │  │ Port: 5432      │  │ Port: 27017     │  │ Port: 6379              │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Diagrama de Componentes {#diagrama-componentes}

### Backend Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND ARCHITECTURE                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    APPLICATION LAYER                       │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Routes    │  │ Controllers │  │     Middleware      │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • /auth     │  │ • authCtrl  │  │ • authenticate      │ │ │
│  │  │ • /tickets  │  │ • ticketCtrl│  │ • authorize         │ │ │
│  │  │ • /users    │  │ • userCtrl  │  │ • validate          │ │ │
│  │  │ • /inventory│  │ • invCtrl   │  │ • errorHandler      │ │ │
│  │  │ • /upload   │  │ • uploadCtrl│  │ • auditLogger       │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    BUSINESS LAYER                          │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │  Services   │  │   Models    │  │     Validators      │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • emailSvc  │  │ • User      │  │ • authSchema        │ │ │
│  │  │ • notifSvc  │  │ • Ticket    │  │ • ticketSchema      │ │ │
│  │  │ • auditSvc  │  │ • Org       │  │ • userSchema        │ │ │
│  │  │ • socketSvc │  │ • Asset     │  │ • uploadSchema      │ │ │
│  │  │ • invSvc    │  │ • Comment   │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     DATA LAYER                             │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ PostgreSQL  │  │  MongoDB    │  │       Redis         │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • Sequelize │  │ • Mongoose  │  │ • ioredis           │ │ │
│  │  │ • Relations │  │ • Collections│  │ • Sessions          │ │ │
│  │  │ • Migrations│  │ • Indexes   │  │ • Cache             │ │ │
│  │  │ • Seeds     │  │ • Aggreg.   │  │ • PubSub            │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Components (Portal Organização)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND ARCHITECTURE                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    PRESENTATION LAYER                      │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │    Pages    │  │ Components  │  │       Layout        │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • Dashboard │  │ • Header    │  │ • Sidebar           │ │ │
│  │  │ • Tickets   │  │ • Sidebar   │  │ • Main Content      │ │ │
│  │  │ • TicketDet │  │ • Modal     │  │ • Footer            │ │ │
│  │  │ • Kanban    │  │ • Form      │  │ • Theme Provider    │ │ │
│  │  │ • Clients   │  │ • Table     │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    BUSINESS LAYER                          │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Stores    │  │  Services   │  │      Contexts       │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • authStore │  │ • api.js    │  │ • SocketContext     │ │ │
│  │  │ • themeStore│  │ • invSvc    │  │ • NotifContext      │ │ │
│  │  │ • userStore │  │ • exportSvc │  │ • ThemeContext      │ │ │
│  │  │             │  │ • socketSvc │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     UTILS LAYER                            │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │    Utils    │  │   Hooks     │  │      Constants      │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • alerts    │  │ • useAuth   │  │ • API_ENDPOINTS     │ │ │
│  │  │ • export    │  │ • useSocket │  │ • ROLES             │ │ │
│  │  │ • format    │  │ • useNotif  │  │ • STATUS            │ │ │
│  │  │ • inventory │  │ • useTheme  │  │ • PRIORITIES        │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados {#fluxo-dados}

### Fluxo de Autenticação

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Cliente   │    │  Frontend   │    │   Backend   │    │ Base Dados  │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ 1. Login Form    │                  │                  │
       ├─────────────────►│                  │                  │
       │                  │ 2. POST /auth/   │                  │
       │                  │    login         │                  │
       │                  ├─────────────────►│                  │
       │                  │                  │ 3. Validate      │
       │                  │                  │    Credentials   │
       │                  │                  ├─────────────────►│
       │                  │                  │ 4. User Data     │
       │                  │                  │◄─────────────────┤
       │                  │ 5. JWT Token +   │                  │
       │                  │    User Data     │                  │
       │                  │◄─────────────────┤                  │
       │ 6. Store Token   │                  │                  │
       │    & Redirect    │                  │                  │
       │◄─────────────────┤                  │                  │
       │                  │ 7. WebSocket     │                  │
       │                  │    Connect       │                  │
       │                  ├─────────────────►│                  │
       │                  │ 8. Real-time     │                  │
       │                  │    Connection    │                  │
       │                  │◄─────────────────┤                  │
```

### Fluxo de Criação de Ticket

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Cliente   │    │  Frontend   │    │   Backend   │    │ Base Dados  │    │   Email     │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │                  │
       │ 1. New Ticket    │                  │                  │                  │
       │    Form          │                  │                  │                  │
       ├─────────────────►│                  │                  │                  │
       │                  │ 2. POST /tickets │                  │                  │
       │                  ├─────────────────►│                  │                  │
       │                  │                  │ 3. Validate      │                  │
       │                  │                  │    Data          │                  │
       │                  │                  │                  │                  │
       │                  │                  │ 4. Save Ticket   │                  │
       │                  │                  ├─────────────────►│                  │
       │                  │                  │ 5. Auto-assign   │                  │
       │                  │                  │    Agent         │                  │
       │                  │                  ├─────────────────►│                  │
       │                  │                  │ 6. Create Audit  │                  │
       │                  │                  │    Log           │                  │
       │                  │                  ├─────────────────►│                  │
       │                  │ 7. Ticket Data   │                  │                  │
       │                  │◄─────────────────┤                  │                  │
       │ 8. Success       │                  │                  │                  │
       │    Message       │                  │                  │                  │
       │◄─────────────────┤                  │                  │                  │
       │                  │                  │ 9. Send Email    │                  │
       │                  │                  │    Notification  │                  │
       │                  │                  ├─────────────────────────────────────►│
       │                  │                  │ 10. WebSocket    │                  │
       │                  │                  │     Broadcast    │                  │
       │                  │◄─────────────────┤                  │                  │
       │ 11. Real-time    │                  │                  │                  │
       │     Update       │                  │                  │                  │
       │◄─────────────────┤                  │                  │                  │
```

### Fluxo de Inventário (Desktop Agent)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Desktop Agent│    │   Backend   │    │ Base Dados  │    │  Dashboard  │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ 1. Start Agent   │                  │                  │
       │                  │                  │                  │
       │ 2. WebSocket     │                  │                  │
       │    Connect       │                  │                  │
       ├─────────────────►│                  │                  │
       │ 3. Authenticate  │                  │                  │
       │    with Token    │                  │                  │
       ├─────────────────►│                  │                  │
       │                  │                  │                  │
       │ 4. Collect       │                  │                  │
       │    System Info   │                  │                  │
       │                  │                  │                  │
       │ 5. POST /assets  │                  │                  │
       │    inventory     │                  │                  │
       ├─────────────────►│                  │                  │
       │                  │ 6. Save/Update   │                  │
       │                  │    Asset Data    │                  │
       │                  ├─────────────────►│                  │
       │                  │ 7. Broadcast     │                  │
       │                  │    Update        │                  │
       │                  ├─────────────────────────────────────►│
       │ 8. Schedule      │                  │                  │
       │    Next Sync     │                  │                  │
       │                  │                  │                  │
       │ ... (repeat every 30 min) ...       │                  │
```

---

## 🗄️ Modelo de Base de Dados {#modelo-bd}

### PostgreSQL - Dados Principais

```sql
-- Diagrama Entidade-Relacionamento Simplificado

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Organizations  │     │      Users      │     │   Departments   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (UUID) PK    │────►│ organizationId  │     │ id (UUID) PK    │
│ name            │     │ id (UUID) PK    │     │ organizationId  │
│ slug            │     │ name            │     │ name            │
│ logo            │     │ email           │     │ description     │
│ primaryColor    │     │ password        │     │ isActive        │
│ secondaryColor  │     │ role            │     └─────────────────┘
│ settings        │     │ isActive        │              │
│ createdAt       │     │ lastLogin       │              │
│ updatedAt       │     │ createdAt       │              │
└─────────────────┘     │ updatedAt       │              │
                        └─────────────────┘              │
                                 │                       │
                                 │                       │
┌─────────────────┐              │              ┌─────────────────┐
│   Categories    │              │              │     Tickets     │
├─────────────────┤              │              ├─────────────────┤
│ id (UUID) PK    │              │              │ id (UUID) PK    │
│ organizationId  │              │              │ organizationId  │
│ departmentId    │◄─────────────┼──────────────┤ departmentId    │
│ name            │              │              │ categoryId      │
│ description     │              │              │ requesterId     │◄──┐
│ color           │              │              │ assigneeId      │◄──┤
│ isActive        │              │              │ subject         │   │
└─────────────────┘              │              │ description     │   │
                                 │              │ status          │   │
┌─────────────────┐              │              │ priority        │   │
│      SLAs       │              │              │ createdAt       │   │
├─────────────────┤              │              │ updatedAt       │   │
│ id (UUID) PK    │              │              │ resolvedAt      │   │
│ organizationId  │              │              │ closedAt        │   │
│ name            │              │              └─────────────────┘   │
│ responseTime    │              │                       │            │
│ resolutionTime  │              │                       │            │
│ isActive        │              │                       │            │
└─────────────────┘              │                       │            │
                                 │                       │            │
┌─────────────────┐              │              ┌─────────────────┐   │
│    Comments     │              │              │   Attachments   │   │
├─────────────────┤              │              ├─────────────────┤   │
│ id (UUID) PK    │              │              │ id (UUID) PK    │   │
│ ticketId        │◄─────────────┼──────────────┤ ticketId        │   │
│ userId          │◄─────────────┘              │ filename        │   │
│ message         │                             │ originalName    │   │
│ isInternal      │                             │ mimeType        │   │
│ createdAt       │                             │ size            │   │
│ updatedAt       │                             │ path            │   │
└─────────────────┘                             │ uploadedBy      │◄──┘
                                                │ createdAt       │
                                                └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   HoursBank     │     │HoursTransaction │     │     Assets      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (UUID) PK    │────►│ hoursBankId     │     │ id (UUID) PK    │
│ organizationId  │     │ id (UUID) PK    │     │ organizationId  │
│ name            │     │ type            │     │ name            │
│ description     │     │ hours           │     │ type            │
│ totalHours      │     │ description     │     │ serialNumber    │
│ usedHours       │     │ userId          │     │ manufacturer    │
│ isActive        │     │ createdAt       │     │ model           │
│ createdAt       │     └─────────────────┘     │ location        │
│ updatedAt       │                             │ status          │
└─────────────────┘                             │ lastSeen        │
                                                │ agentId         │
                                                │ specifications  │
                                                │ createdAt       │
                                                │ updatedAt       │
                                                └─────────────────┘
```

### MongoDB - Logs e Auditoria

```javascript
// Collection: audit_logs
{
  _id: ObjectId("..."),
  userId: "uuid-user-id",
  organizationId: "uuid-org-id",
  action: "CREATE|UPDATE|DELETE|LOGIN|LOGOUT",
  resource: "ticket|user|comment|attachment",
  resourceId: "uuid-resource-id",
  changes: {
    before: { ... },  // Estado anterior
    after: { ... }    // Estado novo
  },
  metadata: {
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0...",
    sessionId: "session-uuid"
  },
  timestamp: ISODate("2025-10-26T10:30:00Z")
}

// Collection: system_logs
{
  _id: ObjectId("..."),
  level: "info|warn|error|debug",
  message: "Log message",
  service: "api|socket|email|inventory",
  module: "auth|tickets|users",
  data: { ... },
  timestamp: ISODate("2025-10-26T10:30:00Z")
}

// Collection: performance_metrics
{
  _id: ObjectId("..."),
  endpoint: "/api/tickets",
  method: "GET|POST|PUT|DELETE",
  responseTime: 150,  // milliseconds
  statusCode: 200,
  userId: "uuid-user-id",
  timestamp: ISODate("2025-10-26T10:30:00Z")
}
```

### Redis - Cache e Sessões

```
// Estrutura de Chaves Redis

// Sessões de usuário
user:session:{userId} → {
  token: "jwt-token",
  lastActivity: timestamp,
  ipAddress: "192.168.1.100"
}

// Cache de dados
cache:tickets:{orgId}:{filters} → JSON array
cache:users:{orgId} → JSON array
cache:stats:{orgId}:{period} → JSON object

// Rate limiting
rate_limit:{ip}:{endpoint} → counter (TTL: 15min)

// WebSocket sessions
socket:user:{userId} → socket_id
socket:org:{orgId} → [socket_ids]

// Temporary data
temp:upload:{uploadId} → file_metadata (TTL: 1h)
temp:reset:{token} → user_id (TTL: 30min)
```

---

## 🔐 Arquitetura de Segurança {#arquitetura-seguranca}

### Camadas de Segurança

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    NETWORK LAYER                           │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Firewall  │  │    HTTPS    │  │      CORS           │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • Port      │  │ • TLS 1.3   │  │ • Origin Control    │ │ │
│  │  │   Filtering │  │ • Cert      │  │ • Method Control    │ │ │
│  │  │ • IP        │  │   Validation│  │ • Header Control    │ │ │
│  │  │   Whitelist │  │ • HSTS      │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 APPLICATION LAYER                          │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Helmet    │  │Rate Limiting│  │   Input Validation  │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • XSS       │  │ • 100 req/  │  │ • Joi Schemas       │ │ │
│  │  │   Protection│  │   15min     │  │ • SQL Injection     │ │ │
│  │  │ • CSRF      │  │ • Per IP    │  │ • XSS Prevention    │ │ │
│  │  │ • Clickjack │  │ • Per User  │  │ • File Upload       │ │ │
│  │  │ • MIME Sniff│  │             │  │   Validation        │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                AUTHENTICATION LAYER                        │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │     JWT     │  │   Passport  │  │       RBAC          │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • HS256     │  │ • Local     │  │ • admin-org         │ │ │
│  │  │ • 24h TTL   │  │   Strategy  │  │ • agente            │ │ │
│  │  │ • Refresh   │  │ • JWT       │  │ • cliente-org       │ │ │
│  │  │   Token     │  │   Strategy  │  │ • Resource Access   │ │ │
│  │  │ • Blacklist │  │             │  │ • Organization      │ │ │
│  │  │             │  │             │  │   Isolation         │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     DATA LAYER                             │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │  Encryption │  │   Hashing   │  │      Audit          │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • Bcrypt    │  │ • Passwords │  │ • All Actions       │ │ │
│  │  │   (12 salt) │  │ • Sensitive │  │ • IP Tracking       │ │ │
│  │  │ • File      │  │   Data      │  │ • Change History    │ │ │
│  │  │   Encryption│  │ • SHA-256   │  │ • Compliance        │ │ │
│  │  │ • DB        │  │             │  │                     │ │ │
│  │  │   Encryption│  │             │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Autorização

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Request   │    │    Auth     │    │    RBAC     │    │  Resource   │
│             │    │ Middleware  │    │  Middleware │    │   Access    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ 1. HTTP Request  │                  │                  │
       │    with Token    │                  │                  │
       ├─────────────────►│                  │                  │
       │                  │ 2. Validate JWT  │                  │
       │                  │    Token         │                  │
       │                  │                  │                  │
       │                  │ 3. Extract User  │                  │
       │                  │    & Role        │                  │
       │                  │                  │                  │
       │                  │ 4. Check Role    │                  │
       │                  │    Permissions   │                  │
       │                  ├─────────────────►│                  │
       │                  │                  │ 5. Validate      │
       │                  │                  │    Resource      │
       │                  │                  │    Access        │
       │                  │                  │                  │
       │                  │                  │ 6. Check Org     │
       │                  │                  │    Isolation     │
       │                  │                  │                  │
       │                  │ 7. Access        │                  │
       │                  │    Granted       │                  │
       │                  │◄─────────────────┤                  │
       │ 8. Proceed to    │                  │                  │
       │    Controller    │                  │                  │
       │◄─────────────────┤                  │                  │
       │                  │                  │                  │
       │                  │                  │ 9. Log Access    │
       │                  │                  │    Attempt       │
       │                  │                  ├─────────────────►│
```

---

## 🔄 Fluxos de Processo {#fluxos-processo}

### Processo de Gestão de Tickets

```
┌─────────────────────────────────────────────────────────────────┐
│                    TICKET LIFECYCLE                             │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │    NOVO     │───►│ EM PROGRESSO│───►│   AGUARDANDO        │ │
│  │             │    │             │    │    CLIENTE          │ │
│  │ • Criado    │    │ • Atribuído │    │                     │ │
│  │ • Validado  │    │ • Em análise│    │ • Info adicional    │ │
│  │ • Atribuído │    │ • Trabalhando│    │ • Aprovação         │ │
│  └─────────────┘    └─────────────┘    │ • Teste             │ │
│         │                   │          └─────────────────────┘ │
│         │                   │                     │            │
│         │                   │                     │            │
│         │                   │          ┌─────────────────────┐ │
│         │                   │          │     RESOLVIDO       │ │
│         │                   │          │                     │ │
│         │                   └─────────►│ • Solução impl.     │ │
│         │                              │ • Aguarda confirm.  │ │
│         │                              │ • Teste realizado   │ │
│         │                              └─────────────────────┘ │
│         │                                         │            │
│         │                                         │            │
│         │                              ┌─────────────────────┐ │
│         │                              │      FECHADO        │ │
│         │                              │                     │ │
│         │                              │ • Confirmado        │ │
│         │                              │ • Satisfação        │ │
│         │                              │ • Arquivado         │ │
│         │                              └─────────────────────┘ │
│         │                                                      │
│         │                              ┌─────────────────────┐ │
│         └─────────────────────────────►│    CANCELADO        │ │
│                                        │                     │ │
│                                        │ • Duplicado         │ │
│                                        │ • Inválido          │ │
│                                        │ • Não aplicável     │ │
│                                        └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Processo de Notificações

```
┌─────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION FLOW                             │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   TRIGGER   │    │  PROCESSOR  │    │     DELIVERY        │ │
│  │             │    │             │    │                     │ │
│  │ • New Ticket│───►│ • Determine │───►│ • Email             │ │
│  │ • Comment   │    │   Recipients│    │ • WebSocket         │ │
│  │ • Status    │    │ • Template  │    │ • In-App            │ │
│  │   Change    │    │   Selection │    │ • Desktop           │ │
│  │ • Assignment│    │ • Content   │    │                     │ │
│  │ • SLA Alert │    │   Generation│    │                     │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│         │                   │                     │            │
│         │                   │                     │            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   RULES     │    │ TEMPLATES   │    │      TRACKING       │ │
│  │             │    │             │    │                     │ │
│  │ • Role-based│    │ • HTML      │    │ • Delivery Status   │ │
│  │ • Org-based │    │ • Plain Text│    │ • Read Receipts     │ │
│  │ • Preference│    │ • Multi-lang│    │ • Error Handling    │ │
│  │ • Frequency │    │ • Dynamic   │    │ • Retry Logic       │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Infraestrutura e Deploy {#infraestrutura}

### Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT ARCHITECTURE                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    PRODUCTION TIER                         │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │Load Balancer│  │   Nginx     │  │      SSL/TLS        │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • HAProxy   │  │ • Reverse   │  │ • Let's Encrypt     │ │ │
│  │  │ • Round     │  │   Proxy     │  │ • Auto Renewal      │ │ │
│  │  │   Robin     │  │ • Static    │  │ • HTTPS Redirect    │ │ │
│  │  │ • Health    │  │   Files     │  │                     │ │ │
│  │  │   Check     │  │ • Gzip      │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   APPLICATION TIER                         │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ Backend API │  │Portal Org   │  │   Portal Client     │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • Node.js   │  │ • React     │  │ • React             │ │ │
│  │  │ • PM2       │  │ • Nginx     │  │ • Nginx             │ │ │
│  │  │ • Cluster   │  │ • Static    │  │ • Static            │ │ │
│  │  │ • Auto      │  │ • CDN       │  │ • CDN               │ │ │
│  │  │   Restart   │  │             │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     DATA TIER                              │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ PostgreSQL  │  │  MongoDB    │  │       Redis         │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • Master/   │  │ • Replica   │  │ • Cluster           │ │ │
│  │  │   Slave     │  │   Set       │  │ • Persistence       │ │ │
│  │  │ • Backup    │  │ • Sharding  │  │ • High Availability │ │ │
│  │  │ • WAL       │  │ • Backup    │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   MONITORING TIER                          │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ Prometheus  │  │   Grafana   │  │      Alerting       │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • Metrics   │  │ • Dashboard │  │ • Email             │ │ │
│  │  │ • Alerts    │  │ • Graphs    │  │ • Slack             │ │ │
│  │  │ • Retention │  │ • Reports   │  │ • PagerDuty         │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Docker Compose - Desenvolvimento

```yaml
# Estrutura do docker-compose.yml atual

version: '3.8'

services:
  # Base de Dados
  postgres:     # PostgreSQL 15 - Dados principais
  mongodb:      # MongoDB 7 - Logs e auditoria  
  redis:        # Redis 7 - Cache e sessões

  # Aplicações
  backend:      # Node.js API - Port 3000
  portal-org:   # React Portal Org - Port 8080
  portal-client: # React Portal Client - Port 8081

volumes:
  postgres_data:
  mongodb_data:
  redis_data:

networks:
  tatuticket-network:
```

### CI/CD Pipeline (Planeado)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CI/CD PIPELINE                           │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   SOURCE    │    │    BUILD    │    │        TEST         │ │
│  │             │    │             │    │                     │ │
│  │ • Git Push  │───►│ • npm ci    │───►│ • Unit Tests        │ │
│  │ • PR Create │    │ • Docker    │    │ • Integration       │ │
│  │ • Tag       │    │   Build     │    │ • E2E Tests         │ │
│  │             │    │ • Lint      │    │ • Security Scan     │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                  │              │
│                                                  │              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   DEPLOY    │    │   STAGING   │    │     PRODUCTION      │ │
│  │             │    │             │    │                     │ │
│  │ • Registry  │◄───│ • Auto      │◄───│ • Manual Approval   │ │
│  │   Push      │    │   Deploy    │    │ • Blue/Green        │ │
│  │ • Helm      │    │ • Smoke     │    │ • Health Check      │ │
│  │   Charts    │    │   Tests     │    │ • Rollback Ready    │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Resumo dos Diagramas

Este documento apresenta a arquitetura completa do sistema TatuTicket através de diagramas detalhados que cobrem:

1. **Arquitetura Geral** - Visão macro do ecossistema
2. **Componentes** - Estrutura interna de cada camada
3. **Fluxo de Dados** - Como a informação circula
4. **Modelo de BD** - Estrutura das bases de dados
5. **Segurança** - Camadas de proteção implementadas
6. **Processos** - Fluxos de trabalho principais
7. **Infraestrutura** - Arquitetura de deploy e CI/CD

Estes diagramas servem como referência técnica para:
- **Desenvolvimento** - Compreender a estrutura do código
- **Deploy** - Configurar ambientes de produção
- **Manutenção** - Identificar componentes e dependências
- **Escalabilidade** - Planear expansões futuras
- **Documentação** - Onboarding de novos desenvolvedores

---

**Documento gerado em**: Outubro 2025  
**Versão**: 1.0  
**Autor**: Equipa Técnica TatuTicket