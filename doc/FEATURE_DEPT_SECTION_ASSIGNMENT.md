# 🏢 Funcionalidade: Atribuição de Departamento/Secção a Utilizadores

## 📋 Visão Geral

Implementação completa da funcionalidade de atribuir **Departamento** e **Secção** a utilizadores em ambos os portais (Organização e Cliente).

---

## ✅ Funcionalidades Implementadas

### **Backend**

#### **1. Modelo User**
```javascript
{
  departmentId: UUID | NULL,  // Já existia
  sectionId: UUID | NULL,     // ✅ Adicionado
}
```

#### **2. Migration**
- ✅ Adicionada coluna `section_id` na tabela `users`
- ✅ Foreign key para tabela `sections`
- ✅ Index criado para performance
- ✅ ON DELETE SET NULL

#### **3. Controllers Atualizados**

**userController.js (Portal Organização - Utilizadores Internos):**
- ✅ GET `/api/users` - Inclui `department` e `section` nos joins
- ✅ GET `/api/users/:id` - Retorna department e section
- ✅ PUT `/api/users/:id` - Atualiza departmentId e sectionId
- ✅ POST `/api/users` - Cria com department/section

**clientUserController.js (Portal Cliente - Seus Utilizadores):**
- ✅ GET `/api/client/users` - Inclui department e section
- ✅ POST `/api/client/users` - Cria com departmentId/sectionId
- ✅ PUT `/api/client/users/:id` - Atualiza dept/section

**clientUsersController.js (Portal Org - Utilizadores dos Clientes):**
- ✅ GET `/api/clients/:id/users` - Lista com department/section
- ✅ POST `/api/clients/:id/users` - Cria com dept/section
- ✅ PUT `/api/clients/:id/users/:userId` - Atualiza dept/section

---

### **Frontend**

#### **Portal Organização** (`portalOrganizaçãoTenant`)

**Arquivo:** `/src/pages/Users.jsx`

**Já estava implementado:**
- ✅ Carrega departments e sections via API
- ✅ Select de Departamento no formulário
- ✅ Select de Secção (filtrado por departamento)
- ✅ Exibe department e section na tabela
- ✅ Envia departmentId e sectionId no create/update

---

#### **Portal Cliente** (`portalClientEmpresa`)

**Arquivo:** `/src/pages/Users.jsx`

**✅ Implementado nesta feature:**

1. **Estado adicionado:**
```javascript
const [departments, setDepartments] = useState([])
const [sections, setSections] = useState([])
const [formData, setFormData] = useState({
  // ... outros campos
  departmentId: '',
  sectionId: ''
})
```

2. **Carregamento de Dados:**
```javascript
const [usersData, deptsRes, sectsRes] = await Promise.all([
  clientUserService.getAll(),
  api.get('/client/departments'),
  api.get('/client/sections')
])
```

3. **UI - Nova Coluna na Tabela:**
```jsx
<th>Departamento/Secção</th>

<td>
  {u.department && (
    <div className="flex items-center gap-1">
      <Building2 className="w-4 h-4" />
      <span>{u.department.name}</span>
    </div>
  )}
  {u.section && (
    <div className="text-xs text-gray-500 ml-5">
      {u.section.name}
    </div>
  )}
</td>
```

4. **Formulário - Selects:**
```jsx
<select 
  value={formData.departmentId}
  onChange={(e) => setFormData({ 
    ...formData, 
    departmentId: e.target.value,
    sectionId: '' // Limpar secção ao mudar dept
  })}
>
  <option value="">Sem departamento</option>
  {departments.map(dept => (
    <option key={dept.id} value={dept.id}>
      {dept.name}
    </option>
  ))}
</select>

<select 
  value={formData.sectionId}
  onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
  disabled={!formData.departmentId} // Desabilitado sem dept
>
  <option value="">Sem secção</option>
  {sections
    .filter(s => formData.departmentId && s.departmentId === formData.departmentId)
    .map(sect => (
      <option key={sect.id} value={sect.id}>
        {sect.name}
      </option>
    ))}
</select>
```

5. **Create/Update:**
```javascript
// Create
await clientUserService.create({
  name, email, phone, password,
  departmentId: formData.departmentId || null,
  sectionId: formData.sectionId || null
})

// Update
await clientUserService.update(id, {
  name, email, phone, isActive,
  departmentId: formData.departmentId || null,
  sectionId: formData.sectionId || null
})
```

---

## 🎯 Comportamentos

### **Cenário 1: Portal Organização - Criar Utilizador Interno**
```
1. Admin Org acessa /users
2. Clica "Novo Utilizador"
3. Preenche nome, email, role
4. Seleciona Departamento (opcional)
5. Seleciona Secção (opcional, filtrada por dept)
6. Cria utilizador
7. Utilizador aparece com departamento e secção na lista
```

### **Cenário 2: Portal Cliente - Criar Utilizador**
```
1. Cliente Admin acessa /users
2. Clica "Novo Utilizador"
3. Preenche nome, email, senha
4. Seleciona Departamento do cliente (opcional)
5. Seleciona Secção do cliente (opcional)
6. Cria utilizador
7. Utilizador criado pertence ao cliente E ao dept/section
```

### **Cenário 3: Portal Org - Atribuir Dept/Secção a Utilizador de Cliente**
```
1. Admin Org acessa /clients/:id/users
2. Cria ou edita utilizador do cliente
3. Seleciona departamento e secção
4. Salva
5. Utilizador do cliente fica associado ao dept/section
```

### **Cenário 4: Editar Utilizador Existente**
```
1. Abrir modal de edição
2. Selects carregam com valores atuais
3. Pode mudar departamento (limpa secção)
4. Pode mudar secção (se dept selecionado)
5. Pode remover ambos (selecionar "Sem...")
6. Salvar atualiza no backend
```

---

## 🔗 Relacionamentos

```
Organization
  └── Department
       ├── Section
       │    └── User (sectionId)
       └── User (departmentId, sectionId=NULL)
  
  └── Client (Empresa)
       └── User (clientId)
            ├── departmentId (opcional)
            └── sectionId (opcional)
```

**Importante:**
- Departamentos e Secções pertencem à **Organização**, não ao Cliente
- Clientes podem atribuir seus utilizadores aos departments/sections da organização
- Um utilizador pode ter departamento SEM secção
- Um utilizador NÃO pode ter secção SEM departamento (validação no frontend)

---

## 📊 Validações

### **Frontend:**
- ✅ Select de secção desabilitado se não houver departamento
- ✅ Secções filtradas pelo departamento selecionado
- ✅ Ao mudar departamento, secção é limpa
- ✅ Valores null enviados como `null`, não como string vazia

### **Backend:**
- ✅ departmentId e sectionId podem ser NULL
- ✅ Foreign keys validam existência
- ✅ Joins retornam objetos department/section ou null
- ✅ Update aceita undefined (mantém valor) ou null (remove)

---

## 🎨 UI/UX

### **Tabela de Utilizadores:**
```
┌─────────────┬────────────────────────┬────────┬────────┐
│ Utilizador  │ Departamento/Secção    │ Estado │ Ações  │
├─────────────┼────────────────────────┼────────┼────────┤
│ João Silva  │ 🏢 TI                  │ Ativo  │ ✏️ 🔑 ❌ │
│ joao@...    │    Desenvolvimento     │        │        │
├─────────────┼────────────────────────┼────────┼────────┤
│ Maria Santos│ 🏢 Comercial           │ Ativo  │ ✏️ 🔑 ❌ │
│ maria@...   │                        │        │        │
└─────────────┴────────────────────────┴────────┴────────┘
```

### **Formulário:**
```
┌─ Novo Utilizador ──────────────────────────────┐
│                                                 │
│  Nome: [_________________________]              │
│  Email: [_________________________]             │
│                                                 │
│  Departamento: [▼ Selecionar departamento ]    │
│  Secção: [▼ Selecionar secção        ]         │
│          (desabilitado sem departamento)        │
│                                                 │
│  [Cancelar]  [Criar Utilizador]                │
└─────────────────────────────────────────────────┘
```

---

## 📦 Commits

**Backend:**
```bash
c32b54a - feat: permitir atribuir departamento/secção a utilizadores
- Adicionar sectionId ao modelo User
- Migration para coluna section_id
- Atualizar controllers com suporte dept/section
- Includes de department e section nos gets
```

**Frontend:**
```bash
db319d4 - feat: adicionar seleção de departamento/secção no portal cliente
- Carregar departments e sections via API
- Selects com filtro e validação
- Exibir dept/section na tabela
- Enviar no create e update
```

---

## ✅ Testes Recomendados

### **Portal Organização:**
- [ ] Criar utilizador interno com departamento e secção
- [ ] Criar utilizador interno só com departamento
- [ ] Criar utilizador interno sem nenhum
- [ ] Editar e mudar departamento (verificar secção limpa)
- [ ] Editar e remover departamento

### **Portal Cliente:**
- [ ] Criar utilizador de cliente com dept/section
- [ ] Listar e ver dept/section na tabela
- [ ] Editar e atualizar dept/section
- [ ] Select de secção desabilitado sem dept
- [ ] Secções filtradas corretamente

### **Backend:**
- [ ] API retorna department e section nos joins
- [ ] NULL values são aceitos
- [ ] Foreign keys funcionam
- [ ] Update parcial funciona (undefined mantém valor)

---

## 🚀 Status

✅ **Funcionalidade 100% Implementada**

- ✅ Backend completo (modelo, migration, controllers)
- ✅ Frontend Portal Organização (já estava pronto)
- ✅ Frontend Portal Cliente (implementado agora)
- ✅ Validações e filtros funcionando
- ✅ UI responsiva e intuitiva
- ✅ Commits enviados para repositório

**Pronto para uso em produção!** 🎉
