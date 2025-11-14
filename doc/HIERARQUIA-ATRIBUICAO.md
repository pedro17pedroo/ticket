# Sistema Hierárquico de Atribuição de Tickets

## Estrutura Organizacional

```
Organização
 ├── Direção 1
 │   ├── Departamento 1.1
 │   │   ├── Seção 1.1.1
 │   │   └── Seção 1.1.2
 │   └── Departamento 1.2
 ├── Direção 2
 │   └── Departamento 2.1
 │       └── Seção 2.1.1
 └── ...
```

## Roles e Permissões

### 1. Super Admin / Admin da Organização
**Permissões de Atribuição:**
- ✅ Pode atribuir tickets para **qualquer usuário** da organização
- ✅ Pode cadastrar usuários em **qualquer nível** (Direção, Departamento, Seção)
- ✅ Pode definir responsáveis de Direção, Departamento ou Seção

**Permissões de Cadastro:**
- Pode criar usuários e atribuir a qualquer:
  - Direção
  - Departamento
  - Seção

---

### 2. Responsável de Direção
**Permissões de Atribuição:**
- ✅ Pode atribuir tickets para usuários de **sua Direção**
- ✅ Pode atribuir para usuários de **qualquer Departamento** de sua Direção
- ✅ Pode atribuir para usuários de **qualquer Seção** de sua Direção
- ❌ **NÃO** pode atribuir para usuários de outras Direções

**Permissões de Cadastro:**
- Pode criar usuários e atribuir a:
  - Sua própria Direção
  - Departamentos de sua Direção
  - Seções de sua Direção
- Pode definir Responsáveis de:
  - Departamentos de sua Direção
  - Seções de sua Direção

**Exemplo:**
```
Responsável da Direção "TI":
✅ Pode atribuir para: Infraestrutura, Desenvolvimento, Suporte (departamentos de TI)
✅ Pode atribuir para: Redes, Servidores (seções de Infraestrutura)
❌ NÃO pode atribuir para: RH, Financeiro (outras direções)
```

---

### 3. Responsável de Departamento
**Permissões de Atribuição:**
- ✅ Pode atribuir tickets para usuários de **seu Departamento**
- ✅ Pode atribuir para usuários de **qualquer Seção** de seu Departamento
- ❌ **NÃO** pode atribuir para usuários de outros Departamentos

**Permissões de Cadastro:**
- Pode criar usuários e atribuir a:
  - Seu próprio Departamento
  - Seções de seu Departamento
- Pode definir Responsáveis de:
  - Seções de seu Departamento

**Exemplo:**
```
Responsável do Departamento "Infraestrutura" (de TI):
✅ Pode atribuir para: Redes, Servidores, Storage (seções de Infraestrutura)
❌ NÃO pode atribuir para: Desenvolvimento, Suporte (outros departamentos)
```

---

### 4. Responsável de Seção
**Permissões de Atribuição:**
- ✅ Pode atribuir tickets para usuários de **sua Seção**
- ❌ **NÃO** pode atribuir para usuários de outras Seções

**Permissões de Cadastro:**
- Pode criar usuários e atribuir a:
  - Sua própria Seção apenas

**Exemplo:**
```
Responsável da Seção "Redes" (de Infraestrutura > TI):
✅ Pode atribuir para: João, Maria (usuários da seção Redes)
❌ NÃO pode atribuir para: Servidores, Storage (outras seções)
```

---

### 5. Agente
**Permissões de Atribuição:**
- ✅ Pode atribuir tickets **apenas para si mesmo**
- ❌ **NÃO** pode atribuir para outros usuários

**Permissões de Cadastro:**
- ❌ **NÃO** pode cadastrar usuários

---

## Implementação Técnica

### Frontend - Filtro de Usuários
```javascript
const filterUsersByHierarchy = (users) => {
  // Apenas agentes e admins podem ser atribuídos
  let agentsAndAdmins = users.filter(u => 
    u.role === 'agente' || u.role === 'admin-org' || u.role === 'super-admin'
  );

  // Admin pode atribuir para qualquer um
  if (user.role === 'super-admin' || user.role === 'admin-org') {
    return agentsAndAdmins;
  }

  // Responsável de Direção
  if (user.role === 'resp-direcao' && user.directionId) {
    return agentsAndAdmins.filter(u => {
      if (u.directionId === user.directionId) return true;
      if (u.department?.directionId === user.directionId) return true;
      if (u.section?.department?.directionId === user.directionId) return true;
      return false;
    });
  }

  // Responsável de Departamento
  if (user.role === 'resp-departamento' && user.departmentId) {
    return agentsAndAdmins.filter(u => {
      if (u.departmentId === user.departmentId) return true;
      if (u.section?.departmentId === user.departmentId) return true;
      return false;
    });
  }

  // Responsável de Seção
  if (user.role === 'resp-secao' && user.sectionId) {
    return agentsAndAdmins.filter(u => u.sectionId === user.sectionId);
  }

  // Agente só pode atribuir para si mesmo
  if (user.role === 'agente') {
    return agentsAndAdmins.filter(u => u.id === user.id);
  }

  return [];
};
```

### Backend - Validação de Hierarquia
O backend deve validar se o usuário tem permissão para atribuir o ticket ao destinatário selecionado, seguindo as mesmas regras hierárquicas.

---

## Interface do Usuário

### Modal de Atribuição
1. **Botão "Atribuir a mim"**
   - Atribui o ticket imediatamente ao usuário logado
   - Desabilitado se já estiver atribuído ao usuário

2. **Busca de Usuários**
   - Campo de busca por nome ou email
   - Lista apenas usuários permitidos pela hierarquia
   - Mostra estrutura organizacional de cada usuário

3. **Indicadores Visuais**
   - 🏢 Direção
   - 💼 Departamento  
   - 👥 Seção

---

## Exemplos de Casos de Uso

### Caso 1: Admin atribui ticket
```
Admin → Pode escolher qualquer agente da organização
Opções: João (TI/Infra/Redes), Maria (RH), Pedro (Financeiro)
```

### Caso 2: Responsável de Direção TI atribui ticket
```
Resp. Direção TI → Pode escolher apenas agentes de TI
Opções: João (TI/Infra/Redes), Ana (TI/Dev), Carlos (TI/Suporte)
NÃO Disponível: Maria (RH), Pedro (Financeiro)
```

### Caso 3: Responsável de Departamento Infraestrutura atribui ticket
```
Resp. Dept. Infra → Pode escolher apenas agentes de Infraestrutura
Opções: João (TI/Infra/Redes), Lucas (TI/Infra/Servidores)
NÃO Disponível: Ana (TI/Dev), Carlos (TI/Suporte)
```

### Caso 4: Responsável de Seção Redes atribui ticket
```
Resp. Seção Redes → Pode escolher apenas agentes de Redes
Opções: João (TI/Infra/Redes), Fernanda (TI/Infra/Redes)
NÃO Disponível: Lucas (TI/Infra/Servidores)
```

### Caso 5: Agente atribui ticket
```
Agente → Pode atribuir apenas para si mesmo
Opções: [Apenas ele mesmo]
```

---

## Arquivos Implementados

### Frontend
- `/portalOrganizaçãoTenant/src/components/AssignTicketModal.jsx`
  - Modal completo de atribuição
  - Filtro hierárquico de usuários
  - Interface intuitiva com busca

- `/portalOrganizaçãoTenant/src/pages/TicketDetail.jsx`
  - Botão "Atribuir" ao lado de "Transferir"
  - Integração com AssignTicketModal

### Backend
- `/backend/src/modules/users/userController.js`
  - GET /users retorna hierarquia completa
  - Includes aninhados: Direction, Department, Section

---

## Próximos Passos

### 1. Validação Backend
Criar middleware para validar hierarquia ao atribuir ticket:
```javascript
const validateAssignment = async (req, res, next) => {
  const { assigneeId } = req.body;
  const currentUser = req.user;
  const targetUser = await User.findByPk(assigneeId);
  
  // Validar se currentUser pode atribuir para targetUser
  // baseado nas regras hierárquicas
};
```

### 2. Cadastro de Usuários
Atualizar formulário de cadastro para:
- Mostrar apenas opções de estrutura permitidas
- Validar hierarquia ao criar usuário
- Permitir definir responsáveis conforme permissões

### 3. Auditoria
Registrar todas as atribuições no histórico do ticket:
```
"João Silva atribuiu o ticket para Maria Santos (TI/Suporte)"
```
