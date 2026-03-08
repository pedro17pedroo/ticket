# API Documentation: Multi-Organization Context Switching

## Overview

Esta documentação descreve os endpoints da API para o sistema de troca de contexto multi-organização, que permite que usuários com o mesmo email trabalhem em múltiplas organizações e empresas clientes com diferentes roles e permissões.

## Authentication

Todos os endpoints protegidos requerem um token JWT no header:
```
Authorization: Bearer <token>
```

O token contém informações de contexto:
- `contextId`: ID da organização ou cliente
- `contextType`: 'organization' ou 'client'
- `sessionId`: ID da sessão ativa
- `organizationId`: ID da organização
- `clientId`: ID do cliente (se aplicável)
- `role`: Role do usuário no contexto
- `permissions`: Array de permissões

## Endpoints

### POST /auth/login

Autentica usuário e retorna contextos disponíveis.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "portalType": "organization" // opcional: "organization", "client", "provider"
}
```

**Response (múltiplos contextos):**
```json
{
  "requiresContextSelection": true,
  "contexts": [
    {
      "id": "uuid",
      "type": "organization",
      "userType": "organization",
      "contextId": "org-uuid",
      "contextType": "organization",
      "organizationId": "org-uuid",
      "organizationName": "Empresa A",
      "organizationSlug": "empresa-a",
      "clientId": null,
      "clientName": null,
      "name": "João Silva",
      "email": "user@example.com",
      "role": "org-admin",
      "avatar": "https://...",
      "isLastUsed": true,
      "isPreferred": false
    },
    {
      "id": "uuid",
      "type": "client",
      "userType": "client",
      "contextId": "client-uuid",
      "contextType": "client",
      "organizationId": "org-uuid",
      "organizationName": "Empresa B",
      "clientId": "client-uuid",
      "clientName": "Cliente X",
      "name": "João Silva",
      "email": "user@example.com",
      "role": "client-admin",
      "avatar": "https://...",
      "isLastUsed": false,
      "isPreferred": true
    }
  ]
}
```

**Response (único contexto):**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva",
    "role": "org-admin",
    "avatar": "https://...",
    "userType": "organization",
    "permissions": []
  },
  "context": {
    "id": "org-uuid",
    "type": "organization",
    "organizationId": "org-uuid",
    "organizationName": "Empresa A",
    "clientId": null,
    "clientName": null,
    "sessionId": "session-uuid"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Credenciais inválidas
- `403 Forbidden`: Sem permissão para acessar o portal especificado

---

### POST /auth/select-context

Seleciona um contexto específico após login com múltiplos contextos.

**Authentication:** Não requerida (usa email/password)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "contextId": "org-uuid",
  "contextType": "organization" // "organization" ou "client"
}
```

**Response:**
```json
{
  "message": "Contexto selecionado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva",
    "role": "org-admin",
    "avatar": "https://...",
    "userType": "organization",
    "permissions": []
  },
  "context": {
    "id": "org-uuid",
    "type": "organization",
    "organizationId": "org-uuid",
    "organizationName": "Empresa A",
    "clientId": null,
    "clientName": null,
    "sessionId": "session-uuid"
  }
}
```

**Side Effects:**
- Cria sessão de contexto
- Armazena como contexto preferido do usuário
- Registra seleção no audit log

**Error Responses:**
- `400 Bad Request`: Parâmetros obrigatórios ausentes ou tipo de contexto inválido
- `401 Unauthorized`: Credenciais inválidas
- `403 Forbidden`: Sem permissão para acessar o contexto

---

### POST /auth/switch-context

Troca de contexto durante sessão ativa sem logout.

**Authentication:** Requerida

**Request:**
```json
{
  "contextId": "client-uuid",
  "contextType": "client" // "organization" ou "client"
}
```

**Response:**
```json
{
  "message": "Contexto alterado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva",
    "role": "client-admin",
    "avatar": "https://...",
    "userType": "client",
    "permissions": []
  },
  "context": {
    "id": "client-uuid",
    "type": "client",
    "organizationId": "org-uuid",
    "organizationName": "Empresa B",
    "clientId": "client-uuid",
    "clientName": "Cliente X",
    "sessionId": "new-session-uuid"
  }
}
```

**Side Effects:**
- Invalida sessão anterior
- Cria nova sessão com novo contexto
- Registra troca no audit log
- Atualiza último login

**Error Responses:**
- `400 Bad Request`: Parâmetros obrigatórios ausentes ou tipo de contexto inválido
- `401 Unauthorized`: Token inválido ou sessão expirada
- `403 Forbidden`: Sem permissão para acessar o contexto

---

### GET /auth/contexts

Lista todos os contextos disponíveis para o usuário autenticado.

**Authentication:** Requerida

**Response:**
```json
{
  "contexts": [
    {
      "id": "uuid",
      "type": "organization",
      "userType": "organization",
      "contextId": "org-uuid",
      "contextType": "organization",
      "organizationId": "org-uuid",
      "organizationName": "Empresa A",
      "clientId": null,
      "clientName": null,
      "name": "João Silva",
      "email": "user@example.com",
      "role": "org-admin",
      "avatar": "https://...",
      "isLastUsed": true
    }
  ],
  "currentContext": {
    "contextId": "org-uuid",
    "contextType": "organization"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Token inválido ou sessão expirada

---

### GET /auth/contexts/history

Retorna histórico de trocas de contexto do usuário autenticado.

**Authentication:** Requerida

**Query Parameters:**
- `action` (opcional): Filtrar por ação ('login', 'context_switch', 'logout')
- `startDate` (opcional): Data inicial (ISO 8601)
- `endDate` (opcional): Data final (ISO 8601)
- `limit` (opcional): Número de registros (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Example Request:**
```
GET /auth/contexts/history?action=context_switch&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "userEmail": "user@example.com",
      "userType": "organization",
      "action": "context_switch",
      "fromContextId": "org-uuid-1",
      "fromContextType": "organization",
      "toContextId": "client-uuid",
      "toContextType": "client",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "success": true,
      "errorMessage": null,
      "createdAt": "2024-01-22T10:30:00.000Z"
    }
  ],
  "total": 45,
  "hasMore": true,
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Token inválido ou sessão expirada

---

### GET /auth/contexts/audit

Retorna logs de auditoria de contexto (apenas para administradores).

**Authentication:** Requerida (org-admin, super-admin, provider-admin)

**Query Parameters:**
- `email` (opcional): Filtrar por email do usuário
- `action` (opcional): Filtrar por ação ('login', 'context_switch', 'logout')
- `startDate` (opcional): Data inicial (ISO 8601)
- `endDate` (opcional): Data final (ISO 8601)
- `limit` (opcional): Número de registros (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Example Request:**
```
GET /auth/contexts/audit?email=user@example.com&startDate=2024-01-01&limit=50
```

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "userEmail": "user@example.com",
      "userType": "organization",
      "action": "login",
      "fromContextId": null,
      "fromContextType": null,
      "toContextId": "org-uuid",
      "toContextType": "organization",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "success": true,
      "errorMessage": null,
      "createdAt": "2024-01-22T10:30:00.000Z"
    }
  ],
  "total": 120,
  "hasMore": true,
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Token inválido ou sessão expirada
- `403 Forbidden`: Usuário não é administrador

---

## Session Management

### Session Expiration

Sessões expiram após 8 horas de inatividade. Quando uma sessão expira:

1. Backend retorna `401 Unauthorized` com mensagem "Sessão expirada"
2. Frontend detecta o erro e:
   - Remove token do localStorage
   - Redireciona para página de login
   - Exibe mensagem: "Sua sessão expirou. Por favor, faça login novamente."

### Session Cleanup

Um job automático executa a cada hora para limpar sessões expiradas do banco de dados.

### Activity Tracking

Cada requisição autenticada atualiza o campo `lastActivityAt` da sessão, estendendo efetivamente a expiração.

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Título do erro",
  "message": "Descrição detalhada do erro",
  "details": "Informações adicionais (opcional)"
}
```

### Common HTTP Status Codes

- `200 OK`: Requisição bem-sucedida
- `400 Bad Request`: Parâmetros inválidos ou ausentes
- `401 Unauthorized`: Token inválido, expirado ou credenciais incorretas
- `403 Forbidden`: Sem permissão para acessar o recurso
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

---

## Context Validation Middleware

Rotas protegidas utilizam middleware de validação de contexto:

1. `authenticate`: Valida token JWT
2. `validateContext`: Verifica se sessão está ativa e não expirou
3. `injectContext`: Adiciona informações de contexto em `req.context`

Exemplo de `req.context`:
```javascript
{
  sessionId: "session-uuid",
  contextId: "org-uuid",
  contextType: "organization",
  organizationId: "org-uuid",
  clientId: null,
  role: "org-admin",
  permissions: [],
  userId: "user-uuid",
  userEmail: "user@example.com",
  userName: "João Silva",
  userType: "organization"
}
```

---

## Best Practices

### Frontend Implementation

1. **Store token securely**: Use localStorage ou sessionStorage
2. **Handle 401 errors globally**: Implement axios interceptor
3. **Refresh context on switch**: Reload page or refetch data after context switch
4. **Show loading states**: Display loading indicator during context operations
5. **Handle cross-portal redirects**: Redirect to appropriate portal based on contextType

### Backend Implementation

1. **Always validate context**: Use middleware on protected routes
2. **Log all context operations**: Use audit log for security
3. **Validate resource access**: Ensure resources belong to active context
4. **Handle errors gracefully**: Return appropriate status codes and messages
5. **Clean up expired sessions**: Run cleanup job regularly

---

## Security Considerations

1. **Session tokens are unique**: Each session has a unique token
2. **Sessions expire**: 8-hour expiration with activity tracking
3. **Audit logging**: All context operations are logged with IP and User Agent
4. **Permission isolation**: Permissions are loaded per context
5. **Resource validation**: Resources are validated against active context
6. **Password validation**: Password is validated on context selection
7. **Cross-context protection**: Users cannot access resources from other contexts

---

## Examples

### Complete Login Flow (Multiple Contexts)

```javascript
// 1. Login
const loginResponse = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'senha123',
  portalType: 'organization'
});

if (loginResponse.data.requiresContextSelection) {
  // 2. Show context selector
  const contexts = loginResponse.data.contexts;
  
  // 3. User selects context
  const selectedContext = contexts[0];
  
  // 4. Select context
  const selectResponse = await api.post('/auth/select-context', {
    email: 'user@example.com',
    password: 'senha123',
    contextId: selectedContext.contextId,
    contextType: selectedContext.contextType
  });
  
  // 5. Store token and redirect
  localStorage.setItem('token', selectResponse.data.token);
  window.location.href = '/dashboard';
} else {
  // Single context - auto-login
  localStorage.setItem('token', loginResponse.data.token);
  window.location.href = '/dashboard';
}
```

### Context Switch During Session

```javascript
// 1. Get available contexts
const contextsResponse = await api.get('/auth/contexts');
const contexts = contextsResponse.data.contexts;

// 2. User selects new context
const newContext = contexts[1];

// 3. Switch context
const switchResponse = await api.post('/auth/switch-context', {
  contextId: newContext.contextId,
  contextType: newContext.contextType
});

// 4. Update token
localStorage.setItem('token', switchResponse.data.token);

// 5. Redirect if cross-portal
if (newContext.contextType === 'client') {
  window.location.href = 'http://localhost:5174/dashboard'; // Portal Cliente
} else {
  window.location.reload(); // Reload current portal
}
```

### Get Context History

```javascript
// Get last 20 context switches
const historyResponse = await api.get('/auth/contexts/history', {
  params: {
    action: 'context_switch',
    limit: 20,
    offset: 0
  }
});

console.log('History:', historyResponse.data.history);
console.log('Total:', historyResponse.data.total);
```

---

## Changelog

### Version 1.0.0 (2024-01-22)
- Initial implementation of multi-organization context switching
- Login with multiple contexts
- Context selection and switching
- Session management with expiration
- Audit logging
- Preferred context storage
- Context history and audit endpoints
